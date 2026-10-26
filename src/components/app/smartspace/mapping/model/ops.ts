// Pure layout edits used by the editor. Every function returns a new layout.

import { nextUnit } from "@views/smartspace/mapping/model/unitNumbers";
import type {
  LinkKind,
  NodeType,
  PlanLayout,
  PlanLink,
  PlanNode,
  PlanShape,
  Point,
  ShapeKind,
} from "@views/smartspace/mapping/model/types";

export const newId = () => crypto.randomUUID();

export type PlaceableType = NodeType;

/** A new node of `type` at `p`, labelled/numbered after the existing ones. */
export function createNode(layout: PlanLayout, type: PlaceableType, p: Point): PlanNode {
  const count = (t: NodeType) => layout.nodes.filter((n) => n.type === t).length;
  const base = { id: newId(), x: p.x, y: p.y };
  switch (type) {
    case "edgeRouter":
      return { ...base, type, label: `ER ${count(type) + 1}`, board: "DR5018S", ispHandoff: count(type) === 0 };
    case "accessPoint":
      return { ...base, type, label: `AP ${count(type) + 1}`, board: "DR5018S" };
    case "poeSwitch":
      return { ...base, type, label: `Switch ${count(type) + 1}` };
    case "smartLock": {
      const last = [...layout.nodes].reverse().find((n) => n.type === "smartLock");
      return {
        ...base,
        type,
        unit: last && last.type === "smartLock" && last.unit ? nextUnit(last.unit) : "101",
        facingDeg: last && last.type === "smartLock" ? last.facingDeg : 90,
        group: last && last.type === "smartLock" ? last.group : "",
      };
    }
    case "smartMotion":
      return { ...base, type, model: "PIR-100", area: "", unit: "" };
  }
}

export function addNodes(layout: PlanLayout, nodes: PlanNode[]): PlanLayout {
  return { ...layout, nodes: [...layout.nodes, ...nodes] };
}

export function updateNodes(layout: PlanLayout, ids: Set<string>, patch: (node: PlanNode) => PlanNode): PlanLayout {
  return { ...layout, nodes: layout.nodes.map((n) => (ids.has(n.id) ? patch(n) : n)) };
}

export function moveNodes(layout: PlanLayout, origins: Map<string, Point>, dx: number, dy: number): PlanLayout {
  return {
    ...layout,
    nodes: layout.nodes.map((n) => {
      const o = origins.get(n.id);
      return o ? { ...n, x: o.x + dx, y: o.y + dy } : n;
    }),
  };
}

/** Removes nodes, links and shapes by id, plus links attached to removed nodes. */
export function deleteIds(layout: PlanLayout, ids: Set<string>): PlanLayout {
  return {
    ...layout,
    nodes: layout.nodes.filter((n) => !ids.has(n.id)),
    links: layout.links.filter((l) => !ids.has(l.id) && !ids.has(l.from) && !ids.has(l.to)),
    shapes: layout.shapes.filter((s) => !ids.has(s.id)),
  };
}

export function addLink(layout: PlanLayout, from: string, to: string, kind: LinkKind): PlanLayout | null {
  if (from === to) return null;
  const exists = layout.links.some(
    (l) => (l.from === from && l.to === to) || (l.from === to && l.to === from),
  );
  if (exists) return null;
  const link: PlanLink = { id: newId(), from, to, kind };
  return { ...layout, links: [...layout.links, link] };
}

export function addShape(layout: PlanLayout, kind: ShapeKind, points: number[]): PlanLayout {
  const shape: PlanShape = { id: newId(), kind, points };
  return { ...layout, shapes: [...layout.shapes, shape] };
}

export interface Clipboard {
  nodes: PlanNode[];
  links: PlanLink[];
  shapes: PlanShape[];
}

export function copySelection(layout: PlanLayout, ids: Set<string>): Clipboard | null {
  const nodes = layout.nodes.filter((n) => ids.has(n.id));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const links = layout.links.filter((l) => nodeIds.has(l.from) && nodeIds.has(l.to));
  const shapes = layout.shapes.filter((s) => ids.has(s.id));
  if (nodes.length === 0 && shapes.length === 0) return null;
  return { nodes, links, shapes };
}

/** Pastes with fresh ids, offset by `offset` px. Returns the layout and the new ids. */
export function paste(layout: PlanLayout, clip: Clipboard, offset: number): { layout: PlanLayout; ids: string[] } {
  const idMap = new Map<string, string>();
  const nodes = clip.nodes.map((n) => {
    const id = newId();
    idMap.set(n.id, id);
    return { ...n, id, x: n.x + offset, y: n.y + offset };
  });
  const links = clip.links.map((l) => ({ ...l, id: newId(), from: idMap.get(l.from)!, to: idMap.get(l.to)! }));
  const shapes = clip.shapes.map((s) => ({
    ...s,
    id: newId(),
    points: s.points.map((v) => v + offset),
  }));
  return {
    layout: {
      ...layout,
      nodes: [...layout.nodes, ...nodes],
      links: [...layout.links, ...links],
      shapes: [...layout.shapes, ...shapes],
    },
    ids: [...nodes.map((n) => n.id), ...shapes.map((s) => s.id)],
  };
}
