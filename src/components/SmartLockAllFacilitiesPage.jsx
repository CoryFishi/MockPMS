import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import qs from "qs";
import { FaWarehouse } from "react-icons/fa6";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function SmartLockAllFacilitiesPage({
  savedFacilities,
  selectedFacilities,
  setSelectedFacilities,
}) {
  const [facilities, setFacilities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFacilities, setFilteredFacilities] =
    useState(selectedFacilities);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleLogin = async (facility) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (facility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = facility.environment;
    }

    const data = qs.stringify({
      grant_type: "password",
      username: facility.api,
      password: facility.apiSecret,
      client_id: facility.client,
      client_secret: facility.clientSecret,
    });

    const config = {
      method: "post",
      url: `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    return axios(config)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.error("Error during login:", error);
        throw error;
      });
  };

  const handleFacilities = async (saved) => {
    const handleAccount = async (facility) => {
      const bearer = await handleLogin(facility);
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }
      const config = {
        method: "get",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities`,
        headers: {
          Authorization: "Bearer " + bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
        },
      };

      return axios(config)
        .then(function (response) {
          const newFacilities = response.data.map((item) => ({
            ...item,
            environment: facility.environment,
            api: facility.api,
            apiSecret: facility.apiSecret,
            client: facility.client,
            clientSecret: facility.clientSecret,
          }));

          setFacilities((prevFacilities) => {
            const combinedFacilities = [...prevFacilities, ...newFacilities];

            return combinedFacilities.sort((a, b) => {
              if (a.environment < b.environment) return -1;
              if (a.environment > b.environment) return 1;
              if (a.id < b.id) return -1;
              if (a.id > b.id) return 1;
              return 0;
            });
          });
          setSortedColumn("Facility Id");

          return response;
        })
        .catch(function (error) {
          console.error("Error during facility fetching:", error);
          throw error;
        });
    };
    for (let i = 0; i < saved.length; i++) {
      const facility = saved[i];
      // Run the toast notification for each facility
      toast.promise(handleAccount(facility), {
        loading: "Loading facilities...",
        success: <b>Facilities loaded successfully!</b>,
        error: <b>Could not load facilities.</b>,
      });
    }
  };

  const addToSelected = async (facility) => {
    const isSelected = isFacilitySelected(facility.id);
    if (isSelected) {
      setSelectedFacilities((prevSelectedFacilities) => {
        const updatedSelected = prevSelectedFacilities.filter(
          (favFacility) => favFacility.id !== facility.id
        );

        localStorage.setItem(
          "selectedFacilities",
          JSON.stringify(updatedSelected)
        );
        return updatedSelected;
      });
    } else {
      setSelectedFacilities((prevSelectedFacilities) => {
        const updatedSelected = [...prevSelectedFacilities, facility];
        localStorage.setItem(
          "selectedFacilities",
          JSON.stringify(updatedSelected)
        );
        return updatedSelected;
      });
    }
  };

  const isFacilitySelected = (facilityId) => {
    return selectedFacilities.some((facility) => facility.id === facilityId);
  };

  useEffect(() => {
    handleFacilities(savedFacilities);
  }, []);

  useEffect(() => {
    const filtered = facilities.filter(
      (facility) =>
        (facility.id || "").toString().includes(searchQuery) ||
        (facility.propertyNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (facility.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (facility.environment || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
    setFilteredFacilities(filtered);
  }, [facilities, searchQuery]);

  // Pagination logic
  const pageCount = Math.ceil(filteredFacilities.length / rowsPerPage);

  return (
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary mb-14">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaWarehouse className="text-lg" />
          &ensp; All Facilities
        </div>
      </div>
      <div className="w-full px-5 flex flex-col rounded-lg h-full">
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
          />
        </div>

        <div>
          <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
            <thead className="sticky top-[-1px] z-10 select-none">
              <tr className="bg-gray-200 dark:bg-darkNavSecondary">
                <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"></th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                  onClick={() => {
                    const newDirection =
                      sortDirection === "asc" ? "desc" : "asc";
                    setSortDirection(newDirection);
                    setSortedColumn("Environment");
                    setFilteredFacilities(
                      [...filteredFacilities].sort((a, b) => {
                        if (a.environment < b.environment)
                          return newDirection === "asc" ? -1 : 1;
                        if (a.environment > b.environment)
                          return newDirection === "asc" ? 1 : -1;
                        return 0;
                      })
                    );
                  }}
                >
                  Environment
                  {sortedColumn === "Environment" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                  onClick={() => {
                    const newDirection =
                      sortDirection === "asc" ? "desc" : "asc";
                    setSortDirection(newDirection);
                    setSortedColumn("Facility Id");
                    setFilteredFacilities(
                      [...filteredFacilities].sort((a, b) => {
                        if (a.id < b.id) return newDirection === "asc" ? -1 : 1;
                        if (a.id > b.id) return newDirection === "asc" ? 1 : -1;
                        return 0;
                      })
                    );
                  }}
                >
                  Facility Id
                  {sortedColumn === "Facility Id" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                  onClick={() => {
                    const newDirection =
                      sortDirection === "asc" ? "desc" : "asc";
                    setSortDirection(newDirection);
                    setSortedColumn("Facility Name");
                    setFilteredFacilities(
                      [...filteredFacilities].sort((a, b) => {
                        if (a.name.toLowerCase() < b.name.toLowerCase())
                          return newDirection === "asc" ? -1 : 1;
                        if (a.name.toLowerCase() > b.name.toLowerCase())
                          return newDirection === "asc" ? 1 : -1;
                        return 0;
                      })
                    );
                  }}
                >
                  Facility Name
                  {sortedColumn === "Facility Name" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                  onClick={() =>
                    setFilteredFacilities(
                      [...filteredFacilities].sort((a, b) => {
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
                        setSortDirection(newDirection);
                        setSortedColumn("Property Number");
                        const propertyNumberA = a.propertyNumber
                          ? a.propertyNumber.toLowerCase()
                          : "";
                        const propertyNumberB = b.propertyNumber
                          ? b.propertyNumber.toLowerCase()
                          : "";

                        if (propertyNumberA < propertyNumberB)
                          return newDirection === "asc" ? -1 : 1;
                        if (propertyNumberA > propertyNumberB)
                          return newDirection === "asc" ? 1 : -1;
                        return 0;
                      })
                    )
                  }
                >
                  Property Number
                  {sortedColumn === "Property Number" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFacilities
                .slice(
                  (currentPage - 1) * rowsPerPage,
                  currentPage * rowsPerPage
                )
                .map((facility, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary hover:cursor-pointer"
                    onClick={() => addToSelected(facility)}
                  >
                    <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                      <div className="flex justify-center text-yellow-500">
                        {isFacilitySelected(facility.id) ? (
                          <RiCheckboxCircleFill className="text-lg" />
                        ) : (
                          <RiCheckboxBlankCircleLine className="text-lg text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                      {facility.environment == "-dev"
                        ? "Development"
                        : facility.environment == ""
                        ? "Production"
                        : facility.environment == "-qa"
                        ? "QA"
                        : facility.environment == "cia-stg-1.aws."
                        ? "Staging"
                        : "N?A"}
                    </td>
                    <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                      {facility.id}
                    </td>
                    <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                      {facility.name}
                    </td>
                    <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                      {facility.propertyNumber}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Modal footer/pagination */}
        <div className="flex justify-between items-center px-2 py-5 mx-1">
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
              {currentPage * rowsPerPage > filteredFacilities.length
                ? filteredFacilities.length
                : currentPage * rowsPerPage}{" "}
              of {filteredFacilities.length}
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
    </div>
  );
}
