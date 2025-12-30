import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import DetailModal from "@components/shared/DetailModal";
import { useState, useEffect } from "react";
import { FaWarehouse, FaLock, FaLockOpen, FaCheckCircle } from "react-icons/fa";
import {
  MdBattery20,
  MdBattery60,
  MdBattery80,
  MdBatteryFull,
  MdBattery0Bar,
} from "react-icons/md";
import {
  RiSignalWifi1Fill,
  RiSignalWifi2Fill,
  RiSignalWifi3Fill,
  RiSignalWifiFill,
  RiErrorWarningFill,
} from "react-icons/ri";
import { BsShieldLockFill } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";

export default function SmartLockModal({
  smartlockModalOption,
  smartLocks,
  facilityName,
  setIsSmartlockModalOpen,
}) {
  const [filteredSmartLocks, setFilteredSmartLocks] = useState([]);
  const [option, setOption] = useState(smartlockModalOption);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState("Name");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedLock, setSelectedLock] = useState(null);
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
      setFilteredSmartLocks([...smartLocks]);
      return;
    }

    setFilteredSmartLocks(
      [...filteredSmartLocks].sort((a, b) => {
        const aVal = accessor(a);
        const bVal = accessor(b);
        return newDirection === "asc"
          ? aVal.localeCompare?.(bVal) ?? aVal - bVal
          : bVal.localeCompare?.(aVal) ?? bVal - aVal;
      })
    );
  };

  useEffect(() => {
    let sorted = [...smartLocks].sort((a, b) => a.name.localeCompare(b.name));
    switch (option) {
      case "good":
        sorted = sorted.filter(
          (l) => l.overallStatus === "ok" || l.overallStatus === "notification"
        );
        break;
      case "warning":
        sorted = sorted.filter((l) => l.overallStatus === "warning");
        break;
      case "error":
        sorted = sorted.filter((l) => l.overallStatus === "error");
        break;
      case "lowestSignal": {
        const min = Math.min(
          ...sorted
            .filter((l) => !l.isDeviceOffline)
            .map((l) => l.signalQuality)
        );
        sorted = sorted.filter((l) => l.signalQuality === min);
        break;
      }
      case "lowestBattery": {
        const min = Math.min(
          ...sorted.filter((l) => !l.isDeviceOffline).map((l) => l.batteryLevel)
        );
        sorted = sorted.filter((l) => l.batteryLevel === min);
        break;
      }
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

    setFilteredSmartLocks(filtered);
    setCurrentPage(1);
  }, [smartLocks, option, searchQuery]);

  const columns = [
    {
      key: "name",
      label: "Name",
      accessor: (r) => r.name,
      render: (r) => <span>{r.name}</span>,
    },
    {
      key: "unitName",
      label: "Unit",
      accessor: (r) => r.unitName,
    },
    {
      key: "deviceType",
      label: "Device Type",
      accessor: (r) => r.deviceType,
    },
    {
      key: "signalQuality",
      label: "Signal Quality",
      accessor: (r) => r.signalQuality,
      render: (r) => {
        const pct = Math.round((r.signalQuality / 255) * 100);
        const Icon =
          pct < 24
            ? RiSignalWifi1Fill
            : pct < 63
            ? RiSignalWifi2Fill
            : pct < 90
            ? RiSignalWifi3Fill
            : RiSignalWifiFill;
        const color =
          pct < 20
            ? "text-red-500"
            : pct < 70
            ? "text-yellow-500"
            : "text-green-500";
        return (
          <span className="inline-flex items-center gap-1">
            <Icon className={`${color}`} /> {pct}%
          </span>
        );
      },
    },
    {
      key: "batteryLevel",
      label: "Battery",
      accessor: (r) => r.batteryLevel,
      render: (r) => {
        const lvl = r.batteryLevel;
        const Icon =
          lvl < 20
            ? MdBattery0Bar
            : lvl < 50
            ? MdBattery20
            : lvl < 75
            ? MdBattery60
            : lvl < 99
            ? MdBattery80
            : MdBatteryFull;
        const color =
          lvl < 30
            ? "text-red-500"
            : lvl < 99
            ? "text-yellow-500"
            : "text-green-500";
        return (
          <span className="inline-flex items-center gap-1">
            <Icon className={`${color}`} /> {lvl}%
          </span>
        );
      },
    },
    {
      key: "lockState",
      label: "Lock State",
      accessor: (r) => r.lockState,
      render: (r) => {
        const Icon =
          r.lockState === "Locked"
            ? FaLock
            : r.lockState.includes("Unlocked")
            ? FaLockOpen
            : BsShieldLockFill;
        const color =
          r.lockState === "Locked"
            ? "text-green-500"
            : r.lockState.includes("Unlocked")
            ? "text-yellow-500"
            : "text-red-500";

        return (
          <span className="inline-flex items-center gap-2">
            <Icon className={`${color}`} /> {r.lockState}
          </span>
        );
      },
    },
    {
      key: "unitStatus",
      label: "Unit Details",
      accessor: (r) => r.unitStatus,
      render: (r) => (
        <span>
          {r.unitStatus}
          {r.visitorName ? " - " + r.visitorName : ""}
        </span>
      ),
    },
    {
      key: "statusMessages",
      label: "Lock Status",
      accessor: (r) =>
        r.statusMessages?.some((m) => m.trim() !== "")
          ? r.statusMessages.join(" | ").toLowerCase()
          : "SmartLock is online",
      render: (r) => {
        const Icon =
          r.overallStatus === "error"
            ? RiErrorWarningFill
            : r.overallStatus === "warning"
            ? IoIosWarning
            : FaCheckCircle;
        const color =
          r.overallStatus === "error"
            ? "text-red-500"
            : r.overallStatus === "warning"
            ? "text-yellow-500"
            : "text-green-500";

        return (
          <div className={`flex items-center justify-center gap-2 ${color}`}>
            <Icon className="text-xl" />
            <span className="flex flex-col text-left">
              {r.statusMessages?.some((m) => m.trim() !== "")
                ? r.statusMessages.map((m, i) => <span key={i}>{m}</span>)
                : "SmartLock is online"}
            </span>
          </div>
        );
      },
    },
    {
      key: "lastUpdateTimestampDisplay",
      label: "Last Update",
      accessor: (r) => r.lastUpdateTimestampDisplay,
    },
  ];

  const handleRowClick = (row) => {
    setSelectedLock(row);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      {isDetailModalOpen && (
        <DetailModal
          device={selectedLock}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
      <div className="bg-white rounded-sm shadow-lg text-black relative max-h-[95vh] w-full max-w-[95vw] dark:text-white dark:bg-zinc-900">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            <FaWarehouse />
            <h2 className="ml-2 text-lg font-bold">
              {facilityName}&apos;s SmartLocks
            </h2>
          </div>
          <button
            onClick={() => setIsSmartlockModalOpen(false)}
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
            placeholder="Search SmartLocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 border p-2 w-full dark:bg-zinc-800 rounded-sm dark:border-zinc-700"
          />
          <div className="h-[73vh] overflow-y-auto text-center">
            <DataTable
              columns={columns}
              data={filteredSmartLocks}
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
              items={filteredSmartLocks}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
