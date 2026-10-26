import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type Konva from "konva";
import { MdArrowBack, MdEdit, MdOutlineMap } from "react-icons/md";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import {
  invalidateSitePlans,
  savePlan,
  updatePlanDetails,
  useBackgroundUrl,
  useSitePlan,
  type SaveResult,
  type SitePlanDetails,
  type SitePlanListRow,
} from "@hooks/sitePlans";
import { useHistory } from "@views/smartspace/mapping/useHistory";
import { analyzePlan, type Issue } from "@views/smartspace/mapping/model/analyze";
import { bomRows, lockInstallCsv, summarize } from "@views/smartspace/mapping/model/exports";
import { boundsOf, normalizeDeg, perpendicularDeg, pointsAlong } from "@views/smartspace/mapping/model/geometry";
import { copySelection, deleteIds, newId, paste, updateNodes, type Clipboard } from "@views/smartspace/mapping/model/ops";
import { nextUnit, unitSequence } from "@views/smartspace/mapping/model/unitNumbers";
import { emptyLayout, type PlanLayout, type PlanNode, type Point } from "@views/smartspace/mapping/model/types";
import PlanCanvas from "@views/smartspace/mapping/PlanCanvas";
import { BLANK_SIZE, MAX_SCALE, MIN_SCALE, type RangeMode, type SelectMode, type Size, type View } from "@views/smartspace/mapping/view";
import EditorToolbar from "@views/smartspace/mapping/EditorToolbar";
import ExportLegend from "@views/smartspace/mapping/ExportLegend";
import { TOOL_BY_KEY, type Tool } from "@views/smartspace/mapping/tools";
import Inspector from "@views/smartspace/mapping/panels/Inspector";
import IssuesPanel from "@views/smartspace/mapping/panels/IssuesPanel";
import BomPanel from "@views/smartspace/mapping/panels/BomPanel";
import RulesPanel from "@views/smartspace/mapping/panels/RulesPanel";
import BackgroundModal from "@views/smartspace/mapping/modals/BackgroundModal";
import CalibrateModal from "@views/smartspace/mapping/modals/CalibrateModal";
import RowOfDoorsModal, { type RowOptions } from "@views/smartspace/mapping/modals/RowOfDoorsModal";
import ConflictModal from "@views/smartspace/mapping/modals/ConflictModal";
import PlanDetailsModal from "@views/smartspace/mapping/PlanDetailsModal";

type Tab = "inspector" | "issues" | "bom" | "rules";

const TABS: { id: Tab; label: string }[] = [
  { id: "inspector", label: "Inspector" },
  { id: "issues", label: "Issues" },
  { id: "bom", label: "Materials" },
  { id: "rules", label: "Rules" },
];

const NO_SELECTION = new Set<string>();

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "-").trim() || "site plan";
}

/** Loads a signed background URL into an image usable by Konva (and exportable: CORS). */
function useImage(url: string | undefined) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => !cancelled && setImage(img);
    img.onerror = () => !cancelled && toast.error("Could not load the site plan image.");
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);
  return image;
}

