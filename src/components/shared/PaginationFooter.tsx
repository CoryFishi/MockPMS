import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function PaginationFooter({
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  items,
}) {
  const pageCount = Math.max(1, Math.ceil(items.length / rowsPerPage));
  const firstItem = items.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastItem = Math.min(currentPage * rowsPerPage, items.length);

  return (
    <div className="flex justify-between items-center select-none">
      <div className="flex gap-3">
        <div>
          <select
            className="border rounded-sm ml-2 dark:bg-zinc-800 dark:border-zinc-700 hover:cursor-pointer"
            id="rowsPerPage"
            aria-label="Rows per page"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page on rows per page change
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
          </select>
        </div>
        <p className="text-sm">
          {firstItem} - {lastItem} of {items.length}
        </p>
      </div>
      <div className="gap-2 flex">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(1)}
          aria-label="First page"
          title="First page"
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronsLeft />
        </button>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          aria-label="Previous page"
          title="Previous page"
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronLeft />
        </button>
        <p>
          {currentPage} of {pageCount}
        </p>
        <button
          disabled={currentPage >= pageCount}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          aria-label="Next page"
          title="Next page"
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronRight />
        </button>
        <button
          disabled={currentPage >= pageCount}
          onClick={() => setCurrentPage(pageCount)}
          aria-label="Last page"
          title="Last page"
          className="hover:cursor-pointer disabled:cursor-not-allowed p-1 disabled:text-zinc-500"
        >
          <BiChevronsRight />
        </button>
      </div>
    </div>
  );
}
