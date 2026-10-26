import { RULES } from "@views/smartspace/mapping/model/rules";
import { naturalCompare } from "@views/smartspace/mapping/model/unitNumbers";
import type { PlanLayout, PlanSummary, SmartLockNode } from "@views/smartspace/mapping/model/types";

export function summarize(layout: PlanLayout): PlanSummary {
  const summary: PlanSummary = {
    edgeRouters: 0,
    accessPoints: 0,
    poeSwitches: 0,
    smartLocks: 0,
    smartMotion100: 0,
    smartMotion200: 0,
  };
  for (const node of layout.nodes) {
    switch (node.type) {
      case "edgeRouter":
        summary.edgeRouters++;
        break;
      case "accessPoint":
        summary.accessPoints++;
        break;
      case "poeSwitch":
        summary.poeSwitches++;
        break;
      case "smartLock":
        summary.smartLocks++;
        break;
      case "smartMotion":
        if (node.model === "PIR-200") summary.smartMotion200++;
        else summary.smartMotion100++;
        break;
    }
  }
  return summary;
}

export interface BomRow {
  item: string;
  detail: string;
  quantity: string;
}

export function bomRows(layout: PlanLayout): BomRow[] {
  const s = summarize(layout);
  const boards = (type: "edgeRouter" | "accessPoint") => {
    const counts = new Map<string, number>();
    for (const n of layout.nodes) {
      if (n.type === type) counts.set(n.board, (counts.get(n.board) ?? 0) + 1);
    }
    return [...counts].map(([board, n]) => `${n} × ${board}`).join(", ");
  };
  return [
    { item: "OpenNet Edge Router", detail: boards("edgeRouter"), quantity: String(s.edgeRouters) },
    { item: "OpenNet Access Point", detail: boards("accessPoint"), quantity: String(s.accessPoints) },
    { item: "PoE+ switch", detail: "", quantity: String(s.poeSwitches) },
    { item: "SmartLock S", detail: "", quantity: String(s.smartLocks) },
    { item: "SmartMotion PIR-100", detail: "2 AA lithium", quantity: String(s.smartMotion100) },
    { item: "SmartMotion PIR-200", detail: "4 AA alkaline", quantity: String(s.smartMotion200) },
    {
      item: "PoE+ budget",
      detail: `${RULES.POE_WATTS} W × ${s.edgeRouters + s.accessPoints} OpenNet devices`,
      quantity: `${RULES.POE_WATTS * (s.edgeRouters + s.accessPoints)} W`,
    },
  ];
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** The SmartLock manual's install list: unit + last 4 of the UID, filled in by the installer. */
export function lockInstallCsv(layout: PlanLayout): string {
  const locks = layout.nodes.filter((n): n is SmartLockNode => n.type === "smartLock");
  locks.sort((a, b) => naturalCompare(a.group, b.group) || naturalCompare(a.unit, b.unit));
  const lines = [["Group", "Unit", "UID Last 4"], ...locks.map((l) => [l.group, l.unit, ""])];
  return lines.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
