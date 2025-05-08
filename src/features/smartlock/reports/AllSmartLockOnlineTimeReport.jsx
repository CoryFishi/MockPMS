import PaginationFooter from "@components/shared/PaginationFooter";
import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { RiErrorWarningFill } from "react-icons/ri";

export default function AllSmartLockOnlineTimeReport({
  selectedFacilities,
  searchQuery,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [durations, setDurations] = useState({});
  const [filteredDurations, setFilteredDurations] = useState({});
  const [dayValue, setDayValue] = useState(7);
  const currentTime = Math.floor(Date.now() / 1000);
  const pastDayValue = currentTime - dayValue * 24 * 60 * 60;
  const [hoveredRow, setHoveredRow] = useState(null);

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
    link.setAttribute("download", "SmartLock_Offline.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const fetchSmartLockEvents = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
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
      const smartLockEvents = await response.data;
      smartLockEvents.sort(
        (a, b) => new Date(a.createdUtc) - new Date(b.createdUtc)
      );
      console.log(smartLockEvents);
      return smartLockEvents;
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
      const { deviceId, deviceName, eventType, createdUtc, facilityName } =
        event;
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
      const smartlockData = await fetchSmartLockEvents(facility);
      return smartlockData;
    });

    const allSmartlockData = await Promise.all(fetchPromises);

    // Flatten the array and update state with all smartlocks
    const flattenedData = allSmartlockData.flat();
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
      ].some((field) => field.includes(searchQuery.toLowerCase()))
    );

    // Update filtered durations state
    setFilteredDurations(filteredDurations);
    setCurrentPage(1);
  }, [durations, searchQuery]);

  return (
    <div className="w-full px-2">
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
            <option value={7}>7</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
            <option value={120}>120</option>
            <option value={180}>180</option>
          </select>
          days
        </p>
        <p
          className="text-black dark:text-white rounded-sm hover:text-gray-400 dark:hover:text-gray-400 hover:cursor-pointer mr-2"
          onClick={() => exportDurations()}
        >
          Export
        </p>
      </div>
      <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
        {/* Header */}
        <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary">
          <tr className="bg-gray-200 dark:bg-darkNavSecondary text-center">
            {/* Facility Column */}
            <th
              className="px-4 py-2 hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Facility");

                // Convert to array, sort, and update state
                const sortedDurations = Object.values(filteredDurations).sort(
                  (a, b) => {
                    if (
                      a.facilityName.toLowerCase() <
                      b.facilityName.toLowerCase()
                    )
                      return newDirection === "asc" ? -1 : 1;
                    if (
                      a.facilityName.toLowerCase() >
                      b.facilityName.toLowerCase()
                    )
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  }
                );
                setFilteredDurations(sortedDurations);
              }}
            >
              Facility
              {sortedColumn === "Facility" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>

            {/* Device Name Column */}
            <th
              className="px-4 py-2 hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Device Name");

                // Convert to array, sort, and update state
                const sortedDurations = Object.values(filteredDurations).sort(
                  (a, b) => {
                    if (a.deviceName.toLowerCase() < b.deviceName.toLowerCase())
                      return newDirection === "asc" ? -1 : 1;
                    if (a.deviceName.toLowerCase() > b.deviceName.toLowerCase())
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  }
                );
                setFilteredDurations(sortedDurations);
              }}
            >
              Device Name
              {sortedColumn === "Device Name" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>

            {/* Offline Time Column */}
            <th
              className="px-4 py-2 hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Offline Time");

                // Convert to array, sort, and update state
                const sortedDurations = Object.values(filteredDurations).sort(
                  (a, b) => {
                    return newDirection === "asc"
                      ? a.totalDuration - b.totalDuration
                      : b.totalDuration - a.totalDuration;
                  }
                );
                setFilteredDurations(sortedDurations);
              }}
            >
              Offline Time (minutes)
              {sortedColumn === "Offline Time" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>

            {/* Online Time Percentage Column */}
            <th
              className="px-4 py-2 hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Online Time");

                // Convert to array, sort, and update state
                const sortedDurations = Object.values(filteredDurations).sort(
                  (a, b) => {
                    return newDirection === "asc"
                      ? a.totalDuration - b.totalDuration
                      : b.totalDuration - a.totalDuration;
                  }
                );
                setFilteredDurations(sortedDurations);
              }}
            >
              Online Time %
              {sortedColumn === "Online Time" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>

            {/* Status Column */}
            <th
              className="px-4 py-2 hover:cursor-pointer hover:bg-gray-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Status");

                // Convert to array, sort, and update state
                const sortedDurations = Object.values(filteredDurations).sort(
                  (a, b) => {
                    if (!a.offlineStart) return newDirection === "asc" ? -1 : 1;
                    if (!b.offlineStart) return newDirection === "asc" ? 1 : -1;
                    return newDirection === "asc"
                      ? new Date(a.offlineStart) - new Date(b.offlineStart)
                      : new Date(b.offlineStart) - new Date(a.offlineStart);
                  }
                );
                setFilteredDurations(sortedDurations);
              }}
            >
              Status
              {sortedColumn === "Status" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.values(filteredDurations)
            .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
            .map((device, index) => (
              <tr
                className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary relative hover:cursor-pointer"
                key={index}
                onClick={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {device.facilityName}
                  {hoveredRow === index && (
                    <div className="absolute bg-gray-700 dark:bg-gray-700 text-white p-2 rounded-sm shadow-lg z-10 top-10 left-2/4 transform -translate-x-1/2 text-left w-5/6">
                      <div className="grid grid-cols-4 gap-1 overflow-hidden">
                        <div>
                          <span className="font-bold text-yellow-500">
                            Facility:
                          </span>
                          {device.facilityName}
                        </div>
                        <div>
                          <span className="font-bold text-yellow-500">
                            Device Name:
                          </span>
                          {device.deviceName}
                        </div>
                        <div>
                          <span className="font-bold text-yellow-500">
                            Offline Time:
                          </span>
                          {Math.round(device.totalDuration / 60)}
                        </div>
                        <div>
                          <span className="font-bold text-yellow-500">
                            Online Time %:
                          </span>
                          {(
                            ((currentTime -
                              pastDayValue -
                              device.totalDuration) /
                              (currentTime - pastDayValue)) *
                            100
                          ).toFixed(2)}
                          %
                        </div>
                        <div>
                          <span className="font-bold text-yellow-500">
                            Status:
                          </span>
                          {device.offlineStart ? "Offline" : "Online"}
                        </div>

                        <div>
                          <span className="font-bold text-yellow-500">
                            First Online Event:
                          </span>
                          {device.firstOnlineEvent
                            ? new Date(device.firstOnlineEvent).toISOString()
                            : "No First Online Event"}
                        </div>
                        <div>
                          <span className="font-bold text-yellow-500">
                            Offline Started:
                          </span>
                          {device.offlineStart
                            ? new Date(device.offlineStart).toISOString()
                            : "Not Offline"}
                        </div>
                        <div>
                          <span className="font-bold text-yellow-500">
                            Online Started:
                          </span>
                          {device.onlineStart
                            ? new Date(device.onlineStart).toISOString()
                            : "Not Online"}
                        </div>
                        <div>
                          <span className="font-bold text-yellow-500">
                            Device Id:
                          </span>
                          {device.deviceId}
                        </div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {device.deviceName}
                </td>

                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {Math.round(device.totalDuration / 60)}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {(
                    ((currentTime - pastDayValue - device.totalDuration) /
                      (currentTime - pastDayValue)) *
                    100
                  ).toFixed(2)}
                  %
                </td>
                <td
                  className="border-y border-gray-300 dark:border-border px-4 py-2"
                  title={
                    device.offlineStart
                      ? device.offlineStart.toISOString()
                      : device.onlineStart.toISOString()
                  }
                >
                  {device.offlineStart ? (
                    <div className="inline-flex items-center gap-2">
                      <RiErrorWarningFill className="text-red-500 text-2xl" />
                      <div>Offline</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 text-xl" />
                      <div>Online</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Modal footer/pagination */}
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
