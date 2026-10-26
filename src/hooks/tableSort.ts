import { useMemo, useState } from "react";

type SortDirection = "asc" | "desc" | null;
type Accessor = (row: any) => any;

/**
 * Sort state for a DataTable. Unlike sorting a copy into state, the sort is
 * derived from `rows`, so it stays applied when rows change (data streaming
 * in, a refresh, or a new search). Clicking a column cycles asc → desc → off.
 */
export function useTableSort<T>(rows: T[]) {
  const [sortedColumn, setSortedColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [accessor, setAccessor] = useState<Accessor | null>(null);

  const onSort = (columnKey: string, columnAccessor?: Accessor) => {
    let next: SortDirection;
    if (sortedColumn !== columnKey) next = "asc";
    else if (sortDirection === "asc") next = "desc";
    else next = null;

    setSortedColumn(next ? columnKey : null);
    setSortDirection(next);
    // Wrapped so React stores the function instead of calling it as an updater
    setAccessor(() => columnAccessor ?? ((row: any) => row[columnKey]));
  };

  const sortedRows = useMemo(() => {
    if (!sortDirection || !accessor) return rows;
    return [...rows].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortDirection, accessor]);

  return { sortedRows, sortedColumn, sortDirection, onSort };
}
