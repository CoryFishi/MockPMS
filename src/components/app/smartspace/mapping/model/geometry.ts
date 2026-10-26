import type { PlanShape, Point } from "@views/smartspace/mapping/model/types";

export interface Segment {
  a: Point;
  b: Point;
}

export function dist(p: Point, q: Point): number {
  return Math.hypot(q.x - p.x, q.y - p.y);
}

function orient(p: Point, q: Point, r: Point): number {
  const v = (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return Math.abs(v) < 1e-9 ? 0 : Math.sign(v);
}

function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    Math.min(p.x, r.x) - 1e-9 <= q.x && q.x <= Math.max(p.x, r.x) + 1e-9 &&
    Math.min(p.y, r.y) - 1e-9 <= q.y && q.y <= Math.max(p.y, r.y) + 1e-9
  );
}

/** True when segment p1–p2 touches or crosses segment q1–q2. */
export function segmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point): boolean {
  const o1 = orient(p1, p2, q1);
  const o2 = orient(p1, p2, q2);
  const o3 = orient(q1, q2, p1);
  const o4 = orient(q1, q2, p2);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, q1, p2)) return true;
  if (o2 === 0 && onSegment(p1, q2, p2)) return true;
  if (o3 === 0 && onSegment(q1, p1, q2)) return true;
  if (o4 === 0 && onSegment(q1, p2, q2)) return true;
  return false;
}

/** Flattens every wall polyline into its segments. */
export function wallSegments(shapes: PlanShape[]): Segment[] {
  const segments: Segment[] = [];
  for (const shape of shapes) {
    if (shape.kind !== "wall") continue;
    for (let i = 0; i + 3 < shape.points.length; i += 2) {
      segments.push({
        a: { x: shape.points[i], y: shape.points[i + 1] },
        b: { x: shape.points[i + 2], y: shape.points[i + 3] },
      });
    }
  }
  return segments;
}

export function crossesAnyWall(p: Point, q: Point, walls: Segment[]): boolean {
  const minX = Math.min(p.x, q.x);
  const maxX = Math.max(p.x, q.x);
  const minY = Math.min(p.y, q.y);
  const maxY = Math.max(p.y, q.y);
  for (const w of walls) {
    if (Math.max(w.a.x, w.b.x) < minX || Math.min(w.a.x, w.b.x) > maxX) continue;
    if (Math.max(w.a.y, w.b.y) < minY || Math.min(w.a.y, w.b.y) > maxY) continue;
    if (segmentsIntersect(p, q, w.a, w.b)) return true;
  }
  return false;
}

/**
 * True when `p` lies inside an ellipse centred on `center` with semi-axis `along`
 * in the `facingDeg` direction and `across` perpendicular to it (all in px).
 */
export function inEllipse(center: Point, facingDeg: number, along: number, across: number, p: Point): boolean {
  const rad = (facingDeg * Math.PI) / 180;
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  const u = dx * Math.cos(rad) + dy * Math.sin(rad);
  const v = -dx * Math.sin(rad) + dy * Math.cos(rad);
  return (u * u) / (along * along) + (v * v) / (across * across) <= 1;
}

export function inCircle(center: Point, radius: number, p: Point): boolean {
  return dist(center, p) <= radius;
}

/** Centres of `n` equal segments along a→b. */
export function pointsAlong(a: Point, b: Point, n: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return points;
}

/** Facing (degrees clockwise from east) perpendicular to a→b; `flip` picks the other side. */
export function perpendicularDeg(a: Point, b: Point, flip: boolean): number {
  const along = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  return normalizeDeg(along + (flip ? -90 : 90));
}

export function normalizeDeg(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundsOf(points: Point[]): Bounds | null {
  if (points.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/** Shortest distance from `p` to segment a–b. */
export function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}
