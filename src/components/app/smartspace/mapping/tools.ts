import type { NodeType } from "@views/smartspace/mapping/model/types";

export type Tool =
  | "select"
  | "pan"
  | NodeType
  | "row"
  | "building"
  | "wall"
  | "wired"
  | "tether"
  | "scale";

export interface ToolInfo {
  id: Tool;
  label: string;
  /** Single-key shortcut (lowercase). */
  key: string;
  hint: string;
}

export const TOOLS: ToolInfo[] = [
  { id: "select", label: "Select", key: "v", hint: "Click, shift-click or drag a box to select. Drag to move." },
  { id: "pan", label: "Pan", key: "h", hint: "Drag to pan. Space-drag or middle-drag pans with any tool." },
  { id: "edgeRouter", label: "Edge Router", key: "e", hint: "Click to place an Edge Router." },
  { id: "accessPoint", label: "Access Point", key: "a", hint: "Click to place an Access Point." },
  { id: "poeSwitch", label: "PoE Switch", key: "p", hint: "Click to place a PoE switch." },
  { id: "smartLock", label: "SmartLock", key: "l", hint: "Click to place a SmartLock on a door." },
  { id: "smartMotion", label: "SmartMotion", key: "m", hint: "Click to place a SmartMotion sensor." },
  { id: "row", label: "Row of Doors", key: "r", hint: "Click the start and end of a row of doors." },
  { id: "building", label: "Building", key: "b", hint: "Click corners; double-click or Enter to close. Esc cancels." },
  { id: "wall", label: "Wall", key: "w", hint: "Click points; double-click or Enter to finish. Walls block line of sight." },
  { id: "wired", label: "Wired Link", key: "k", hint: "Click two OpenNet devices or PoE switches to cable them." },
  { id: "tether", label: "Tether", key: "t", hint: "Click two Access Points to tether them by Ethernet." },
  { id: "scale", label: "Set Scale", key: "c", hint: "Click two points a known distance apart." },
];

export const TOOL_BY_KEY = new Map(TOOLS.map((t) => [t.key, t.id]));
export const TOOL_INFO = new Map(TOOLS.map((t) => [t.id, t]));
