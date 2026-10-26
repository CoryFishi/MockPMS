import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Circle, Ellipse, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import NodeGlyph from "@views/smartspace/mapping/NodeGlyph";
import { RULES } from "@views/smartspace/mapping/model/rules";
import { addLink, addNodes, addShape, createNode, moveNodes } from "@views/smartspace/mapping/model/ops";
import { dist } from "@views/smartspace/mapping/model/geometry";
import { isOpenNet, isSensor, type PlanLayout, type PlanNode, type Point } from "@views/smartspace/mapping/model/types";
import type { Analysis } from "@views/smartspace/mapping/model/analyze";
import type { Tool } from "@views/smartspace/mapping/tools";
import { BLANK_SIZE, MAX_SCALE, MIN_SCALE, type RangeMode, type SelectMode, type Size, type View } from "@views/smartspace/mapping/view";
import {
  ASSIGNMENT_PALETTE,
  LINK_COLORS,
  SELECTION_COLOR,
  SHAPE_COLORS,
} from "@views/smartspace/mapping/colors";

interface Props {
  layout: PlanLayout;
  analysis: Analysis;
  selection: Set<string>;
  onSelect: (ids: string[], mode: SelectMode) => void;
  tool: Tool;
  view: View;
  setView: (view: View) => void;
  onResize: (size: Size) => void;
  ranges: RangeMode;
  showLinks: boolean;
  backgroundImage: HTMLImageElement | null;
  /** Glyph size multiplier (1 on screen; larger when exporting a big image). */
  glyphScale: number;
  /** Extra Konva content drawn on top (the export legend). */
  overlay?: ReactNode;
  onChange: (next: (prev: PlanLayout) => PlanLayout, options?: { commit?: boolean }) => void;
  onCommit: () => void;
  onScaleLine: (a: Point, b: Point) => void;
  onRowLine: (a: Point, b: Point) => void;
  onPlaced: (id: string) => void;
  stageRef: RefObject<Konva.Stage | null>;
}

const TWO_CLICK_TOOLS: Tool[] = ["row", "scale"];
const DRAW_TOOLS: Tool[] = ["wall", "building"];
const PLACE_TOOLS: Tool[] = ["edgeRouter", "accessPoint", "poeSwitch", "smartLock", "smartMotion"];

function canLink(tool: Tool, node: PlanNode) {
  if (tool === "tether") return isOpenNet(node);
  return isOpenNet(node) || node.type === "poeSwitch";
}

