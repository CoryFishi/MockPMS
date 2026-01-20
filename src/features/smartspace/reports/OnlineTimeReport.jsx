import PaginationFooter from "@components/shared/PaginationFooter";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { RiErrorWarningFill } from "react-icons/ri";
import DataTable from "@components/shared/DataTable";
import DetailModal from "@components/shared/DetailModal";

export default function OnlineTimeReport({ selectedFacilities, searchQuery }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [durations, setDurations] = useState({});
  const [filteredDurations, setFilteredDurations] = useState([]);
  const [dayValue, setDayValue] = useState(7);
  const currentTime = Math.floor(Date.now() / 1000);
  const pastDayValue = currentTime - dayValue * 24 * 60 * 60;
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const exportDurations = () => {
    // Convert the data to CSV format
    const headers = [
      "Facility",
      "Device Name",
      "Total Offline Time",
      "Online Time %",
      "Status",
      "First Online Event",
      "Offline Start",
      "Online Start",
    ];
    // Create rows
    const csvRows = [
      headers.join(","), // Add headers to rows
      ...filteredDurations.map((device) =>
        [
          device.facilityName,
          device.deviceName,
          Math.round(device.totalDuration / 60),
          (
            ((currentTime - pastDayValue - device.totalDuration) /
              (currentTime - pastDayValue)) *
            100
          ).toFixed(2) + "%",
          device.offlineStart ? "Offline" : "Online",
          device.firstOnlineEvent
            ? new Date(device.firstOnlineEvent).toISOString()
            : "No First Online Event",
          device.offlineStart
            ? new Date(device.offlineStart).toISOString()
            : "Not Offline",
          device.onlineStart
            ? new Date(device.onlineStart).toISOString()
            : "Not Online",
        ].join(",")
      ),
    ];

    // Create a blob from the CSV rows
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create a link to download the file
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "OfflineTime.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const fetchEvents = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "staging") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accessevent.${tokenStageKey}insomniaccia${tokenEnvKey}.com/combinedevents/facilities/${facility.id}?uq=&vq=&etq=5&etq=6&minDate=${pastDayValue}&maxDate=${currentTime}&hideMetadata=true`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "3.0",
          },
        }
      );
      const events = await response.data;
      events.sort((a, b) => new Date(a.createdUtc) - new Date(b.createdUtc));
      events.forEach((event) => {
        if (event.eventDetails?.includes("SmartLock")) {
          event.eventDevice = "SmartLock";
        } else if (event.eventDetails?.includes("SmartMotion")) {
          event.eventDevice = "SmartMotion";
        } else if (event.eventDetails?.includes("Edge Router")) {
          event.eventDevice = "Edge Router";
        } else if (event.eventDetails?.includes("Access Point")) {
          event.eventDevice = "Access Point";
        }
      });
      return events;
    } catch (error) {
      console.error(`Error fetching Events for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have Events`);
      return null;
    }
  };
  function calculateOfflineDurations(events) {
    // Sort events by time
    events.sort((a, b) => {
      const timeDiff = new Date(a.createdUtc) - new Date(b.createdUtc);
      if (timeDiff === 0) {
        // Prioritize "Device Online"/5 over "Device Offline"/6 for simultaneous timestamps
        if (a.eventTypeEnum === 5 && b.eventTypeEnum === 6) return 1;
        if (a.eventTypeEnum === 6 && b.eventTypeEnum === 5) return -1;
      }
      return timeDiff;
    });
    const durationsArray = {};

    // Iterate through events
    events.forEach((event) => {
      if (event.eventTypeEnum !== 5 && event.eventTypeEnum !== 6) return;
      if (!event.deviceId) return;
      const {
        deviceId,
        deviceName,
        eventType,
        createdUtc,
        facilityName,
        eventDevice,
      } = event;
      if (!durationsArray[deviceId]) {
        durationsArray[deviceId] = {
          firstOnlineEvent: null,
          offlineStart: null,
          onlineStart: null,
          durations: [],
          totalDuration: 0,
          facilityName: facilityName,
          deviceName: deviceName,
          deviceId: deviceId,
          eventDevice: eventDevice,
        };
      }

      if (eventType === "Device Offline") {
        durationsArray[deviceId].offlineStart = new Date(createdUtc);
        durationsArray[deviceId].onlineStart = null;
      } else if (eventType === "Device Online") {
        if (!durationsArray[deviceId].firstOnlineEvent) {
          // Store the first online event time
          durationsArray[deviceId].firstOnlineEvent = new Date(createdUtc);
        }

        if (durationsArray[deviceId].offlineStart) {
          const offlineStart = durationsArray[deviceId].offlineStart;
          const onlineTime = new Date(createdUtc);
          const duration = (onlineTime - offlineStart) / 1000;

          // Add duration to list
          durationsArray[deviceId].durations.push(duration);
          durationsArray[deviceId].totalDuration += duration;

          // Reset offlineStart and set onlineStart
          durationsArray[deviceId].offlineStart = null;
          durationsArray[deviceId].onlineStart = new Date(createdUtc);
        } else {
          // Set online start time
          durationsArray[deviceId].onlineStart = new Date(createdUtc);
        }
      }
    });

    // Add offline time from the last offline event to now if still offline
    const now = new Date();
    Object.values(durationsArray).forEach((device) => {
      if (device.offlineStart) {
        const duration = (now - device.offlineStart) / 1000;
        device.durations.push(duration);
        device.totalDuration += duration;
      }
    });

    setDurations(Object.values(durationsArray));
  }
  const fetchDataForSelectedFacilities = async () => {
    const fetchPromises = selectedFacilities.map(async (facility) => {
      const eventData = await fetchEvents(facility);
      return eventData;
    });

    const allEventData = await Promise.all(fetchPromises);

    const flattenedData = allEventData.flat();
    calculateOfflineDurations(flattenedData);
  };

  useEffect(() => {
    fetchDataForSelectedFacilities();
  }, [selectedFacilities, dayValue]);
  useEffect(() => {
    setSortedColumn("Facility");

    // Convert durations object into an array for sorting and filtering
    const flattenedDurations = Object.values(durations);

    // Sort by facilityName
    const sortedDurations = [...flattenedDurations].sort((a, b) => {
      if (a.facilityName.toLowerCase() < b.facilityName.toLowerCase())
        return -1;
      if (a.facilityName.toLowerCase() > b.facilityName.toLowerCase()) return 1;
      return 0;
    });

    // Filter based on search query
    const filteredDurations = sortedDurations.filter((duration) =>
      [
        (duration.facilityName || "").toLowerCase(),
        (duration.deviceName || "").toLowerCase(),
        String(duration.totalDuration || ""),
        (duration.eventDevice || "").toLowerCase(),
        (duration.onlineTimePercentage || "").toLowerCase(),
      ].some((field) => field.includes(searchQuery.toLowerCase()))
    );

    // Update filtered durations state
    setFilteredDurations(filteredDurations);
    setCurrentPage(1);
  }, [durations, searchQuery]);

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

  const columns = [
    {
      key: "facilityName",
      label: "Facility Name",
      accessor: (r) => r.facilityName,
      render: (r) => (
        <div className="w-full flex items-center justify-center">
          <div className="truncate max-w-[32ch]">{r.facilityName}</div>
        </div>
      ),
    },
    {
      key: "eventDevice",
      label: "Device Type",
      accessor: (r) => r.eventDevice,
    },
    {
      key: "deviceName",
      label: "Device Name",
      accessor: (r) => r.deviceName,
      render: (r) => (
        <div className="w-full flex items-center justify-center">
          <div className="truncate max-w-[32ch]">{r.deviceName}</div>
        </div>
      ),
    },
    {
      key: "offlineDuration",
      label: "Offline Time (minutes)",
      accessor: (r) => Math.round(r.totalDuration / 60),
      render: (r) => (
        <div
          title={r.durations.map((d) => `${Math.round(d / 60)} min`).join(", ")}
        >
          {Math.round(r.totalDuration / 60)}
        </div>
      ),
    },
    {
      key: "onlineTimePercentage",
      label: "Online Time",
      accessor: (r) =>
        `${(
          ((currentTime - pastDayValue - r.totalDuration) /
            (currentTime - pastDayValue)) *
          100
        ).toFixed(2)}%`,
      render: (r) => (
        <div>
          {(
            ((currentTime - pastDayValue - r.totalDuration) /
              (currentTime - pastDayValue)) *
            100
          ).toFixed(2)}
          %
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      accessor: (r) => (r.offlineStart ? "Offline" : "Online"),
      render: (r) => (
        <div>
          {r.offlineStart ? (
            <div className="inline-flex items-center gap-2">
              <RiErrorWarningFill className="text-red-500 text-2xl" />
              <div>Offline</div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2">
              <FaCheckCircle className="text-green-500 text-xl" />
              <div>Online</div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleRowClick = (row) => {
    setSelectedDevice(row);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="w-full px-2">
      {isDetailModalOpen && (
        <DetailModal
          device={selectedDevice}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
      <div className="flex justify-between mb-1">
        <p className="text-left text-sm ml-2">
          Events shown from the last
          <select
            className="border rounded-sm mx-2 dark:bg-darkSecondary dark:border-border"
            id="dayValue"
            value={dayValue}
            onChange={(e) => {
              setDayValue(Number(e.target.value));
            }}
          >
            <option value={1}>1</option>
            <option value={3}>3</option>
            <option value={7}>7</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
            <option value={120}>120</option>
            <option value={180}>180</option>
          </select>
          days
        </p>
        <p
          className="text-black dark:text-white rounded-sm hover:text-zinc-400 dark:hover:text-zinc-400 hover:cursor-pointer mr-2"
          onClick={() => exportDurations()}
        >
          Export
        </p>
      </div>
      <div className="h-[73vh] overflow-y-auto text-center">
        <DataTable
          columns={columns}
          data={filteredDurations}
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
          items={filteredDurations}
        />
      </div>
    </div>
  );
}
