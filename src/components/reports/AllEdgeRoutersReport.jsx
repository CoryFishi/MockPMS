import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { FaCheckCircle } from "react-icons/fa";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function AllEdgeRoutersReport({
  selectedFacilities,
  searchQuery,
}) {
  const [filteredEdgeRouters, setFilteredEdgeRouters] = useState([]);
  const [edgeRouters, setEdgeRouters] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);

  const fetchEdgeRouters = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${facility.id}/edgerouterstatus`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const edgeRouters = response.data;
      return edgeRouters;
    } catch (error) {
      console.error(`Error fetching Edge Routers for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have Edge Routers`);
      return null;
    }
  };

  const fetchDataForSelectedFacilities = async () => {
    setEdgeRouters([]); // Clear existing data
    const fetchPromises = selectedFacilities.map(async (facility) => {
      const facilityName = facility.name;
      const edgeRoutersData = await fetchEdgeRouters(facility);

      // Add facilityName to the edgeRoutersData array
      edgeRoutersData.facilityName = facilityName;

      return edgeRoutersData;
    });

    const allEdgeRouterData = await Promise.all(fetchPromises);

    // Flatten the array and update state with all Edge Routers
    const flattenedData = allEdgeRouterData.flat();
    setEdgeRouters(flattenedData);
  };

  // Pagination logic
  const pageCount = Math.ceil(filteredEdgeRouters.length / rowsPerPage);

  useEffect(() => {
    fetchDataForSelectedFacilities();
  }, [selectedFacilities]);

  useEffect(() => {
    setSortedColumn("Facility");
    var sortedEdgeRouters = [...edgeRouters].sort((a, b) => {
      if (a.facilityName.toLowerCase() < b.facilityName.toLowerCase())
        return -1;
      if (a.facilityName.toLowerCase() > b.facilityName.toLowerCase()) return 1;
      return 0;
    });

    const filteredEdgeRouters = sortedEdgeRouters.filter(
      (edgeRouter) =>
        (edgeRouter.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (edgeRouter.facilityName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (edgeRouter.overallStatus || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
    setFilteredEdgeRouters(filteredEdgeRouters);
    setCurrentPage(1);
  }, [edgeRouters, searchQuery]);

  return (
    <div className="w-full px-2">
      <table className="w-full table-auto border-collapse border border-gray-300 dark:border-border">
        <thead className="select-none">
          <tr className="bg-gray-200 dark:bg-darkNavSecondary sticky top-[-1px] z-10">
            <th
              className="border border-gray-300 dark:border-border px-4 py-2  hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Facility");
                setFilteredEdgeRouters(
                  [...filteredEdgeRouters].sort((a, b) => {
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
              className="border border-gray-300 dark:border-border px-4 py-2  hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
              onClick={() => {
                const newDirection = sortDirection === "asc" ? "desc" : "asc";
                setSortDirection(newDirection);
                setSortedColumn("Name");
                setFilteredEdgeRouters(
                  [...filteredEdgeRouters].sort((a, b) => {
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
                setSortedColumn("Connection Status");
                setFilteredEdgeRouters(
                  [...filteredEdgeRouters].sort((a, b) => {
                    if (
                      a.connectionStatus.toLowerCase() <
                      b.connectionStatus.toLowerCase()
                    )
                      return newDirection === "asc" ? -1 : 1;
                    if (
                      a.connectionStatus.toLowerCase() >
                      b.connectionStatus.toLowerCase()
                    )
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Connection Status
              {sortedColumn === "Connection Status" && (
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
                setSortedColumn("Event Status");
                setFilteredEdgeRouters(
                  [...filteredEdgeRouters].sort((a, b) => {
                    if (a.eventStatusMessage < b.eventStatusMessage)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.eventStatusMessage > b.eventStatusMessage)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Event Status
              {sortedColumn === "Event Status" && (
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
                setSortedColumn("Provisioning");
                setFilteredEdgeRouters(
                  [...filteredEdgeRouters].sort((a, b) => {
                    if (
                      a.isLockProvisioningEnabled < b.isLockProvisioningEnabled
                    )
                      return newDirection === "asc" ? -1 : 1;
                    if (
                      a.isLockProvisioningEnabled > b.isLockProvisioningEnabled
                    )
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Provisioning Enabled
              {sortedColumn === "Provisioning" && (
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
                setSortedColumn("Status");
                setFilteredEdgeRouters(
                  [...filteredEdgeRouters].sort((a, b) => {
                    if (a.isDeviceOffline < b.isDeviceOffline)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.isDeviceOffline > b.isDeviceOffline)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Status
              {sortedColumn === "Status" && (
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
                setSortedColumn("Last Communication On");
                setFilteredEdgeRouters(
                  [...filteredEdgeRouters].sort((a, b) => {
                    if (a.lastCommunicationOn < b.lastCommunicationOn)
                      return newDirection === "asc" ? -1 : 1;
                    if (a.lastCommunicationOn > b.lastCommunicationOn)
                      return newDirection === "asc" ? 1 : -1;
                    return 0;
                  })
                );
              }}
            >
              Last Communicated On
              {sortedColumn === "Last Communication On" && (
                <span className="ml-2">
                  {sortDirection === "asc" ? "▲" : "▼"}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredEdgeRouters
            .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
            .map((edgeRouter, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary relative"
                onClick={() => setHoveredRow(index)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {edgeRouter.facilityName}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {edgeRouter.name}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  <div className="inline-flex items-center gap-2">
                    {edgeRouter.connectionStatus === "ok" ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      ""
                    )}
                    <div>{edgeRouter.connectionStatusMessage}</div>
                  </div>
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  <div className="inline-flex items-center gap-2">
                    {edgeRouter.eventStatusMessage === "ok" ? (
                      <FaCheckCircle className="text-green-500" />
                    ) : (
                      ""
                    )}
                    <div>{edgeRouter.eventStatusMessage}</div>
                  </div>
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {edgeRouter.isAccessPointProvisioningEnabled ||
                  edgeRouter.isLockProvisioningEnabled
                    ? "True"
                    : "False"}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {!edgeRouter.isDeviceOffline ? "Online" : "Offline"}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {edgeRouter.lastCommunicationOn}
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
              className="border rounded-sm ml-2 dark:bg-darkSecondary dark:border-border"
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
            {currentPage * rowsPerPage > filteredEdgeRouters.length
              ? filteredEdgeRouters.length
              : currentPage * rowsPerPage}{" "}
            of {filteredEdgeRouters.length}
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
