import type { BomRow } from "@views/smartspace/mapping/model/exports";

export default function BomPanel({ rows }: { rows: BomRow[] }) {
  return (
    <div className="p-4 text-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
            <th className="py-1">Item</th>
            <th className="py-1 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.item} className="border-b border-zinc-200 dark:border-zinc-800">
              <td className="py-1.5">
                {row.item}
                {row.detail && <div className="text-xs text-zinc-500">{row.detail}</div>}
              </td>
              <td className="py-1.5 text-right font-semibold">{row.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
