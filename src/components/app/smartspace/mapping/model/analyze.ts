// Rule-based coverage analysis (spec §Coverage analysis). Pure: layout in, analysis out.

import { RULES } from "@views/smartspace/mapping/model/rules";
import {
  crossesAnyWall,
  dist,
  inCircle,
  inEllipse,
  wallSegments,
} from "@views/smartspace/mapping/model/geometry";
import {
  isOpenNet,
  isSensor,
  nodeName,
  type OpenNetNode,
  type PlanLayout,
  type PlanNode,
  type Point,
  type SensorNode,
} from "@views/smartspace/mapping/model/types";

export type Severity = "error" | "warning";

export interface Issue {
  id: string;
  severity: Severity;
  message: string;
  nodeIds: string[];
}

export interface WirelessLink {
  from: string;
  to: string;
  los: boolean;
  /** "opennet" = ER/AP ↔ ER/AP; "sensor" = anything involving a sensor. */
  kind: "opennet" | "sensor";
}

export interface Analysis {
  calibrated: boolean;
  /** Every inferred wireless link. */
  wirelessLinks: WirelessLink[];
  /** Sensor id → the neighbour it routes through (an ER/AP or another sensor). */
  parent: Record<string, string>;
  /** Sensor id → the ER/AP it is assigned to. */
  assignment: Record<string, string>;
  hops: Record<string, number>;
  /** ER/AP id → number of sensors assigned to it. */
  load: Record<string, number>;
  issues: Issue[];
  nodeSeverity: Record<string, Severity>;
}

/** Sensor reach test: does `sensor`'s range (scaled by `factor`) contain `p`? */
function sensorReaches(sensor: SensorNode, p: Point, pxPerFt: number, factor: number): boolean {
  if (sensor.type === "smartLock") {
    return inEllipse(
      sensor,
      sensor.facingDeg,
      RULES.LOCK_ACROSS_FT * pxPerFt * factor,
      RULES.LOCK_LATERAL_FT * pxPerFt * factor,
      p,
    );
  }
  return inCircle(sensor, RULES.MOTION_FT * pxPerFt * factor, p);
}

function maxSensorReachFt(sensor: SensorNode): number {
  return sensor.type === "smartLock" ? RULES.LOCK_ACROSS_FT : RULES.MOTION_FT;
}

class Issues {
  list: Issue[] = [];
  add(code: string, severity: Severity, message: string, nodeIds: string[]) {
    this.list.push({ id: `${code}:${nodeIds.join(",")}`, severity, message, nodeIds });
  }
}

function addTo(map: Map<string, Set<string>>, a: string, b: string) {
  let set = map.get(a);
  if (!set) map.set(a, (set = new Set()));
  set.add(b);
}

