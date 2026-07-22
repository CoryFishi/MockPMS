import { getEnvironmentName } from "@hooks/opentech";

export default function FacilityPendingCard({ facility }: { facility: any }) {
  return (
    <div className="mb-4 rounded-lg border bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
        <h2 className="truncate font-bold text-black dark:text-white">
          {facility.name}
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {getEnvironmentName(facility)}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
