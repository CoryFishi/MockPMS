export interface View {
  x: number;
  y: number;
  scale: number;
}

export interface Size {
  width: number;
  height: number;
}

export type RangeMode = "off" | "selected" | "all";
export type SelectMode = "replace" | "add" | "toggle";

/** Canvas used when a plan has no background image. */
export const BLANK_SIZE: Size = { width: 4000, height: 3000 };
export const MIN_SCALE = 0.02;
export const MAX_SCALE = 8;
