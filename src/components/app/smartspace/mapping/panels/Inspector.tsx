import type { ReactNode } from "react";
import InputBox from "@components/ui/InputBox";
import SelectOption from "@components/ui/SelectOption";
import SliderButton from "@components/ui/SliderButton";
import { normalizeDeg } from "@views/smartspace/mapping/model/geometry";
import { RULES } from "@views/smartspace/mapping/model/rules";
import type { Analysis } from "@views/smartspace/mapping/model/analyze";
import {
  NODE_TYPE_LABELS,
  nodeName,
  type Board,
  type MotionModel,
  type PlanLayout,
  type PlanNode,
} from "@views/smartspace/mapping/model/types";

const BOARDS = [
  { id: "DR5018S", name: "DR5018S" },
  { id: "IPQ6018", name: "IPQ6018 (discontinued)" },
];
const MOTION_MODELS = [
  { id: "PIR-100", name: "PIR-100 (2 AA lithium)" },
  { id: "PIR-200", name: "PIR-200 (4 AA alkaline)" },
];

type Patch = (node: PlanNode) => PlanNode;

interface Props {
  layout: PlanLayout;
  analysis: Analysis;
  selection: Set<string>;
  /** Live edit (no undo step); the step is committed when the field loses focus. */
  onEdit: (ids: Set<string>, patch: Patch) => void;
  /** Immediate edit with its own undo step (buttons, selects, toggles). */
  onEditCommit: (ids: Set<string>, patch: Patch) => void;
  onCommit: () => void;
  onDelete: () => void;
}

function Field({ children }: { children: ReactNode }) {
  return <div className="mt-4">{children}</div>;
}

function SmallButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded bg-zinc-200 px-2 py-1 text-xs font-semibold hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
    >
      {children}
    </button>
  );
}

function FacingControls({ ids, value, onEdit, onEditCommit }: { ids: Set<string>; value: number | null; onEdit: Props["onEdit"]; onEditCommit: Props["onEditCommit"] }) {
  const rotate = (delta: number) =>
    onEditCommit(ids, (n) => (n.type === "smartLock" ? { ...n, facingDeg: normalizeDeg(n.facingDeg + delta) } : n));
  return (
    <Field>
      <InputBox
        type="number"
        placeholder={value === null ? "Facing (mixed)" : "Facing (degrees, 0 = east, 90 = south)"}
        value={value === null ? "" : String(Math.round(value))}
        onchange={(e: { target: { value: string } }) => {
          const deg = parseFloat(e.target.value);
          if (!Number.isNaN(deg)) onEdit(ids, (n) => (n.type === "smartLock" ? { ...n, facingDeg: normalizeDeg(deg) } : n));
        }}
      />
      <div className="mt-2 flex gap-1">
        <SmallButton onClick={() => rotate(-90)}>⟲ 90°</SmallButton>
        <SmallButton onClick={() => rotate(90)}>⟳ 90°</SmallButton>
        <SmallButton onClick={() => rotate(180)}>Flip</SmallButton>
      </div>
    </Field>
  );
}

function NodeFields({ node, onEdit, onEditCommit }: { node: PlanNode; onEdit: Props["onEdit"]; onEditCommit: Props["onEditCommit"] }) {
  const ids = new Set([node.id]);
  const text = (key: string) => (e: { target: { value: string } }) =>
    onEdit(ids, (n) => ({ ...n, [key]: e.target.value }) as PlanNode);

  switch (node.type) {
    case "edgeRouter":
    case "accessPoint":
      return (
        <>
          <Field><InputBox placeholder="Label" value={node.label} onchange={text("label")} /></Field>
          <Field>
            <SelectOption
              placeholder="Board"
              value={node.board}
              options={BOARDS}
              onChange={(e: { target: { value: string } }) =>
                e.target.value && onEditCommit(ids, (n) => ({ ...n, board: e.target.value as Board }) as PlanNode)}
            />
          </Field>
          {node.type === "edgeRouter" && (
            <Field>
              <div className="flex items-center justify-between">
                <span className="text-sm">ISP handoff here</span>
                <SliderButton
                  value={node.ispHandoff}
                  onclick={() => onEditCommit(ids, (n) => (n.type === "edgeRouter" ? { ...n, ispHandoff: !n.ispHandoff } : n))}
                />
              </div>
            </Field>
          )}
        </>
      );
    case "poeSwitch":
      return <Field><InputBox placeholder="Label" value={node.label} onchange={text("label")} /></Field>;
    case "smartLock":
      return (
        <>
          <Field><InputBox placeholder="Unit" value={node.unit} onchange={text("unit")} /></Field>
          <Field><InputBox placeholder="Building / hallway" value={node.group} onchange={text("group")} /></Field>
          <FacingControls ids={ids} value={node.facingDeg} onEdit={onEdit} onEditCommit={onEditCommit} />
        </>
      );
    case "smartMotion":
      return (
        <>
          <Field>
            <SelectOption
              placeholder="Model"
              value={node.model}
              options={MOTION_MODELS}
              onChange={(e: { target: { value: string } }) =>
                e.target.value && onEditCommit(ids, (n) => ({ ...n, model: e.target.value as MotionModel }) as PlanNode)}
            />
          </Field>
          <Field><InputBox placeholder="Area (e.g. Hallway B)" value={node.area} onchange={text("area")} /></Field>
          <Field><InputBox placeholder="Unit (if in a vacant unit)" value={node.unit} onchange={text("unit")} /></Field>
        </>
      );
  }
}

