import React from "react";

export default function DataTable({
  columns,
  data,
  currentPage = 1,
  rowsPerPage = 25,
  sortDirection,
  sortedColumn,
  onSort,
  hoveredRow = null,
  setHoveredRow = null,
  onRowClick = null,
}) {
  const paginatedData = data.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <table className="w-full table-auto border-collapse border-zinc-300 dark:border-border">
      <thead className="sticky top-[-1px] z-10 bg-zinc-200 dark:bg-darkNavSecondary">
        <tr>
          {columns.map(({ key, label, accessor, sortable = true }) => (
            <th
              key={key}
              className={`px-4 py-2 select-none justify-center text-center items-center ${
                sortable
                  ? "hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-darkPrimary"
                  : ""
              } ${
                sortedColumn === key && sortable
                  ? "bg-zinc-300 dark:bg-darkPrimary"
                  : ""
              }`}
              onClick={() => {
                if (sortable && onSort) onSort(key, accessor);
              }}
            >
              {label}
              {sortedColumn === key && sortable && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {paginatedData.map((item, index) => (
          <tr
            key={index}
            onClick={() => onRowClick?.(item)}
            onMouseEnter={
              setHoveredRow ? () => setHoveredRow(index) : undefined
            }
            onMouseLeave={setHoveredRow ? () => setHoveredRow(null) : undefined}
            className={`hover:bg-gray-100 dark:hover:bg-darkNavSecondary ${
              hoveredRow ? "cursor-pointer" : ""
            }`}
          >
            {columns.map(({ key, accessor, render }) => (
              <td
                key={key}
                className="border-y border-zinc-300 dark:border-border px-4 py-2 text-center items-center justify-center"
              >
                {render
                  ? render(item)
                  : typeof accessor === "function"
                  ? accessor(item)
                  : item[key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
