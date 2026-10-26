import type { ComponentType, ReactNode } from "react";
import {
  MdCable,
  MdDeviceHub,
  MdDownload,
  MdFitScreen,
  MdHorizontalRule,
  MdLock,
  MdNearMe,
  MdOutlineCropSquare,
  MdOutlineImage,
  MdPanTool,
  MdRedo,
  MdRouter,
  MdSave,
  MdSensors,
  MdSettingsEthernet,
  MdStraighten,
  MdUndo,
  MdViewWeek,
  MdWifi,
} from "react-icons/md";
import { TOOL_INFO, type Tool } from "@views/smartspace/mapping/tools";
import type { RangeMode } from "@views/smartspace/mapping/view";

const TOOL_ICONS: Record<Tool, ComponentType<{ className?: string }>> = {
  select: MdNearMe,
  pan: MdPanTool,
  edgeRouter: MdRouter,
  accessPoint: MdWifi,
  poeSwitch: MdDeviceHub,
  smartLock: MdLock,
  smartMotion: MdSensors,
  row: MdViewWeek,
  building: MdOutlineCropSquare,
  wall: MdHorizontalRule,
  wired: MdCable,
  tether: MdSettingsEthernet,
  scale: MdStraighten,
};

const GROUPS: Tool[][] = [
  ["select", "pan"],
  ["edgeRouter", "accessPoint", "poeSwitch", "smartLock", "smartMotion", "row"],
  ["wired", "tether"],
  ["building", "wall", "scale"],
];

function IconButton({
  title,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1 rounded px-1.5 text-lg disabled:cursor-default disabled:opacity-40 ${
        active
          ? "bg-yellow-500 text-white"
          : "hover:bg-zinc-300 dark:hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <div className="mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-700" />;

export interface EditorToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  ranges: RangeMode;
  setRanges: (mode: RangeMode) => void;
  showLinks: boolean;
  setShowLinks: (show: boolean) => void;
  zoom: number;
  onFit: () => void;
  hasBackground: boolean;
  onBackground: () => void;
  onExportPng: () => void;
  onExportCsv: () => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}

export default function EditorToolbar(p: EditorToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-zinc-300 bg-zinc-100 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-900">
      {GROUPS.map((group, i) => (
        <div key={i} className="flex items-center gap-0.5">
          {i > 0 && <Divider />}
          {group.map((id) => {
            const Icon = TOOL_ICONS[id];
            const info = TOOL_INFO.get(id)!;
            return (
              <IconButton key={id} title={`${info.label} (${info.key.toUpperCase()}) — ${info.hint}`} active={p.tool === id} onClick={() => p.setTool(id)}>
                <Icon />
              </IconButton>
            );
          })}
        </div>
      ))}
      <Divider />
      <IconButton title="Undo (Ctrl+Z)" onClick={p.onUndo} disabled={!p.canUndo}>
        <MdUndo />
      </IconButton>
      <IconButton title="Redo (Ctrl+Shift+Z)" onClick={p.onRedo} disabled={!p.canRedo}>
        <MdRedo />
      </IconButton>
      <Divider />
      <label className="flex items-center gap-1 text-xs">
        Ranges
        <select
          value={p.ranges}
          onChange={(e) => p.setRanges(e.target.value as RangeMode)}
          className="rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="off">Off</option>
          <option value="selected">Selected</option>
          <option value="all">All</option>
        </select>
      </label>
      <label className="ml-2 flex cursor-pointer items-center gap-1 text-xs">
        <input type="checkbox" checked={p.showLinks} onChange={(e) => p.setShowLinks(e.target.checked)} />
        Mesh links
      </label>
      <Divider />
      <IconButton title="Fit to screen" onClick={p.onFit}>
        <MdFitScreen />
      </IconButton>
      <span className="w-12 text-center text-xs tabular-nums text-zinc-500">{Math.round(p.zoom * 100)}%</span>
      <div className="ml-auto flex items-center gap-0.5">
        <IconButton title={p.hasBackground ? "Replace site plan image" : "Upload site plan image"} onClick={p.onBackground}>
          <MdOutlineImage />
        </IconButton>
        <IconButton title="Export map as PNG" onClick={p.onExportPng}>
          <MdDownload />
          <span className="text-xs">PNG</span>
        </IconButton>
        <IconButton title="Export lock install sheet (CSV)" onClick={p.onExportCsv}>
          <MdDownload />
          <span className="text-xs">CSV</span>
        </IconButton>
        <button
          type="button"
          onClick={p.onSave}
          disabled={p.saving}
          title="Save (Ctrl+S)"
          className={`ml-2 flex cursor-pointer items-center gap-1 rounded px-3 py-1 text-sm font-bold text-white disabled:cursor-wait ${
            p.dirty ? "bg-green-500 hover:bg-green-600" : "bg-zinc-400 hover:bg-zinc-500"
          }`}
        >
          <MdSave />
          {p.saving ? "Saving..." : p.dirty ? "Save" : "Saved"}
        </button>
      </div>
    </div>
  );
}
