import { getEnvironmentName } from "@hooks/opentech";

export default function FacilityPendingRow({
  facility,
  colSpan,
}: {
  facility: any;
  colSpan: number;
}) {
  return (
    <tr className="border border-zinc-300 dark:border-zinc-700">
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
          <p className="truncate max-w-[20ch]">{facility.name}</p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {getEnvironmentName(facility)}
          </span>
        </div>
      </td>
      <td colSpan={colSpan - 1} className="px-4 py-2">
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </td>
    </tr>
  );
}