export default function SitePlanEditor() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: plan, isPending, isError, error, refetch } = useSitePlan(planId);

  const history = useHistory<PlanLayout>(emptyLayout());
  const { present: layout, committed, set: setLayout, commit, undo, redo, reset, markSaved, dirty } = history;

  const [initialized, setInitialized] = useState(false);
  const [details, setDetails] = useState<SitePlanDetails | null>(null);
  const [loadedUpdatedAt, setLoadedUpdatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<SitePlanListRow | null>(null);

  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("inspector");
  const [ranges, setRanges] = useState<RangeMode>("selected");
  const [showLinks, setShowLinks] = useState(true);
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 0.25 });
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [fitted, setFitted] = useState(false);

  const [modal, setModal] = useState<
    | { kind: "background" }
    | { kind: "calibrate"; a: Point; b: Point }
    | { kind: "row"; a: Point; b: Point }
    | { kind: "details" }
    | null
  >(null);
  const [exporting, setExporting] = useState<View | null>(null); // view to restore afterwards

  const stageRef = useRef<Konva.Stage | null>(null);
  const clipboard = useRef<{ clip: Clipboard; pastes: number } | null>(null);

  // --- Load ----------------------------------------------------------------------
  useEffect(() => {
    if (plan && !initialized) {
      reset(plan.layout);
      setDetails({ name: plan.name, customer: plan.customer, address: plan.address, notes: plan.notes });
      setLoadedUpdatedAt(plan.updated_at);
      setInitialized(true);
    }
  }, [plan, initialized, reset]);

  const { data: backgroundUrl } = useBackgroundUrl(layout.background?.path);
  const backgroundImage = useImage(layout.background ? backgroundUrl : undefined);
  const world = layout.background ?? BLANK_SIZE;

  const analysis = useMemo(() => analyzePlan(committed), [committed]);
  const bom = useMemo(() => bomRows(committed), [committed]);

  // --- View ----------------------------------------------------------------------
  const fitTo = useCallback(
    (minX: number, minY: number, maxX: number, maxY: number, maxScale = MAX_SCALE) => {
      if (!size.width || !size.height) return;
      const w = Math.max(maxX - minX, 1);
      const h = Math.max(maxY - minY, 1);
      const scale = Math.min(maxScale, Math.max(MIN_SCALE, Math.min(size.width / w, size.height / h) * 0.92));
      setView({
        scale,
        x: size.width / 2 - ((minX + maxX) / 2) * scale,
        y: size.height / 2 - ((minY + maxY) / 2) * scale,
      });
    },
    [size],
  );

  const fit = useCallback(() => fitTo(0, 0, world.width, world.height), [fitTo, world.width, world.height]);

  useEffect(() => {
    if (initialized && !fitted && size.width > 0) {
      fit();
      setFitted(true);
    }
  }, [initialized, fitted, size.width, fit]);

  const focusIssue = (issue: Issue) => {
    const nodes = layout.nodes.filter((n) => issue.nodeIds.includes(n.id));
    const b = boundsOf(nodes);
    if (!b) return;
    setSelection(new Set(nodes.map((n) => n.id)));
    setTool("select");
    const pad = 150 / Math.max(view.scale, 0.01);
    fitTo(b.minX - pad, b.minY - pad, b.maxX + pad, b.maxY + pad, Math.max(view.scale, 1));
  };

  // --- Selection & edits ---------------------------------------------------------
  const onSelect = useCallback((ids: string[], mode: SelectMode) => {
    setSelection((prev) => {
      if (mode === "replace") return new Set(ids);
      const next = new Set(prev);
      for (const id of ids) {
        if (mode === "toggle" && next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
    if (ids.length > 0) setTab("inspector");
  }, []);

  const deleteSelection = useCallback(() => {
    if (selection.size === 0) return;
    setLayout((l) => deleteIds(l, selection));
    setSelection(new Set());
  }, [selection, setLayout]);

  const rotateLocks = useCallback(
    (delta: number) => {
      setLayout((l) =>
        updateNodes(l, selection, (n) => (n.type === "smartLock" ? { ...n, facingDeg: normalizeDeg(n.facingDeg + delta) } : n)),
      );
    },
    [selection, setLayout],
  );

  const placeRow = (a: Point, b: Point, options: RowOptions) => {
    const points = pointsAlong(a, b, options.count);
    const units = unitSequence(options.firstUnit, options.count, options.step);
    const facingDeg = perpendicularDeg(a, b, options.flip);
    const locks: PlanNode[] = points.map((p, i) => ({
      id: newId(),
      type: "smartLock",
      x: p.x,
      y: p.y,
      unit: units[i],
      facingDeg,
      group: options.group,
    }));
    setLayout((l) => ({ ...l, nodes: [...l.nodes, ...locks] }));
    setSelection(new Set(locks.map((l) => l.id)));
    setModal(null);
  };

  const rowDefaults = () => {
    const last = [...layout.nodes].reverse().find((n) => n.type === "smartLock");
    return last && last.type === "smartLock"
      ? { firstUnit: last.unit ? nextUnit(last.unit) : "101", group: last.group }
      : { firstUnit: "101", group: "" };
  };

  // --- Save ----------------------------------------------------------------------
  const latestLayout = useRef(layout);
  latestLayout.current = layout;
  const savingRef = useRef(false);

  const handleResult = useCallback(
    (result: SaveResult, saved: PlanLayout | null) => {
      if (result.status === "saved") {
        if (saved) markSaved(saved);
        setLoadedUpdatedAt(result.row.updated_at);
        invalidateSitePlans(queryClient);
        return true;
      }
      if (result.status === "conflict") setConflict(result.current);
      else toast.error("This plan was deleted. Your changes were not saved.");
      return false;
    },
    [markSaved, queryClient],
  );

  const save = useCallback(
    async (force = false) => {
      if (!planId || savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      const snapshot = latestLayout.current;
      try {
        const result = await savePlan(planId, snapshot, summarize(snapshot), force ? null : loadedUpdatedAt);
        if (handleResult(result, snapshot)) toast.success("Plan saved.");
      } catch (e) {
        toast.error(`Save failed: ${(e as Error).message}`);
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [planId, loadedUpdatedAt, handleResult],
  );

  const reload = async () => {
    setConflict(null);
    const result = await refetch();
    if (result.data) {
      reset(result.data.layout);
      setDetails({ name: result.data.name, customer: result.data.customer, address: result.data.address, notes: result.data.notes });
      setLoadedUpdatedAt(result.data.updated_at);
      setSelection(new Set());
    }
  };

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const goBack = () => {
    if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    navigate("/smartspace/mapping");
  };

  // --- Exports -------------------------------------------------------------------
  const exportCsv = () => {
    const locks = layout.nodes.filter((n) => n.type === "smartLock").length;
    if (locks === 0) {
      toast.error("There are no SmartLocks to export.");
      return;
    }
    const url = URL.createObjectURL(new Blob([lockInstallCsv(layout)], { type: "text/csv" }));
    download(url, `${safeFileName(details?.name ?? "")} - lock install sheet.csv`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportPng = () => {
    if (layout.background && !backgroundImage) {
      toast.error("Wait for the site plan image to load.");
      return;
    }
    setExporting(view);
    setView({ x: 0, y: 0, scale: 1 });
  };

  useEffect(() => {
    if (!exporting) return;
    const frame = requestAnimationFrame(() => {
      try {
        const stage = stageRef.current;
        if (!stage) throw new Error("Canvas not ready.");
        const url = stage.toDataURL({ x: 0, y: 0, width: world.width, height: world.height, pixelRatio: 1 });
        download(url, `${safeFileName(details?.name ?? "")}.png`);
      } catch (e) {
        toast.error(`Export failed: ${(e as Error).message}`);
      } finally {
        setView(exporting);
        setExporting(null);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [exporting, world.width, world.height, details?.name]);

  // --- Keyboard ------------------------------------------------------------------
  const keyState = useRef({ save, undo, redo, deleteSelection, rotateLocks, selection, layout, view, modal });
  keyState.current = { save, undo, redo, deleteSelection, rotateLocks, selection, layout, view, modal };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = keyState.current;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (ctrl && key === "s") {
        e.preventDefault();
        s.save();
        return;
      }
      if (s.modal) return;
      if (ctrl && key === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
      } else if (ctrl && key === "y") {
        e.preventDefault();
        s.redo();
      } else if (ctrl && key === "c") {
        const clip = copySelection(s.layout, s.selection);
        if (clip) clipboard.current = { clip, pastes: 0 };
      } else if (ctrl && key === "v") {
        const c = clipboard.current;
        if (!c) return;
        e.preventDefault();
        c.pastes += 1;
        const result = paste(s.layout, c.clip, (20 * c.pastes) / s.view.scale);
        setLayout(result.layout);
        setSelection(new Set(result.ids));
      } else if (ctrl && key === "a") {
        e.preventDefault();
        setSelection(new Set(s.layout.nodes.map((n) => n.id)));
      } else if (key === "delete" || key === "backspace") {
        e.preventDefault();
        s.deleteSelection();
      } else if (key === "escape") {
        setTool("select");
      } else if (key === "[" || key === "]") {
        s.rotateLocks(key === "[" ? -90 : 90);
      } else if (!ctrl && !e.altKey && TOOL_BY_KEY.has(key)) {
        setTool(TOOL_BY_KEY.get(key)!);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setLayout]);

  // --- Render --------------------------------------------------------------------
  if (isPending || (plan && !initialized)) {
    return (
      <div className="relative h-full overflow-hidden dark:bg-zinc-900">
        <LoadingSpinner loadingText="Loading site plan..." />
      </div>
    );
  }
  if (isError || !plan) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 dark:bg-zinc-900 dark:text-white">
        <p>{isError ? `Could not load the plan: ${(error as Error).message}` : "This site plan does not exist or you can't open it."}</p>
        <button type="button" onClick={() => navigate("/smartspace/mapping")} className="cursor-pointer rounded bg-yellow-500 px-4 py-2 font-bold text-white hover:bg-yellow-600">
          Back to Site Plans
        </button>
      </div>
    );
  }

  const issueCount = analysis.issues.filter((i) => i.severity === "error").length;
  const glyphScale = exporting ? Math.max(1, Math.max(world.width, world.height) / 1500) : 1;

  return (
    <div className="flex h-full flex-col overflow-hidden dark:bg-zinc-900 dark:text-white">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-300 bg-zinc-200 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
        <button type="button" onClick={goBack} title="Back to Site Plans" className="cursor-pointer rounded p-1 text-lg hover:bg-zinc-300 dark:hover:bg-zinc-800">
          <MdArrowBack />
        </button>
        <MdOutlineMap className="text-lg" />
        <span className="truncate font-semibold">{details?.name}</span>
        {details?.customer && <span className="truncate text-zinc-500">| {details.customer}</span>}
        <button type="button" onClick={() => setModal({ kind: "details" })} title="Edit plan details" className="cursor-pointer rounded p-1 hover:bg-zinc-300 dark:hover:bg-zinc-800">
          <MdEdit />
        </button>
        <span className="ml-auto shrink-0 text-xs text-zinc-500">
          {dirty ? "Unsaved changes" : `Saved ${loadedUpdatedAt ? new Date(loadedUpdatedAt).toLocaleString() : ""}`}
        </span>
      </div>

      <EditorToolbar
        tool={tool}
        setTool={setTool}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={undo}
        onRedo={redo}
        ranges={ranges}
        setRanges={setRanges}
        showLinks={showLinks}
        setShowLinks={setShowLinks}
        zoom={view.scale}
        onFit={fit}
        hasBackground={!!layout.background}
        onBackground={() => setModal({ kind: "background" })}
        onExportPng={exportPng}
        onExportCsv={exportCsv}
        dirty={dirty}
        saving={saving}
        onSave={() => save()}
      />

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <PlanCanvas
            layout={layout}
            analysis={analysis}
            selection={exporting ? NO_SELECTION : selection}
            onSelect={onSelect}
            tool={tool}
            view={view}
            setView={setView}
            onResize={setSize}
            ranges={exporting ? "off" : ranges}
            showLinks={showLinks}
            backgroundImage={layout.background ? backgroundImage : null}
            glyphScale={glyphScale}
            overlay={
              exporting ? (
                <ExportLegend
                  title={details?.name ?? ""}
                  subtitle={[details?.customer, details?.address, new Date().toLocaleDateString()].filter(Boolean).join(" · ")}
                  bom={bom}
                  scale={glyphScale}
                />
              ) : null
            }
            onChange={setLayout}
            onCommit={commit}
            onScaleLine={(a, b) => setModal({ kind: "calibrate", a, b })}
            onRowLine={(a, b) => setModal({ kind: "row", a, b })}
            onPlaced={(id) => setSelection(new Set([id]))}
            stageRef={stageRef}
          />
          {!analysis.calibrated && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded bg-amber-100 px-3 py-2 text-sm text-amber-900 shadow dark:bg-amber-900/80 dark:text-amber-100">
              Set the scale to enable coverage checks.
              <button type="button" onClick={() => setTool("scale")} className="cursor-pointer rounded bg-amber-500 px-2 py-0.5 font-semibold text-white hover:bg-amber-600">
                Set scale
              </button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex w-80 shrink-0 flex-col border-l border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex shrink-0 border-b border-zinc-300 text-sm dark:border-zinc-700">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 cursor-pointer py-2 ${tab === t.id ? "border-b-2 border-yellow-500 font-semibold" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
              >
                {t.label}
                {t.id === "issues" && issueCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">{issueCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tab === "inspector" && (
              <Inspector
                layout={layout}
                analysis={analysis}
                selection={selection}
                onEdit={(ids, patch) => setLayout((l) => updateNodes(l, ids, patch), { commit: false })}
                onEditCommit={(ids, patch) => setLayout((l) => updateNodes(l, ids, patch))}
                onCommit={commit}
                onDelete={deleteSelection}
              />
            )}
            {tab === "issues" && <IssuesPanel analysis={analysis} hasNodes={layout.nodes.length > 0} onFocus={focusIssue} />}
            {tab === "bom" && <BomPanel rows={bom} />}
            {tab === "rules" && <RulesPanel />}
          </div>
        </div>
      </div>

      {modal?.kind === "background" && planId && (
        <BackgroundModal
          planId={planId}
          replacing={!!layout.background}
          onClose={() => setModal(null)}
          onDone={(background) => {
            setLayout((l) => ({ ...l, background }));
            setModal(null);
            setFitted(false);
          }}
        />
      )}
      {modal?.kind === "calibrate" && (
        <CalibrateModal
          a={modal.a}
          b={modal.b}
          current={layout.scale}
          onClose={() => setModal(null)}
          onDone={(scale) => {
            setLayout((l) => ({ ...l, scale }));
            setModal(null);
            setTool("select");
          }}
        />
      )}
      {modal?.kind === "row" && (
        <RowOfDoorsModal
          a={modal.a}
          b={modal.b}
          pxPerFt={layout.scale?.pxPerFt ?? 0}
          defaults={rowDefaults()}
          onClose={() => setModal(null)}
          onDone={(options) => placeRow(modal.a, modal.b, options)}
        />
      )}
      {modal?.kind === "details" && details && planId && (
        <PlanDetailsModal
          title="Plan Details"
          submitText="Save"
          initial={details}
          onClose={() => setModal(null)}
          onSubmit={async (next) => {
            try {
              const result = await updatePlanDetails(planId, next, loadedUpdatedAt);
              if (handleResult(result, null)) {
                setDetails(next);
                setModal(null);
              } else {
                setModal(null);
              }
            } catch (e) {
              toast.error(`Could not save details: ${(e as Error).message}`);
              throw e;
            }
          }}
        />
      )}
      {conflict && (
        <ConflictModal
          current={conflict}
          onClose={() => setConflict(null)}
          onReload={reload}
          onOverwrite={() => {
            setConflict(null);
            save(true);
          }}
        />
      )}
    </div>
  );
}
