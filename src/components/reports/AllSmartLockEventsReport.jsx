import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function AllSmartLocksEventsReport({
  selectedFacilities,
  searchQuery,
}) {
  const [filteredSmartLockEvents, setFilteredSmartLockEvents] = useState([]);
  const [smartlockEvents, setSmartlockEvents] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortDirection, setSortDirection] = useState("desc");
  const [sortedColumn, setSortedColumn] = useState(null);

  const fetchSmartLockEvents = async (facility) => {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const oneWeekAgo = currentTime - 7 * 24 * 60 * 60;
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accessevent.${tokenStageKey}insomniaccia${tokenEnvKey}.com/combinedevents/facilities/${facility.id}?uq=&vq=&etq=1&etq=2&etq=3&etq=4&etq=5&etq=6&etq=7&etq=8&etq=9&etq=10&etq=11&etq=12&etq=13&etq=14&etq=15&etq=16&etq=17&etq=18&etq=19&etq=20&etq=21&etq=22&etq=23&etq=24&etq=25&minDate=${oneWeekAgo}&maxDate=${currentTime}&hideMetadata=true`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "3.0",
          },
        }
      );
      const smartLockEvents = response.data;
      console.log(smartLockEvents);
      return smartLockEvents;
    } catch (error) {
      console.error(`Error fetching Events for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have Events`);
      return null;
    }
  };

  const fetchDataForSelectedFacilities = async () => {
    setSmartlockEvents([]); // Clear existing data
    const fetchPromises = selectedFacilities.map(async (facility) => {
      const smartlockData = await fetchSmartLockEvents(facility);
      return smartlockData;
    });

    const allSmartlockData = await Promise.all(fetchPromises);

    // Flatten the array and update state with all smartlocks
    const flattenedData = allSmartlockData.flat();
    setSmartlockEvents(flattenedData);
  };

  // Pagination logic
  const pageCount = Math.ceil(filteredSmartLockEvents.length / rowsPerPage);

  useEffect(() => {
    fetchDataForSelectedFacilities();
  }, [selectedFacilities]);

  useEffect(() => {
    setSortedColumn("Created On");
    var sortedSmartLockEvents = [...smartlockEvents].sort((a, b) => {
      if (a.createdOn < b.createdOn) return 1;
      if (a.createdOn > b.createdOn) return -1;
      return 0;
    });

    const filteredSmartLockEvents = sortedSmartLockEvents.filter(
      (event) =>
        (event.facilityName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.unitName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.overallStatus || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.deviceType || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(event.batteryLevel || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(Math.round((event.signalQuality / 255) * 100) || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
    setFilteredSmartLockEvents(filteredSmartLockEvents);
    setCurrentPage(1);
  }, [smartlockEvents, searchQuery]);

  return (
    <div className="w-full px-2">
      <p className="text-left text-sm">Events shown from the last 7 days</p>
      <table className="w-full table-auto border-collapse border border-gray-300 dark:border-border">
        <thead className="select-none">
          <tr className="bg-gray-200 dark:bg-darkNavSecondary sticky top-[-1px] z-10">
            <th
              className="border border-gray-300 dark:border-border px-4 py-2  hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Facility");
                setFilteredSmartLockEvents(
                  [...filteredSmartLockEvents].sort((a, b) => {
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
                setFilteredSmartLockEvents(
                  [...filteredSmartLockEvents].sort((a, b) => {
                    if (a.deviceName < b.deviceName)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.deviceName > b.deviceName)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Device Name
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
                setSortedColumn("Event Category");
                setFilteredSmartLockEvents(
                  [...filteredSmartLockEvents].sort((a, b) => {
                    if (
                      a.eventCategory.toLowerCase() <
                      b.eventCategory.toLowerCase()
                    )
                      return newDirection === "asc" ? -1 : 1;
                    if (
                      a.eventCategory.toLowerCase() >
                      b.eventCategory.toLowerCase()
                    )
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Event Category
              {sortedColumn === "Event Category" && (
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
                setSortedColumn("Event Type");

                setFilteredSmartLockEvents(
                  [...filteredSmartLockEvents].sort((a, b) => {
                    if (a.eventType < b.eventType)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.eventType > b.eventType)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Event Type
              {sortedColumn === "Event Type" && (
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
                setSortedColumn("Event Details");
                setFilteredSmartLockEvents(
                  [...filteredSmartLockEvents].sort((a, b) => {
                    if (
                      a.eventDetails.toLowerCase() <
                      b.eventDetails.toLowerCase()
                    )
                      return newDirection === "asc" ? -1 : 1;
                    if (
                      a.eventDetails.toLowerCase() >
                      b.eventDetails.toLowerCase()
                    )
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Event Details
              {sortedColumn === "Event Details" && (
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
                setSortedColumn("Created On");
                setFilteredSmartLockEvents(
                  [...filteredSmartLockEvents].sort((a, b) => {
                    if (a.createdOn < b.createdOn)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.createdOn > b.createdOn)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Created On
              {sortedColumn === "Created On" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredSmartLockEvents
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
                  {smartlock.deviceName}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.eventCategory}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.eventType}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.eventDetails}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {smartlock.createdOn}
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
            {currentPage * rowsPerPage > filteredSmartLockEvents.length
              ? filteredSmartLockEvents.length
              : currentPage * rowsPerPage}{" "}
            of {filteredSmartLockEvents.length}
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