export function analyzePlan(layout: PlanLayout): Analysis {
  const issues = new Issues();
  const nodes = layout.nodes;
  const byId = new Map<string, PlanNode>(nodes.map((n) => [n.id, n]));
  const openNet = nodes.filter(isOpenNet);
  const sensors = nodes.filter(isSensor);
  const edgeRouters = openNet.filter((n) => n.type === "edgeRouter");

  // --- Scale-independent checks ------------------------------------------
  if (nodes.length > 0 && edgeRouters.length === 0) {
    issues.add("no-er", "error", "The plan has no Edge Router.", []);
  } else if (edgeRouters.length > 0 && !edgeRouters.some((n) => n.type === "edgeRouter" && n.ispHandoff)) {
    issues.add("no-isp", "warning", "No Edge Router is marked as the ISP handoff.", edgeRouters.map((n) => n.id));
  }

  const locksByUnit = new Map<string, string[]>();
  for (const s of sensors) {
    if (s.type === "smartLock") {
      const unit = s.unit.trim();
      if (!unit) {
        issues.add("lock-no-unit", "warning", "SmartLock has no unit number.", [s.id]);
        continue;
      }
      const key = unit.toLowerCase();
      locksByUnit.set(key, [...(locksByUnit.get(key) ?? []), s.id]);
    } else if (!s.area.trim() && !s.unit.trim()) {
      issues.add("motion-unassigned", "warning", "SmartMotion has neither an area nor a unit.", [s.id]);
    }
  }
  for (const ids of locksByUnit.values()) {
    if (ids.length > 1) {
      const unit = (byId.get(ids[0]) as SensorNode).unit;
      issues.add("dup-unit", "warning", `${ids.length} SmartLocks share unit ${unit}.`, ids);
    }
  }

  const pxPerFt = layout.scale?.pxPerFt ?? 0;
  const calibrated = pxPerFt > 0;
  const empty: Analysis = {
    calibrated,
    wirelessLinks: [],
    parent: {},
    assignment: {},
    hops: {},
    load: {},
    issues: issues.list,
    nodeSeverity: severityByNode(issues.list),
  };
  if (!calibrated) return empty;

  const walls = wallSegments(layout.shapes);
  const wirelessLinks: WirelessLink[] = [];

  // --- OpenNet ↔ OpenNet ----------------------------------------------------
  // `onAdj` holds every OpenNet neighbour; explicit links through PoE switches
  // are resolved to the OpenNet devices on the other side.
  const onAdj = new Map<string, Set<string>>();
  for (let i = 0; i < openNet.length; i++) {
    for (let j = i + 1; j < openNet.length; j++) {
      const a = openNet[i];
      const b = openNet[j];
      const d = dist(a, b);
      if (d > RULES.OPENNET_LOS_FT * pxPerFt) continue;
      const los = !crossesAnyWall(a, b, walls);
      if (!los && d > RULES.OPENNET_NLOS_FT * pxPerFt) continue;
      wirelessLinks.push({ from: a.id, to: b.id, los, kind: "opennet" });
      addTo(onAdj, a.id, b.id);
      addTo(onAdj, b.id, a.id);
    }
  }

  const cableAdj = new Map<string, Set<string>>();
  for (const link of layout.links) {
    if (!byId.has(link.from) || !byId.has(link.to)) continue;
    addTo(cableAdj, link.from, link.to);
    addTo(cableAdj, link.to, link.from);
  }
  for (const node of openNet) {
    // Walk cables, passing through PoE switches, collecting OpenNet devices.
    const seen = new Set([node.id]);
    const stack = [node.id];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const next of cableAdj.get(cur) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        const n = byId.get(next);
        if (!n) continue;
        if (isOpenNet(n)) addTo(onAdj, node.id, n.id);
        else if (n.type === "poeSwitch") stack.push(next);
      }
    }
  }

  const connectedToEr = new Set<string>(edgeRouters.map((n) => n.id));
  {
    const queue = [...connectedToEr];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of onAdj.get(cur) ?? []) {
        if (!connectedToEr.has(next)) {
          connectedToEr.add(next);
          queue.push(next);
        }
      }
    }
  }

  for (const node of openNet) {
    const neighbours = onAdj.get(node.id)?.size ?? 0;
    if (neighbours < RULES.AP_MIN_OPENNET_NEIGHBOURS) {
      issues.add(
        "on-neighbours",
        "error",
        `${node.label} reaches ${neighbours} OpenNet device${neighbours === 1 ? "" : "s"}; needs ${RULES.AP_MIN_OPENNET_NEIGHBOURS}.`,
        [node.id],
      );
    }
    if (edgeRouters.length > 0 && !connectedToEr.has(node.id)) {
      issues.add("on-unreachable", "error", `${node.label} has no path to an Edge Router.`, [node.id]);
    }
  }

  // --- Sensors --------------------------------------------------------------
  const sensorAdj = new Map<string, Set<string>>();
  const sensorToOn = new Map<string, OpenNetNode[]>();
  const losSensors = new Map<string, number>();

  // Uniform grid so sensor pairs are only tested against nearby cells.
  const cell = RULES.LOCK_ACROSS_FT * pxPerFt;
  const grid = new Map<string, SensorNode[]>();
  const cellKey = (cx: number, cy: number) => `${cx},${cy}`;
  for (const s of sensors) {
    const key = cellKey(Math.floor(s.x / cell), Math.floor(s.y / cell));
    const bucket = grid.get(key);
    if (bucket) bucket.push(s);
    else grid.set(key, [s]);
  }

  const index = new Map(sensors.map((s, i) => [s.id, i]));
  for (const a of sensors) {
    const cx = Math.floor(a.x / cell);
    const cy = Math.floor(a.y / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        for (const b of grid.get(cellKey(gx, gy)) ?? []) {
          if (index.get(b.id)! <= index.get(a.id)!) continue;
          const d = dist(a, b);
          if (d > Math.min(maxSensorReachFt(a), maxSensorReachFt(b)) * pxPerFt) continue;
          if (!sensorReaches(a, b, pxPerFt, 1) || !sensorReaches(b, a, pxPerFt, 1)) continue;
          const los = !crossesAnyWall(a, b, walls);
          if (!los && (!sensorReaches(a, b, pxPerFt, RULES.WALL_FACTOR) || !sensorReaches(b, a, pxPerFt, RULES.WALL_FACTOR))) {
            continue;
          }
          wirelessLinks.push({ from: a.id, to: b.id, los, kind: "sensor" });
          addTo(sensorAdj, a.id, b.id);
          addTo(sensorAdj, b.id, a.id);
        }
      }
    }
  }

  for (const s of sensors) {
    for (const on of openNet) {
      if (!sensorReaches(s, on, pxPerFt, 1)) continue;
      const los = !crossesAnyWall(s, on, walls);
      if (!los && !sensorReaches(s, on, pxPerFt, RULES.WALL_FACTOR)) continue;
      wirelessLinks.push({ from: s.id, to: on.id, los, kind: "sensor" });
      sensorToOn.set(s.id, [...(sensorToOn.get(s.id) ?? []), on]);
      if (los) losSensors.set(on.id, (losSensors.get(on.id) ?? 0) + 1);
    }
  }

  // --- Assignment: layered BFS from the sinks --------------------------------
  // Sinks are ER/APs that reach an Edge Router (all ER/APs when there is no ER,
  // so assignments still show while the plan is incomplete).
  const isSink = (on: OpenNetNode) => edgeRouters.length === 0 || connectedToEr.has(on.id);
  const parent: Record<string, string> = {};
  const assignment: Record<string, string> = {};
  const hops: Record<string, number> = {};

  let frontier: string[] = [];
  for (const s of sensors) {
    const sinks = (sensorToOn.get(s.id) ?? []).filter(isSink);
    if (sinks.length === 0) continue;
    let best = sinks[0];
    for (const on of sinks) if (dist(s, on) < dist(s, best)) best = on;
    parent[s.id] = best.id;
    assignment[s.id] = best.id;
    hops[s.id] = 1;
    frontier.push(s.id);
  }
  while (frontier.length) {
    const candidates = new Map<string, string[]>(); // next sensor → parents in this layer
    for (const id of frontier) {
      for (const next of sensorAdj.get(id) ?? []) {
        if (hops[next] !== undefined) continue;
        candidates.set(next, [...(candidates.get(next) ?? []), id]);
      }
    }
    const nextFrontier: string[] = [];
    for (const [id, parents] of candidates) {
      const node = byId.get(id)!;
      let bestParent = parents[0];
      let bestDist = Infinity;
      for (const p of parents) {
        const d = dist(node, byId.get(assignment[p])!);
        if (d < bestDist) {
          bestDist = d;
          bestParent = p;
        }
      }
      parent[id] = bestParent;
      assignment[id] = assignment[bestParent];
      hops[id] = hops[bestParent] + 1;
      nextFrontier.push(id);
    }
    frontier = nextFrontier;
  }

  const load: Record<string, number> = {};
  for (const apId of Object.values(assignment)) load[apId] = (load[apId] ?? 0) + 1;

  for (const s of sensors) {
    const sensorNeighbours = sensorAdj.get(s.id)?.size ?? 0;
    const onNeighbours = sensorToOn.get(s.id)?.length ?? 0;
    if (s.type === "smartLock") {
      if (onNeighbours === 0 && sensorNeighbours < RULES.LOCK_MIN_SENSOR_NEIGHBOURS) {
        issues.add(
          "lock-neighbours",
          "error",
          `${nodeName(s)} reaches ${sensorNeighbours} sensor${sensorNeighbours === 1 ? "" : "s"} and no Access Point; needs ${RULES.LOCK_MIN_SENSOR_NEIGHBOURS} sensors or an Access Point.`,
          [s.id],
        );
      }
    } else if (onNeighbours + sensorNeighbours < RULES.MOTION_MIN_NEIGHBOURS) {
      issues.add("motion-neighbours", "error", `${nodeName(s)} reaches no sensor or Access Point.`, [s.id]);
    }
  }

  const unreachable = sensors.filter((s) => assignment[s.id] === undefined).map((s) => s.id);
  if (unreachable.length > 0 && openNet.length > 0) {
    issues.add(
      "sensor-unreachable",
      "error",
      `${unreachable.length} sensor${unreachable.length === 1 ? " has" : "s have"} no mesh path to an Access Point${edgeRouters.length > 0 ? " connected to an Edge Router" : ""}.`,
      unreachable,
    );
  } else if (unreachable.length > 0) {
    issues.add("sensor-unreachable", "error", "There are sensors but no Edge Router or Access Point.", unreachable);
  }

  for (const on of openNet) {
    const n = load[on.id] ?? 0;
    if (n > RULES.AP_CAPACITY) {
      issues.add("ap-capacity", "warning", `${on.label} serves ${n} sensors (about ${RULES.AP_CAPACITY} max).`, [on.id]);
    }
    const los = losSensors.get(on.id) ?? 0;
    if (sensors.length > 0 && los < RULES.AP_MIN_LOS_SENSORS) {
      issues.add(
        "ap-los",
        "warning",
        `${on.label} has ${los} line-of-sight sensor${los === 1 ? "" : "s"}; ${RULES.AP_MIN_LOS_SENSORS} recommended.`,
        [on.id],
      );
    }
  }

  return {
    calibrated,
    wirelessLinks,
    parent,
    assignment,
    hops,
    load,
    issues: issues.list.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1)),
    nodeSeverity: severityByNode(issues.list),
  };
}

function severityByNode(list: Issue[]): Record<string, Severity> {
  const out: Record<string, Severity> = {};
  for (const issue of list) {
    for (const id of issue.nodeIds) {
      if (out[id] !== "error") out[id] = issue.severity;
    }
  }
  return out;
}

