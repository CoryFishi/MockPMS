import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { GoStar, GoStarFill } from "react-icons/go";
import qs from "qs";
import { FaWarehouse } from "react-icons/fa6";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";

export default function AllFacilitiesPage({
  setOpenPage,
  setCurrentFacilityName,
}) {
  const {
    user,
    tokens,
    isPulled,
    favoriteTokens,
    setFavoriteTokens,
    currentFacility,
    setCurrentFacility,
  } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleCurrentFacilityUpdate = async (updatedInfo) => {
    const { data, error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        current_facility: updatedInfo,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving credentials:", error.message);
    } else {
      setCurrentFacility(updatedInfo);
    }
  };

  const handleFavoriteFacilitiesUpdate = async (newFacility, isFavorite) => {
    // Fetch existing favorite tokens for the user
    const { data: currentData, error: fetchError } = await supabase
      .from("user_data")
      .select("favorite_tokens")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching favorite tokens:", fetchError.message);
      toast.error("Failed to retrieve favorite credentials.");
      return;
    }
    if (isFavorite) {
      // Filter out the token to remove
      const updatedTokens = (currentData?.favorite_tokens || []).filter(
        (token) => token.id !== newFacility.id
      );

      // Upsert the updated tokens array back to the database
      const { data, error } = await supabase.from("user_data").upsert(
        {
          user_id: user.id,
          favorite_tokens: updatedTokens,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("Error removing favorite token:", error.message);
      } else {
        setFavoriteTokens(updatedTokens);
      }
    } else {
      // Filter in the token to remove
      const updatedTokens = [
        ...(currentData?.favorite_tokens || []),
        newFacility,
      ];
      const { data, error } = await supabase.from("user_data").upsert(
        {
          user_id: user.id,
          favorite_tokens: updatedTokens,
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("Error saving favorite tokens:", error.message);
      } else {
        setFavoriteTokens(updatedTokens);
      }
    }
  };

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

  const handleSelectLogin = async (facility) => {
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
        const tokenData = response.data;
        const updatedFacility = {
          ...facility,
          token: tokenData,
        };
        handleCurrentFacilityUpdate(updatedFacility);

        setCurrentFacilityName(facility.name);
        return response;
      })
      .catch(function (error) {
        console.error("Error during login:", error);
        throw error;
      });
  };

  const handleFacilities = async (saved) => {
    setFilteredFacilities([]);
    setFacilities([]);
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
    try {
      for (let i = 0; i < saved.length; i++) {
        const facility = saved[i];
        handleAccount(facility);
      }
      toast.success(<b>Facilities Loaded Successfully!</b>);
    } catch (error) {
      toast.error("Facilities Failed to Load!");
    }
  };

  const handleSelect = async (facility) => {
    await handleCurrentFacilityUpdate(facility);
    await toast.promise(handleSelectLogin(facility), {
      loading: "Selecting facility...",
      success: <b>Facility selected!</b>,
      error: <b>Could not select facility.</b>,
    });
    localStorage.setItem("openPage", "units");
    setOpenPage("units");
  };

  const addToFavorite = async (facility) => {
    const isFavorite = isFacilityFavorite(facility.id);
    handleFavoriteFacilitiesUpdate(facility, isFavorite);
  };

  useEffect(() => {
    if (isPulled) {
      handleFacilities(tokens);
    }
  }, [tokens]);

  const isFacilityFavorite = (facilityId) => {
    return (favoriteTokens || []).some(
      (facility) => facility.id === facilityId
    );
  };

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
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary mb-14">
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
            <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary">
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
                  className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out min-w-28"
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
                <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                  Actions
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
                    className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
                  >
                    <td
                      className="border-y border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToFavorite(facility)}
                    >
                      <div className="flex justify-center text-yellow-500">
                        {isFacilityFavorite(facility.id) ? (
                          <GoStarFill />
                        ) : (
                          <GoStar className="text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td
                      className="border-y border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToFavorite(facility)}
                    >
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
                    <td
                      className="border-y border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToFavorite(facility)}
                    >
                      {facility.id}
                    </td>
                    <td
                      className="border-y border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToFavorite(facility)}
                    >
                      {facility.name}
                    </td>
                    <td
                      className="border-y border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToFavorite(facility)}
                    >
                      {facility.propertyNumber}
                    </td>
                    <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                      {currentFacility.id == facility.id &&
                      currentFacility.environment == facility.environment ? (
                        <button
                          className="font-bold bg-gray-200 text-white px-2 py-1 rounded hover:bg-gray-300 select-none"
                          onClick={() =>
                            localStorage.setItem("openPage", "units") &
                            setOpenPage("units")
                          }
                        >
                          Selected
                        </button>
                      ) : (
                        <button
                          className="font-bold bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 select-none"
                          onClick={() => handleSelect(facility)}
                        >
                          Select
                        </button>
                      )}
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