export default function PlanCanvas(props: Props) {
  const {
    layout,
    analysis,
    selection,
    onSelect,
    tool,
    view,
    setView,
    onResize,
    ranges,
    showLinks,
    backgroundImage,
    glyphScale,
    overlay,
    onChange,
    onScaleLine,
    onRowLine,
    onPlaced,
    stageRef,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [pointer, setPointer] = useState<Point | null>(null);
  const [draft, setDraft] = useState<Point[]>([]); // wall/building vertices, or the first click of a two-click tool
  const [linkStart, setLinkStartState] = useState<string | null>(null);
  const linkStartRef = useRef<string | null>(null);
  const setLinkStart = useCallback((id: string | null) => {
    linkStartRef.current = id;
    setLinkStartState(id);
  }, []);
  const [box, setBox] = useState<{ a: Point; b: Point } | null>(null);
  const gesture = useRef<
    | { kind: "pan"; start: Point; view: View; moved: boolean }
    | { kind: "box"; start: Point; additive: boolean; moved: boolean }
    | null
  >(null);
  const suppressClick = useRef(false);
  const dragOrigins = useRef<{ start: Point; origins: Map<string, Point> } | null>(null);

  // Latest props for stable callbacks (NodeGlyph is memoized)
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) };
      setSize(next);
      onResize(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onResize]);

  // Reset in-progress gestures when the tool changes
  useEffect(() => {
    setDraft([]);
    setLinkStart(null);
  }, [tool, setLinkStart]);

  const finishDraft = useCallback(() => {
    const t = latest.current.tool;
    setDraft((points) => {
      // A double-click adds the same point twice; drop near-duplicates
      const clean = points.filter((p, i) => i === 0 || dist(p, points[i - 1]) > 1);
      const min = t === "building" ? 3 : 2;
      if (DRAW_TOOLS.includes(t) && clean.length >= min) {
        latest.current.onChange((l) => addShape(l, t === "building" ? "building" : "wall", clean.flatMap((p) => [p.x, p.y])));
      }
      return [];
    });
  }, []);

  useEffect(() => {
    const isTyping = (e: KeyboardEvent) =>
      e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
    const down = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      if (e.code === "Space") {
        setSpaceHeld(true);
        e.preventDefault();
      } else if (e.key === "Enter") {
        finishDraft();
      } else if (e.key === "Escape") {
        setDraft([]);
        setLinkStart(null);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [finishDraft, setLinkStart]);

  const worldPointer = (): Point | null => stageRef.current?.getRelativePointerPosition() ?? null;

  // --- Stage gestures ---------------------------------------------------------
  const isEmptyTarget = (e: KonvaEventObject<MouseEvent>) =>
    e.target === e.target.getStage() || e.target.name() === "background";

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    suppressClick.current = false;
    const screen = stage.getPointerPosition();
    if (!screen) return;
    if (e.evt.button === 1 || spaceHeld || tool === "pan") {
      e.evt.preventDefault();
      gesture.current = { kind: "pan", start: screen, view, moved: false };
      return;
    }
    if (tool === "select" && e.evt.button === 0 && isEmptyTarget(e)) {
      const p = worldPointer();
      if (p) gesture.current = { kind: "box", start: p, additive: e.evt.shiftKey, moved: false };
    }
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const g = gesture.current;
    if (g?.kind === "pan") {
      const screen = stage.getPointerPosition();
      if (!screen) return;
      const dx = screen.x - g.start.x;
      const dy = screen.y - g.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) g.moved = true;
      setView({ ...g.view, x: g.view.x + dx, y: g.view.y + dy });
      return;
    }
    const p = worldPointer();
    if (g?.kind === "box" && p) {
      if (dist(p, g.start) * view.scale > 3) g.moved = true;
      if (g.moved) setBox({ a: g.start, b: p });
      return;
    }
    if (draft.length > 0 || linkStart || tool === "scale") setPointer(p);
  };

  const handleMouseUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (g.kind === "pan") {
      suppressClick.current = g.moved;
      return;
    }
    if (g.kind === "box") {
      if (g.moved && box) {
        const minX = Math.min(box.a.x, box.b.x);
        const maxX = Math.max(box.a.x, box.b.x);
        const minY = Math.min(box.a.y, box.b.y);
        const maxY = Math.max(box.a.y, box.b.y);
        const ids = layout.nodes
          .filter((n) => n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY)
          .map((n) => n.id);
        onSelect(ids, g.additive ? "add" : "replace");
        suppressClick.current = true;
      } else if (!g.additive) {
        onSelect([], "replace");
      }
      setBox(null);
    }
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (suppressClick.current || e.evt.button !== 0 || spaceHeld) return;
    const p = worldPointer();
    if (!p) return;

    if (PLACE_TOOLS.includes(tool)) {
      if (!isEmptyTarget(e)) return;
      const node = createNode(layout, tool as PlanNode["type"], p);
      onChange((l) => addNodes(l, [node]));
      onPlaced(node.id);
      return;
    }
    if (TWO_CLICK_TOOLS.includes(tool)) {
      if (draft.length === 0) {
        setDraft([p]);
        setPointer(p);
      } else {
        const a = draft[0];
        setDraft([]);
        if (dist(a, p) < 2) return;
        if (tool === "scale") onScaleLine(a, p);
        else onRowLine(a, p);
      }
      return;
    }
    if (DRAW_TOOLS.includes(tool)) {
      setDraft((d) => [...d, p]);
      setPointer(p);
    }
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const screen = stage?.getPointerPosition();
    if (!screen) return;
    const factor = Math.pow(1.0015, -e.evt.deltaY);
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
    const world = { x: (screen.x - view.x) / view.scale, y: (screen.y - view.y) / view.scale };
    setView({ scale, x: screen.x - world.x * scale, y: screen.y - world.y * scale });
  };

  // --- Node interaction (stable for memoized glyphs) ----------------------------
  const onNodeMouseDown = useCallback((e: KonvaEventObject<MouseEvent>, node: PlanNode) => {
    const { tool: t, selection: sel, onSelect: select } = latest.current;
    if (t !== "select" || e.evt.button !== 0) return;
    e.cancelBubble = true;
    if (e.evt.shiftKey) select([node.id], "toggle");
    else if (!sel.has(node.id)) select([node.id], "replace");
  }, []);

  const onNodeClick = useCallback((e: KonvaEventObject<MouseEvent>, node: PlanNode) => {
    const { tool: t } = latest.current;
    if (t !== "wired" && t !== "tether") return;
    e.cancelBubble = true;
    if (!canLink(t, node)) return;
    const start = linkStartRef.current;
    if (!start) {
      setLinkStart(node.id);
      return;
    }
    if (start !== node.id) latest.current.onChange((l) => addLink(l, start, node.id, t) ?? l);
    setLinkStart(null);
  }, [setLinkStart]);

  const onNodeDragStart = useCallback((e: KonvaEventObject<DragEvent>, node: PlanNode) => {
    const { selection: sel, layout: l } = latest.current;
    const ids = sel.has(node.id) ? sel : new Set([node.id]);
    const origins = new Map<string, Point>();
    for (const n of l.nodes) if (ids.has(n.id)) origins.set(n.id, { x: n.x, y: n.y });
    dragOrigins.current = { start: { x: node.x, y: node.y }, origins };
    e.cancelBubble = true;
  }, []);

  const onNodeDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    const d = dragOrigins.current;
    if (!d) return;
    const dx = e.target.x() - d.start.x;
    const dy = e.target.y() - d.start.y;
    latest.current.onChange((l) => moveNodes(l, d.origins, dx, dy), { commit: false });
  }, []);

  const onNodeDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    onNodeDragMove(e);
    dragOrigins.current = null;
    latest.current.onCommit();
  }, [onNodeDragMove]);

  // --- Derived drawing data ---------------------------------------------------------
  const k = glyphScale / view.scale;
  const pxPerFt = layout.scale?.pxPerFt ?? 0;
  const byId = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout.nodes]);

  const apColor = useMemo(() => {
    const map = new Map<string, string>();
    layout.nodes.filter(isOpenNet).forEach((n, i) => map.set(n.id, ASSIGNMENT_PALETTE[i % ASSIGNMENT_PALETTE.length]));
    return map;
  }, [layout.nodes]);

  const nodeElements = useMemo(
    () =>
      layout.nodes.map((node) => {
        const color = isSensor(node)
          ? (analysis.assignment[node.id] ? apColor.get(analysis.assignment[node.id]) ?? null : null)
          : isOpenNet(node)
            ? apColor.get(node.id) ?? null
            : null;
        return (
          <NodeGlyph
            key={node.id}
            node={node}
            k={k}
            color={analysis.calibrated ? color : null}
            severity={analysis.nodeSeverity[node.id]}
            selected={selection.has(node.id)}
            highlighted={linkStart === node.id}
            draggable={tool === "select" && !spaceHeld}
            onMouseDown={onNodeMouseDown}
            onClick={onNodeClick}
            onDragStart={onNodeDragStart}
            onDragMove={onNodeDragMove}
            onDragEnd={onNodeDragEnd}
          />
        );
      }),
    [layout.nodes, analysis, apColor, k, selection, linkStart, tool, spaceHeld, onNodeMouseDown, onNodeClick, onNodeDragStart, onNodeDragMove, onNodeDragEnd],
  );

  const rangeNodes = useMemo(() => {
    if (!pxPerFt || ranges === "off") return [];
    return ranges === "all" ? layout.nodes : layout.nodes.filter((n) => selection.has(n.id));
  }, [layout.nodes, selection, ranges, pxPerFt]);

  const inferredLinks = useMemo(() => {
    if (!showLinks || !analysis.calibrated) return [];
    const lines: { key: string; points: number[]; color: string; dashed: boolean }[] = [];
    for (const link of analysis.wirelessLinks) {
      if (link.kind !== "opennet") continue;
      const a = byId.get(link.from);
      const b = byId.get(link.to);
      if (a && b) lines.push({ key: `o:${link.from}:${link.to}`, points: [a.x, a.y, b.x, b.y], color: LINK_COLORS.opennet, dashed: !link.los });
    }
    for (const [id, parentId] of Object.entries(analysis.parent)) {
      const a = byId.get(id);
      const b = byId.get(parentId);
      if (a && b) lines.push({ key: `s:${id}`, points: [a.x, a.y, b.x, b.y], color: LINK_COLORS.sensor, dashed: false });
    }
    return lines;
  }, [analysis, byId, showLinks]);

  const world = backgroundImage
    ? { width: backgroundImage.naturalWidth, height: backgroundImage.naturalHeight }
    : layout.background ?? BLANK_SIZE;

  const cursor = spaceHeld || tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair";
  const previewEnd = pointer ?? draft[draft.length - 1];

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-zinc-300 dark:bg-zinc-800" style={{ cursor }}>
      {size.width > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={view.x}
          y={view.y}
          scaleX={view.scale}
          scaleY={view.scale}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onDblClick={finishDraft}
          onWheel={handleWheel}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <Layer>
            {backgroundImage ? (
              <KonvaImage image={backgroundImage} name="background" />
            ) : (
              <Rect name="background" width={world.width} height={world.height} fill="#ffffff" stroke="#d4d4d8" strokeWidth={1} strokeScaleEnabled={false} />
            )}
            {layout.shapes.map((shape) => (
              <Line
                key={shape.id}
                points={shape.points}
                closed={shape.kind === "building"}
                fill={shape.kind === "building" ? "rgba(250, 204, 21, 0.08)" : undefined}
                stroke={selection.has(shape.id) ? SELECTION_COLOR : SHAPE_COLORS[shape.kind]}
                strokeWidth={shape.kind === "wall" ? 4 : 2}
                strokeScaleEnabled={false}
                hitStrokeWidth={12}
                listening={tool === "select"}
                onMouseDown={(e) => {
                  if (e.evt.button !== 0) return;
                  e.cancelBubble = true;
                  onSelect([shape.id], e.evt.shiftKey ? "toggle" : "replace");
                }}
              />
            ))}
          </Layer>

          <Layer listening={false}>
            {rangeNodes.map((n) => {
              if (isOpenNet(n)) {
                return [
                  <Circle key={`${n.id}:los`} x={n.x} y={n.y} radius={RULES.OPENNET_LOS_FT * pxPerFt} fill="rgba(37, 99, 235, 0.05)" stroke="rgba(37, 99, 235, 0.6)" strokeWidth={1.5} strokeScaleEnabled={false} perfectDrawEnabled={false} />,
                  <Circle key={`${n.id}:nlos`} x={n.x} y={n.y} radius={RULES.OPENNET_NLOS_FT * pxPerFt} stroke="rgba(37, 99, 235, 0.6)" strokeWidth={1.5} dash={[8, 6]} strokeScaleEnabled={false} perfectDrawEnabled={false} />,
                ];
              }
              if (n.type === "smartLock") {
                return (
                  <Ellipse key={n.id} x={n.x} y={n.y} rotation={n.facingDeg} radiusX={RULES.LOCK_ACROSS_FT * pxPerFt} radiusY={RULES.LOCK_LATERAL_FT * pxPerFt} fill="rgba(22, 163, 74, 0.06)" stroke="rgba(22, 163, 74, 0.5)" strokeWidth={1} strokeScaleEnabled={false} perfectDrawEnabled={false} />
                );
              }
              if (n.type === "smartMotion") {
                return (
                  <Circle key={n.id} x={n.x} y={n.y} radius={RULES.MOTION_FT * pxPerFt} fill="rgba(234, 88, 12, 0.06)" stroke="rgba(234, 88, 12, 0.5)" strokeWidth={1} strokeScaleEnabled={false} perfectDrawEnabled={false} />
                );
              }
              return null;
            })}
            {inferredLinks.map((l) => (
              <Line key={l.key} points={l.points} stroke={l.color} strokeWidth={l.color === LINK_COLORS.opennet ? 2 : 1} dash={l.dashed ? [6, 4] : undefined} opacity={0.7} strokeScaleEnabled={false} perfectDrawEnabled={false} />
            ))}
          </Layer>

          <Layer>
            {layout.links.map((link) => {
              const a = byId.get(link.from);
              const b = byId.get(link.to);
              if (!a || !b) return null;
              return (
                <Line
                  key={link.id}
                  points={[a.x, a.y, b.x, b.y]}
                  stroke={selection.has(link.id) ? SELECTION_COLOR : LINK_COLORS[link.kind]}
                  strokeWidth={3}
                  dash={link.kind === "tether" ? [10, 6] : undefined}
                  strokeScaleEnabled={false}
                  hitStrokeWidth={12}
                  listening={tool === "select"}
                  onMouseDown={(e) => {
                    if (e.evt.button !== 0) return;
                    e.cancelBubble = true;
                    onSelect([link.id], e.evt.shiftKey ? "toggle" : "replace");
                  }}
                />
              );
            })}
            {nodeElements}
          </Layer>

          <Layer listening={false}>
            {tool === "scale" && layout.scale && draft.length === 0 && (
              <>
                <Line points={[layout.scale.ref.x1, layout.scale.ref.y1, layout.scale.ref.x2, layout.scale.ref.y2]} stroke="#0891b2" strokeWidth={2} dash={[6, 4]} strokeScaleEnabled={false} />
                <Text x={layout.scale.ref.x2} y={layout.scale.ref.y2} text={` ${layout.scale.ref.feet} ft`} fontSize={12} scaleX={1 / view.scale} scaleY={1 / view.scale} fill="#0891b2" />
              </>
            )}
            {draft.length > 0 && previewEnd && (
              <Line
                points={[...draft.flatMap((p) => [p.x, p.y]), previewEnd.x, previewEnd.y]}
                stroke={tool === "wall" ? SHAPE_COLORS.wall : tool === "building" ? SHAPE_COLORS.building : "#0891b2"}
                strokeWidth={2}
                dash={[6, 4]}
                strokeScaleEnabled={false}
              />
            )}
            {draft.length > 0 && previewEnd && pxPerFt > 0 && TWO_CLICK_TOOLS.includes(tool) && (
              <Text
                x={previewEnd.x}
                y={previewEnd.y}
                text={` ${(dist(draft[0], previewEnd) / pxPerFt).toFixed(1)} ft`}
                fontSize={12}
                scaleX={1 / view.scale}
                scaleY={1 / view.scale}
                fill="#0891b2"
              />
            )}
            {linkStart && pointer && byId.get(linkStart) && (
              <Line
                points={[byId.get(linkStart)!.x, byId.get(linkStart)!.y, pointer.x, pointer.y]}
                stroke={tool === "tether" ? LINK_COLORS.tether : LINK_COLORS.wired}
                strokeWidth={2}
                dash={[6, 4]}
                strokeScaleEnabled={false}
              />
            )}
            {box && (
              <Rect
                x={Math.min(box.a.x, box.b.x)}
                y={Math.min(box.a.y, box.b.y)}
                width={Math.abs(box.b.x - box.a.x)}
                height={Math.abs(box.b.y - box.a.y)}
                fill="rgba(234, 179, 8, 0.1)"
                stroke={SELECTION_COLOR}
                strokeWidth={1}
                strokeScaleEnabled={false}
              />
            )}
            {overlay}
          </Layer>
        </Stage>
      )}
      {!layout.nodes.length && !backgroundImage && !layout.background && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded bg-white/90 px-3 py-1 text-sm text-zinc-600 shadow dark:bg-zinc-900/90 dark:text-zinc-300">
          Upload a site plan to trace over, or start placing devices on the blank canvas.
        </div>
      )}
    </div>
  );
}

