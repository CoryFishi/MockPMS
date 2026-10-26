import { memo } from "react";
import { Circle, Group, Rect, RegularPolygon, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Severity } from "@views/smartspace/mapping/model/analyze";
import type { PlanNode } from "@views/smartspace/mapping/model/types";
import { NODE_COLORS, SEVERITY_COLORS, SELECTION_COLOR } from "@views/smartspace/mapping/colors";

type KonvaDrag = KonvaEventObject<DragEvent>;

export interface NodeGlyphProps {
  node: PlanNode;
  /** World units per screen pixel × glyph scale; keeps glyphs a constant on-screen size. */
  k: number;
  /** Sensor fill (assigned ER/AP colour) or ER/AP ring colour. */
  color: string | null;
  severity: Severity | undefined;
  selected: boolean;
  draggable: boolean;
  highlighted: boolean;
  onMouseDown?: (e: KonvaEventObject<MouseEvent>, node: PlanNode) => void;
  onClick?: (e: KonvaEventObject<MouseEvent>, node: PlanNode) => void;
  onDragStart?: (e: KonvaDrag, node: PlanNode) => void;
  onDragMove?: (e: KonvaDrag, node: PlanNode) => void;
  onDragEnd?: (e: KonvaDrag, node: PlanNode) => void;
}

function Body({ node, color }: { node: PlanNode; color: string | null }) {
  switch (node.type) {
    case "edgeRouter":
      return (
        <>
          {color && <Circle radius={16} stroke={color} strokeWidth={3} />}
          <Rect x={-10} y={-10} width={20} height={20} cornerRadius={3} fill={NODE_COLORS.edgeRouter} stroke="#fff" strokeWidth={1.5} />
          <Text text="ER" x={-10} y={-5} width={20} align="center" fontSize={10} fontStyle="bold" fill="#fff" listening={false} />
        </>
      );
    case "accessPoint":
      return (
        <>
          {color && <Circle radius={16} stroke={color} strokeWidth={3} />}
          <Circle radius={11} fill={NODE_COLORS.accessPoint} stroke="#fff" strokeWidth={1.5} />
          <Text text="AP" x={-10} y={-5} width={20} align="center" fontSize={10} fontStyle="bold" fill="#fff" listening={false} />
        </>
      );
    case "poeSwitch":
      return <Rect x={-10} y={-6} width={20} height={12} cornerRadius={2} fill={NODE_COLORS.poeSwitch} stroke="#fff" strokeWidth={1.5} />;
    case "smartLock":
      return (
        <Group rotation={node.facingDeg}>
          {/* +x is the facing direction */}
          <Rect x={-5} y={-8} width={10} height={16} cornerRadius={2} fill={color ?? NODE_COLORS.unassigned} stroke="#fff" strokeWidth={1.5} />
          <RegularPolygon x={8} sides={3} radius={4} rotation={90} fill={color ?? NODE_COLORS.unassigned} />
        </Group>
      );
    case "smartMotion":
      return <RegularPolygon sides={3} radius={10} fill={color ?? NODE_COLORS.unassigned} stroke="#fff" strokeWidth={1.5} />;
  }
}

function labelOf(node: PlanNode): string {
  switch (node.type) {
    case "edgeRouter":
    case "accessPoint":
    case "poeSwitch":
      return node.label;
    case "smartLock":
      return node.unit;
    case "smartMotion":
      return node.area || node.unit;
  }
}

function NodeGlyph({
  node,
  k,
  color,
  severity,
  selected,
  draggable,
  highlighted,
  onMouseDown,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: NodeGlyphProps) {
  const label = labelOf(node);
  return (
    <Group
      x={node.x}
      y={node.y}
      scaleX={k}
      scaleY={k}
      draggable={draggable}
      onMouseDown={(e) => onMouseDown?.(e, node)}
      onClick={(e) => onClick?.(e, node)}
      onDragStart={(e) => onDragStart?.(e, node)}
      onDragMove={(e) => onDragMove?.(e, node)}
      onDragEnd={(e) => onDragEnd?.(e, node)}
    >
      {severity && <Circle radius={20} stroke={SEVERITY_COLORS[severity]} strokeWidth={3} listening={false} />}
      {(selected || highlighted) && (
        <Circle radius={24} stroke={SELECTION_COLOR} strokeWidth={2} dash={[4, 3]} listening={false} />
      )}
      <Body node={node} color={color} />
      {label && (
        <Text
          text={label}
          x={-40}
          y={node.type === "smartLock" ? 12 : 18}
          width={80}
          align="center"
          fontSize={11}
          fill="#18181b"
          stroke="#fff"
          strokeWidth={3}
          fillAfterStrokeEnabled
          listening={false}
        />
      )}
    </Group>
  );
}

export default memo(NodeGlyph);