export default function Inspector({ layout, analysis, selection, onEdit, onEditCommit, onCommit, onDelete }: Props) {
  const nodes = layout.nodes.filter((n) => selection.has(n.id));
  const links = layout.links.filter((l) => selection.has(l.id));
  const shapes = layout.shapes.filter((s) => selection.has(s.id));
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));

  if (selection.size === 0 || nodes.length + links.length + shapes.length === 0) {
    return (
      <div className="space-y-3 p-4 text-sm text-zinc-600 dark:text-zinc-400">
        <p>Select a device, cable or shape to edit it.</p>
        <p>
          Scale:{" "}
          {layout.scale ? (
            <b>{layout.scale.pxPerFt.toFixed(2)} px/ft</b>
          ) : (
            <b className="text-amber-600">not set — coverage checks are off</b>
          )}
        </p>
        <p className="text-xs">
          Shortcuts: V select · H pan · E router · A access point · P switch · L lock · M motion · R row of doors · B
          building · W wall · K cable · T tether · C scale · [ ] rotate locks · Del delete · Ctrl+Z/Y undo/redo ·
          Ctrl+C/V copy/paste · Ctrl+S save
        </p>
      </div>
    );
  }

  const deleteButton = (
    <button
      type="button"
      onClick={onDelete}
      className="mt-6 w-full cursor-pointer rounded bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600"
    >
      Delete {selection.size > 1 ? `${selection.size} items` : ""}
    </button>
  );

  if (nodes.length === 1 && selection.size === 1) {
    const node = nodes[0];
    const assignedTo = analysis.assignment[node.id] ? byId.get(analysis.assignment[node.id]) : undefined;
    const load = analysis.load[node.id];
    return (
      <div className="p-4" onBlur={onCommit}>
        <h3 className="font-bold">{NODE_TYPE_LABELS[node.type]}</h3>
        <NodeFields node={node} onEdit={onEdit} onEditCommit={onEditCommit} />
        {analysis.calibrated && (
          <div className="mt-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            {assignedTo && (
              <p>
                Routes to <b>{nodeName(assignedTo)}</b> in {analysis.hops[node.id]} hop{analysis.hops[node.id] === 1 ? "" : "s"}.
              </p>
            )}
            {load !== undefined && (
              <p>
                Serves <b>{load}</b> of ~{RULES.AP_CAPACITY} sensors.
              </p>
            )}
          </div>
        )}
        {deleteButton}
      </div>
    );
  }

  const locks = nodes.filter((n) => n.type === "smartLock");
  const allLocks = locks.length > 0 && locks.length === selection.size;
  const counts = new Map<string, number>();
  for (const n of nodes) counts.set(NODE_TYPE_LABELS[n.type], (counts.get(NODE_TYPE_LABELS[n.type]) ?? 0) + 1);
  if (links.length) counts.set("Cables", links.length);
  if (shapes.length) counts.set("Shapes", shapes.length);

  const lockIds = new Set(locks.map((l) => l.id));
  const sameGroup = locks.every((l) => l.type === "smartLock" && l.group === (locks[0] as { group: string }).group);
  const sameFacing = locks.every((l) => l.type === "smartLock" && l.facingDeg === (locks[0] as { facingDeg: number }).facingDeg);

  return (
    <div className="p-4" onBlur={onCommit}>
      <h3 className="font-bold">{selection.size} selected</h3>
      <ul className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {[...counts].map(([label, n]) => (
          <li key={label}>
            {n} × {label}
          </li>
        ))}
      </ul>
      {allLocks && (
        <>
          <Field>
            <InputBox
              placeholder={sameGroup ? "Building / hallway" : "Building / hallway (mixed)"}
              value={sameGroup && locks[0].type === "smartLock" ? locks[0].group : ""}
              onchange={(e: { target: { value: string } }) =>
                onEdit(lockIds, (n) => (n.type === "smartLock" ? { ...n, group: e.target.value } : n))}
            />
          </Field>
          <FacingControls
            ids={lockIds}
            value={sameFacing && locks[0].type === "smartLock" ? locks[0].facingDeg : null}
            onEdit={onEdit}
            onEditCommit={onEditCommit}
          />
        </>
      )}
      {links.length === 1 && selection.size === 1 && (
        <p className="mt-2 text-sm">
          {links[0].kind === "tether" ? "Tether" : "Wired"} link: {nodeName(byId.get(links[0].from)!)} ↔{" "}
          {nodeName(byId.get(links[0].to)!)}
        </p>
      )}
      {deleteButton}
    </div>
  );
}
