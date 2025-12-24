import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import DetailModal from "@components/shared/DetailModal";
import { useState, useEffect } from "react";
import { FaWarehouse, FaCheckCircle } from "react-icons/fa";
import { RiErrorWarningFill } from "react-icons/ri";
import { IoIosWarning } from "react-icons/io";

export default function AccessPointModal({
  accessPointModalOption,
  accessPoints,
  facilityName,
  setIsAccessPointModalOpen,
}) {
  const [filteredAccessPoints, setFilteredAccessPoints] = useState([]);
  const [option, setOption] = useState(accessPointModalOption);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("Name");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedAccessPoint, setSelectedAccessPoint] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    let newDirection;

    if (sortedColumn !== columnKey) {
      newDirection = "asc";
    } else if (sortDirection === "asc") {
      newDirection = "desc";
    } else if (sortDirection === "desc") {
      newDirection = null;
    }

    setSortedColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);

    if (!newDirection) {
      setFilteredAccessPoints([...accessPoints]);
      return;
    }

    setFilteredAccessPoints(
      [...filteredAccessPoints].sort((a, b) => {
        const aVal = accessor(a);
        const bVal = accessor(b);
        return newDirection === "asc"
          ? aVal.localeCompare?.(bVal) ?? aVal - bVal
          : bVal.localeCompare?.(aVal) ?? bVal - aVal;
      })
    );
  };

  useEffect(() => {
    let sorted = [...accessPoints].sort((a, b) => a.name.localeCompare(b.name));
    switch (option) {
      case "online":
        sorted = sorted.filter((l) => !l.isDeviceOffline);
        break;
      case "offline":
        sorted = sorted.filter((l) => l.isDeviceOffline);
        break;
    }

    const filtered = sorted.filter(
      (l) =>
        [l.name, l.unitName, l.overallStatus, l.deviceType].some((f) =>
          (f || "").toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        String(l.batteryLevel).includes(searchQuery) ||
        String(Math.round((l.signalQuality / 255) * 100)).includes(
          searchQuery
        ) ||
        l.statusMessages?.some((m) =>
          m?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    setFilteredAccessPoints(filtered);
    setCurrentPage(1);
  }, [accessPoints, option, searchQuery]);

  const columns = [
    {
      key: "name",
      label: "Name",
      accessor: (r) => r.name,
      render: (r) => <span>{r.name}</span>,
    },
    {
      key: "connectionStatus",
      label: "Device Status",
      accessor: (r) => r.connectionStatus,
      render: (r) => {
        const Icon =
          r.connectionStatus === "error"
            ? RiErrorWarningFill
            : r.connectionStatus === "warning"
            ? IoIosWarning
            : FaCheckCircle;
        const color =
          r.connectionStatus === "error"
            ? "text-red-500"
            : r.connectionStatus === "warning"
            ? "text-yellow-500"
            : "text-green-500";

        return (
          <div className={`inline-flex items-center gap-2 ${color}`}>
            <Icon className="text-xl" />
            <span className="flex flex-col text-left">
              {r.connectionStatusMessage}
            </span>
          </div>
        );
      },
    },
    {
      key: "isDevicePaired",
      label: "Pairing",
      accessor: (r) => r.isDevicePaired,
      render: (r) => (r.isDevicePaired ? "Yes" : "No"),
    },
    {
      key: "isDeviceRebooting",
      label: "Rebooting",
      accessor: (r) => r.isDeviceRebooting,
      render: (r) => (r.isDeviceRebooting ? "Yes" : "No"),
    },
    {
      key: "lastUpdateTimestamp",
      label: "Last Update",
      accessor: (r) => r.lastUpdateTimestamp,
    },
  ];

  const handleRowClick = (row) => {
    setSelectedAccessPoint(row);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      {isDetailModalOpen && (
        <DetailModal
          device={selectedAccessPoint}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
      <div className="bg-white rounded-sm shadow-lg text-black relative max-h-[95vh] w-full max-w-[95vw] dark:text-white dark:bg-zinc-900">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            <FaWarehouse />
            <h2 className="ml-2 text-lg font-bold">
              {facilityName}&apos;s Access Points
            </h2>
          </div>
          <button
            onClick={() => setIsAccessPointModalOpen(false)}
            className="bg-zinc-100 h-full px-5 cursor-pointer rounded-tr text-zinc-600 dark:text-white dark:bg-zinc-800 dark:hover:hover:bg-red-500 hover:bg-red-500 transition duration-300 ease-in-out"
          >
            x
          </button>
        </div>
        <div className="pt-5 px-5">
          {option && (
            <p
              onClick={() => setOption(null)}
              className="text-right text-blue-500 pr-10 hover:cursor-pointer hover:text-blue-900"
            >
              clear filter
            </p>
          )}
          <input
            type="text"
            placeholder="Search Access Points..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 border p-2 w-full dark:bg-zinc-800 rounded-sm dark:border-zinc-700"
          />
          <div className="h-[73vh] overflow-y-auto text-center">
            <DataTable
              columns={columns}
              data={filteredAccessPoints}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              sortDirection={sortDirection}
              sortedColumn={sortedColumn}
              onSort={handleColumnSort}
              hoveredRow={hoveredRow}
              setHoveredRow={setHoveredRow}
              onRowClick={handleRowClick}
            />
          </div>
          <div className="px-2 py-5 mx-1">
            <PaginationFooter
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              items={filteredAccessPoints}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
