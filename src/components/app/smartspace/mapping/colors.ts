import type { Severity } from "@views/smartspace/mapping/model/analyze";

export const NODE_COLORS = {
  edgeRouter: "#7c3aed",
  accessPoint: "#2563eb",
  poeSwitch: "#52525b",
  unassigned: "#a1a1aa",
};

/** One colour per ER/AP; its sensors are filled with it. */
export const ASSIGNMENT_PALETTE = [
  "#16a34a",
  "#ea580c",
  "#0891b2",
  "#c026d3",
  "#ca8a04",
  "#4f46e5",
  "#db2777",
  "#65a30d",
  "#0d9488",
  "#9333ea",
];

export const SEVERITY_COLORS: Record<Severity, string> = {
  error: "#ef4444",
  warning: "#f59e0b",
};

export const SELECTION_COLOR = "#eab308";

export const LINK_COLORS = {
  wired: "#18181b",
  tether: "#ea580c",
  opennet: "#2563eb",
  sensor: "#71717a",
};

export const SHAPE_COLORS = {
  building: "#a16207",
  wall: "#b91c1c",
};
