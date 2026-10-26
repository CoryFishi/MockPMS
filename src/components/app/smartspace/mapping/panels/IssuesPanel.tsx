import type { Analysis, Issue } from "@views/smartspace/mapping/model/analyze";
import { SEVERITY_COLORS } from "@views/smartspace/mapping/colors";

export default function IssuesPanel({
  analysis,
  hasNodes,
  onFocus,
}: {
  analysis: Analysis;
  hasNodes: boolean;
  onFocus: (issue: Issue) => void;
}) {
  const errors = analysis.issues.filter((i) => i.severity === "error").length;
  const warnings = analysis.issues.length - errors;

  return (
    <div className="p-4 text-sm">
      {!analysis.calibrated && (
        <p className="mb-3 rounded bg-amber-100 p-2 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          Set the scale to check coverage. Only layout checks run until then.
        </p>
      )}
      <p className="mb-3 font-semibold">
        {errors} error{errors === 1 ? "" : "s"} · {warnings} warning{warnings === 1 ? "" : "s"}
      </p>
      {analysis.issues.length === 0 && hasNodes && analysis.calibrated && (
        <p className="text-green-600 dark:text-green-400">All checks pass.</p>
      )}
      <ul className="space-y-1">
        {analysis.issues.map((issue) => (
          <li key={issue.id}>
            <button
              type="button"
              onClick={() => onFocus(issue)}
              disabled={issue.nodeIds.length === 0}
              className="flex w-full cursor-pointer gap-2 rounded p-2 text-left hover:bg-zinc-200 disabled:cursor-default disabled:hover:bg-transparent dark:hover:bg-zinc-800"
            >
              <span
                className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS[issue.severity] }}
              />
              <span>{issue.message}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
