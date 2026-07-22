import { IoIosWarning } from "react-icons/io";
import { getEnvironmentName } from "@hooks/opentech";

export function errorReason(error: any): string {
  if (error?.message === "Authentication failed") return "Authentication failed";
  if (error?.code === "ECONNABORTED") return "Request timed out";
  if (error?.response?.status) return `Request failed (HTTP ${error.response.status})`;
  return "Failed to load facility data";
}

export default function FacilityErrorRow({
  facility,
  error,
  onRetry,
  isRetrying,
  colSpan,
}: {
  facility: any;
  error: any;
  onRetry: () => void;
  isRetrying: boolean;
  colSpan: number;
}) {
  return (
    <tr className="border border-zinc-300 bg-red-50 dark:border-zinc-700 dark:bg-red-950/30">
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <IoIosWarning className="min-w-5 text-red-500" />
          <p className="truncate max-w-[20ch]">{facility.name}</p>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {getEnvironmentName(facility)}
          </span>
        </div>
      </td>
      <td colSpan={colSpan - 1} className="px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-red-600 dark:text-red-400">
            {errorReason(error)}
          </span>
          <button
            className="rounded-sm bg-yellow-500 px-3 py-1 font-bold text-white hover:bg-yellow-600 disabled:opacity-50 cursor-pointer"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        </div>
      </td>
    </tr>
  );
}
