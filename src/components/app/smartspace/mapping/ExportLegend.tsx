import type { ReactNode } from "react";
import { Circle, Group, Line, Rect, RegularPolygon, Text } from "react-konva";
import type { BomRow } from "@views/smartspace/mapping/model/exports";
import { LINK_COLORS, NODE_COLORS } from "@views/smartspace/mapping/colors";

const WIDTH = 300;
const ROW = 20;

/** Legend + bill of materials drawn into the top-left corner of the PNG export. */
export default function ExportLegend({ title, subtitle, bom, scale }: { title: string; subtitle: string; bom: BomRow[]; scale: number }) {
  const symbols: { label: string; draw: (y: number) => ReactNode }[] = [
    { label: "Edge Router", draw: (y) => <Rect x={12} y={y - 7} width={14} height={14} cornerRadius={2} fill={NODE_COLORS.edgeRouter} /> },
    { label: "Access Point", draw: (y) => <Circle x={19} y={y} radius={7} fill={NODE_COLORS.accessPoint} /> },
    { label: "PoE switch", draw: (y) => <Rect x={11} y={y - 5} width={16} height={10} fill={NODE_COLORS.poeSwitch} /> },
    { label: "SmartLock (arrow = door facing)", draw: (y) => <Rect x={15} y={y - 6} width={8} height={12} fill={NODE_COLORS.unassigned} /> },
    { label: "SmartMotion", draw: (y) => <RegularPolygon x={19} y={y} sides={3} radius={8} fill={NODE_COLORS.unassigned} /> },
    { label: "Wired link", draw: (y) => <Line points={[8, y, 30, y]} stroke={LINK_COLORS.wired} strokeWidth={3} /> },
    { label: "Ethernet tether", draw: (y) => <Line points={[8, y, 30, y]} stroke={LINK_COLORS.tether} strokeWidth={3} dash={[6, 3]} /> },
  ];
  const headerHeight = 54;
  const symbolsHeight = symbols.length * ROW + 10;
  const bomHeight = (bom.length + 1) * ROW + 10;
  const height = headerHeight + symbolsHeight + bomHeight;

  return (
    <Group x={20 * scale} y={20 * scale} scaleX={scale} scaleY={scale}>
      <Rect width={WIDTH} height={height} fill="#ffffff" stroke="#3f3f46" strokeWidth={1} cornerRadius={4} opacity={0.95} />
      <Text x={10} y={10} width={WIDTH - 20} text={title} fontSize={16} fontStyle="bold" fill="#18181b" />
      <Text x={10} y={32} width={WIDTH - 20} text={subtitle} fontSize={11} fill="#52525b" />
      {symbols.map((s, i) => {
        const y = headerHeight + i * ROW + ROW / 2;
        return (
          <Group key={s.label}>
            {s.draw(y)}
            <Text x={40} y={y - 6} text={s.label} fontSize={12} fill="#18181b" />
          </Group>
        );
      })}
      <Text x={10} y={headerHeight + symbolsHeight} text="Bill of materials" fontSize={12} fontStyle="bold" fill="#18181b" />
      {bom.map((row, i) => {
        const y = headerHeight + symbolsHeight + (i + 1) * ROW;
        return (
          <Group key={row.item}>
            <Text x={10} y={y} width={WIDTH - 80} text={row.item} fontSize={12} fill="#18181b" />
            <Text x={WIDTH - 70} y={y} width={60} align="right" text={row.quantity} fontSize={12} fontStyle="bold" fill="#18181b" />
          </Group>
        );
      })}
    </Group>
  );
}
