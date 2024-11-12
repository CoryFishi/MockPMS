import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import {
  RiSignalWifi1Fill,
  RiSignalWifi2Fill,
  RiSignalWifi3Fill,
  RiSignalWifiFill,
  RiErrorWarningFill,
} from "react-icons/ri";
import {
  MdBattery20,
  MdBattery60,
  MdBattery80,
  MdBatteryFull,
  MdBattery0Bar,
} from "react-icons/md";
import { FaLock, FaLockOpen, FaCheckCircle } from "react-icons/fa";
import { BsShieldLockFill } from "react-icons/bs";
import { IoIosWarning } from "react-icons/io";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function AllSmartLocksReport({
  selectedFacilities,
  searchQuery,
}) {
  const [filteredSmartLocks, setFilteredSmartLocks] = useState([]);
  const [smartlocks, setSmartlocks] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);

  const fetchSmartLock = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${facility.id}/smartlockstatus`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const smartLocks = response.data;
      return smartLocks;
    } catch (error) {
      console.error(`Error fetching SmartLocks for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have SmartLocks`);
      return null;
    }
  };

  const fetchDataForSelectedFacilities = async () => {
    setSmartlocks([]); // Clear existing data
    const fetchPromises = selectedFacilities.map(async (facility) => {
      const facilityName = facility.name;
      const smartlockData = await fetchSmartLock(facility);

      // Add facilityName to each smartlock in the fetched data
      const updatedSmartlockData = smartlockData.map((smartlock) => ({
        ...smartlock,
        facilityName,
      }));

      return updatedSmartlockData;
    });

    const allSmartlockData = await Promise.all(fetchPromises);

    // Flatten the array and update state with all smartlocks
    const flattenedData = allSmartlockData.flat();
    setSmartlocks(flattenedData);
  };

  // Pagination logic
  const pageCount = Math.ceil(filteredSmartLocks.length / rowsPerPage);

  useEffect(() => {
    fetchDataForSelectedFacilities();
  }, [selectedFacilities]);

  useEffect(() => {
    setSortedColumn("Facility");
    var sortedSmartLocks = [...smartlocks].sort((a, b) => {
      if (a.facilityName.toLowerCase() < b.facilityName.toLowerCase())
        return -1;
      if (a.facilityName.toLowerCase() > b.facilityName.toLowerCase()) return 1;
      return 0;
    });

    const filteredSmartLocks = sortedSmartLocks.filter(
      (smartlock) =>
        (smartlock.facilityName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (smartlock.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (smartlock.unitName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (smartlock.overallStatus || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (smartlock.deviceType || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(smartlock.batteryLevel || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(Math.round((smartlock.signalQuality / 255) * 100) || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (Array.isArray(smartlock.statusMessages) &&
          smartlock.statusMessages.some((message) =>
            (message || "").toLowerCase().includes(searchQuery.toLowerCase())
          ))
    );
    setFilteredSmartLocks(filteredSmartLocks);
    setCurrentPage(1);
  }, [smartlocks, searchQuery]);

  return (
    <div className="w-full px-2">
      <table className="w-full table-auto border-collapse border border-gray-300 dark:border-border">
        <thead className="select-none">
          <tr className="bg-gray-200 dark:bg-darkNavSecondary sticky top-[-1px] z-10">
            <th
              className="border border-gray-300 dark:border-border px-4 py-2  hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Facility");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
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
                  })
                );
              }}
            >
              Facility
              {sortedColumn === "Facility" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2  hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Name");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase())
                      return newDirection === "asc" ? -1 : 1;
                    if (a.name.toLowerCase() > b.name.toLowerCase())
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Name
              {sortedColumn === "Name" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Unit");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.unitName.toLowerCase() < b.unitName.toLowerCase())
                      return newDirection === "asc" ? -1 : 1;
                    if (a.unitName.toLowerCase() > b.unitName.toLowerCase())
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Unit
              {sortedColumn === "Unit" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Device Type");

                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.deviceType < b.deviceType)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.deviceType > b.deviceType)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Device Type
              {sortedColumn === "Device Type" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Signal Quality");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.signalQuality < b.signalQuality)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.signalQuality > b.signalQuality)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Signal Quality
              {sortedColumn === "Signal Quality" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Battery Level");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.batteryLevel < b.batteryLevel)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.batteryLevel > b.batteryLevel)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Battery Level
              {sortedColumn === "Battery Level" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Lock State");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.lockState < b.lockState)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.lockState > b.lockState)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Lock State
              {sortedColumn === "Lock State" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Unit Details");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.unitStatus < b.unitStatus)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.unitStatus > b.unitStatus)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Unit Details
              {sortedColumn === "Unit Details" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Lock Status Message(s)");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.overallStatusMessage < b.overallStatusMessage)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.overallStatusMessage > b.overallStatusMessage)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Lock Status Message(s)
              {sortedColumn === "Lock Status Message(s)" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
            <th
              className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Last Update");
                setFilteredSmartLocks(
                  [...filteredSmartLocks].sort((a, b) => {
                    if (a.lastUpdateTimestamp < b.lastUpdateTimestamp)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.lastUpdateTimestamp > b.lastUpdateTimestamp)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Last Update
              {sortedColumn === "Last Update" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredSmartLocks
            .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
            .map((smartlock, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary relative"
                onClick={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.facilityName}
                  {hoveredRow === index && (
                    <div className="absolute bg-gray-700 dark:bg-slate-700 text-white p-2 rounded shadow-lg z-10 top-1 left-2/4 transform -translate-x-1/2 text-left w-4/5">
                      <div className="grid grid-cols-4 gap-1 overflow-hidden">
                        {Object.entries(smartlock).map(
                          ([key, value], index) => (
                            <div key={index} className="break-words">
                              <span className="font-bold text-yellow-500">
                                {key}:
                              </span>
                              <br />
                              <span className="whitespace-normal break-words">
                                {value === null
                                  ? "null"
                                  : value === ""
                                  ? "null"
                                  : value === true
                                  ? "true"
                                  : value === false
                                  ? "false"
                                  : value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.name}
                </td>

                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.unitName}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.deviceType}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2 text-center"
                  title={smartlock.signalQualityDisplay}
                >
                  {smartlock.signalQuality < 60 ? (
                    <div className="inline-flex items-center gap-1">
                      <RiSignalWifi1Fill className="text-red-500" />
                      {Math.round((smartlock.signalQuality / 255) * 100)}%
                    </div>
                  ) : smartlock.signalQuality < 160 ? (
                    <div className="inline-flex items-center gap-1">
                      <RiSignalWifi2Fill className="text-yellow-500" />
                      {Math.round((smartlock.signalQuality / 255) * 100)}%
                    </div>
                  ) : smartlock.signalQuality < 230 ? (
                    <div className="inline-flex items-center gap-1">
                      <RiSignalWifi3Fill className="text-green-300" />
                      {Math.round((smartlock.signalQuality / 255) * 100)}%
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1">
                      <RiSignalWifiFill className="text-green-500" />
                      {Math.round((smartlock.signalQuality / 255) * 100)}%
                    </div>
                  )}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2 text-center"
                  title={smartlock.lastBatteryChangeTimestampDisplay}
                >
                  {smartlock.batteryLevel < 20 ? (
                    <div className="inline-flex items-center gap-1">
                      <MdBattery0Bar className="text-red-500" />
                      {smartlock.batteryLevel}%
                    </div>
                  ) : smartlock.batteryLevel < 50 ? (
                    <div className="inline-flex items-center gap-1">
                      <MdBattery20 className="text-yellow-500" />
                      {smartlock.batteryLevel}%
                    </div>
                  ) : smartlock.batteryLevel < 75 ? (
                    <div className="inline-flex items-center gap-1">
                      <MdBattery60 className="text-yellow-500" />
                      {smartlock.batteryLevel}%
                    </div>
                  ) : smartlock.batteryLevel < 99 ? (
                    <div className="inline-flex items-center gap-1">
                      <MdBattery80 className="text-green-300" />
                      {smartlock.batteryLevel}%
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1">
                      <MdBatteryFull className="text-green-500" />
                      {smartlock.batteryLevel}%
                    </div>
                  )}
                </td>

                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.lockState === "Locked" ? (
                    <div className="inline-flex items-center gap-2">
                      <FaLock />
                      {smartlock.lockState}
                    </div>
                  ) : smartlock.lockState === "Unlocked" ||
                    smartlock.lockState === "UnlockedLocal" ? (
                    <div className="inline-flex items-center gap-2">
                      <FaLockOpen />
                      {smartlock.lockState}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <BsShieldLockFill className="text-red-500" />
                      {smartlock.lockState}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.unitStatus}
                  {smartlock.visitorName ? " - " + smartlock.visitorName : ""}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={smartlock.lastEventTimestampDisplay}
                >
                  {smartlock.statusMessages[0] != "" ? (
                    smartlock.overallStatus === "error" ? (
                      <div className="inline-flex items-center gap-2">
                        <RiErrorWarningFill className="text-red-500 text-2xl" />
                        <div>
                          {smartlock.statusMessages.map((message, index) => (
                            <div key={index}>{message}</div>
                          ))}
                        </div>
                      </div>
                    ) : smartlock.overallStatus === "warning" ? (
                      <div className="inline-flex items-center gap-2">
                        <IoIosWarning className="text-yellow-500 text-2xl" />
                        <div>
                          {smartlock.statusMessages.map((message, index) => (
                            <div key={index}>{message}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <FaCheckCircle className="text-green-500" />
                        <div>
                          {smartlock.statusMessages.map((message, index) => (
                            <div key={index}>{message}</div>
                          ))}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 text-xl" />{" "}
                      SmartLock is online
                    </div>
                  )}
                </td>

                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.lastUpdateTimestampDisplay}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {/* Modal footer/pagination */}
      <div className="flex justify-between items-center m-3 mx-1">
        <div className="flex gap-3">
          <div>
            <select
              className="border rounded ml-2 dark:bg-darkSecondary dark:border-border"
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page on rows per page change
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
            </select>
          </div>
          <p className="text-sm">
            {currentPage === 1 ? 1 : (currentPage - 1) * rowsPerPage + 1} -{" "}
            {currentPage * rowsPerPage > filteredSmartLocks.length
              ? filteredSmartLocks.length
              : currentPage * rowsPerPage}{" "}
            of {filteredSmartLocks.length}
          </p>
        </div>
        <div className="gap-2 flex">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
          >
            <BiChevronsLeft />
          </button>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
          >
            <BiChevronLeft />
          </button>
          <p>
            {currentPage} of {pageCount}
          </p>
          <button
            disabled={currentPage === pageCount}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
          >
            <BiChevronRight />
          </button>
          <button
            disabled={currentPage === pageCount}
            onClick={() => setCurrentPage(pageCount)}
            className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
          >
            <BiChevronsRight />
          </button>
        </div>
      </div>
    </div>
  );
}
