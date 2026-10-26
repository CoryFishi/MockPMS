import type { ComponentType, ReactNode } from "react";

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  meta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode; // right-aligned, e.g. a "last pulled" timestamp
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-zinc-300 bg-zinc-200 px-5 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Icon className="shrink-0 text-lg" />
        <span className="shrink-0">{title}</span>
        {subtitle && (
          <>
            <span className="text-zinc-400 dark:text-zinc-600">|</span>
            <span className="truncate text-zinc-600 dark:text-zinc-400">
              {subtitle}
            </span>
          </>
        )}
      </div>
      {meta && (
        <div className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          {meta}
        </div>
      )}
    </div>
  );
}
