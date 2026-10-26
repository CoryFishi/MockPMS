// Site plan layout, stored as site_plans.layout. Coordinates are background-image
// pixels; layout.scale converts them to feet.

export type Board = "DR5018S" | "IPQ6018";
export type MotionModel = "PIR-100" | "PIR-200";

export interface EdgeRouterNode {
  id: string;
  type: "edgeRouter";
  x: number;
  y: number;
  label: string;
  board: Board;
  ispHandoff: boolean;
}

export interface AccessPointNode {
  id: string;
  type: "accessPoint";
  x: number;
  y: number;
  label: string;
  board: Board;
}

export interface PoeSwitchNode {
  id: string;
  type: "poeSwitch";
  x: number;
  y: number;
  label: string;
}

export interface SmartLockNode {
  id: string;
  type: "smartLock";
  x: number;
  y: number;
  unit: string;
  /** Direction the door faces, degrees clockwise from east (screen coordinates). */
  facingDeg: number;
  group: string;
}

export interface SmartMotionNode {
  id: string;
  type: "smartMotion";
  x: number;
  y: number;
  model: MotionModel;
  area: string;
  unit: string;
}

export type PlanNode = EdgeRouterNode | AccessPointNode | PoeSwitchNode | SmartLockNode | SmartMotionNode;
export type NodeType = PlanNode["type"];
export type OpenNetNode = EdgeRouterNode | AccessPointNode;
export type SensorNode = SmartLockNode | SmartMotionNode;

export type LinkKind = "wired" | "tether";

/** An explicit cable between OpenNet devices / PoE switches. Wireless links are inferred. */
export interface PlanLink {
  id: string;
  from: string;
  to: string;
  kind: LinkKind;
}

export type ShapeKind = "building" | "wall";

/** `points` is a flat [x1, y1, x2, y2, …] list. Buildings are closed; walls are polylines. */
export interface PlanShape {
  id: string;
  kind: ShapeKind;
  points: number[];
}

export interface PlanBackground {
  /** Object path in the site-plan-backgrounds bucket. */
  path: string;
  width: number;
  height: number;
}

export interface PlanScale {
  pxPerFt: number;
  ref: { x1: number; y1: number; x2: number; y2: number; feet: number };
}

export interface PlanLayout {
  version: 1;
  background: PlanBackground | null;
  scale: PlanScale | null;
  nodes: PlanNode[];
  links: PlanLink[];
  shapes: PlanShape[];
}

export interface PlanSummary {
  edgeRouters: number;
  accessPoints: number;
  poeSwitches: number;
  smartLocks: number;
  smartMotion100: number;
  smartMotion200: number;
}

export interface Point {
  x: number;
  y: number;
}

export function isOpenNet(node: PlanNode): node is OpenNetNode {
  return node.type === "edgeRouter" || node.type === "accessPoint";
}

export function isSensor(node: PlanNode): node is SensorNode {
  return node.type === "smartLock" || node.type === "smartMotion";
}

export function emptyLayout(): PlanLayout {
  return { version: 1, background: null, scale: null, nodes: [], links: [], shapes: [] };
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  edgeRouter: "Edge Router",
  accessPoint: "Access Point",
  poeSwitch: "PoE Switch",
  smartLock: "SmartLock",
  smartMotion: "SmartMotion",
};

/** Short on-map name for a node. */
export function nodeName(node: PlanNode): string {
  switch (node.type) {
    case "edgeRouter":
    case "accessPoint":
    case "poeSwitch":
      return node.label;
    case "smartLock":
      return node.unit ? `Lock ${node.unit}` : "Lock";
    case "smartMotion":
      return node.area || (node.unit ? `Unit ${node.unit}` : "Motion");
  }
}
