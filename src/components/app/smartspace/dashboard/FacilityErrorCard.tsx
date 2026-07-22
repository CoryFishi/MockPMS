import { IoIosWarning } from "react-icons/io";
import { getEnvironmentName } from "@hooks/opentech";
import { errorReason } from "@views/smartspace/dashboard/FacilityErrorRow";

export default function FacilityErrorCard({
  facility,
  error,
  onRetry,
  isRetrying,
}: {
  facility: any;
  error: any;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="mb-4 rounded-lg border bg-red-50 p-5 shadow-lg dark:border-zinc-700 dark:bg-red-950/30">
      <div className="flex items-center gap-2">
        <IoIosWarning className="min-w-5 text-red-500" />
        <h2 className="truncate font-bold text-black dark:text-white">
          {facility.name}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {getEnvironmentName(facility)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
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
    </div>
  );
}
