import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { GoStar, GoStarFill } from "react-icons/go";
import qs from "qs";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import PaginationFooter from "./PaginationFooter";

export default function FavoritesPage({ setOpenPage, setCurrentFacilityName }) {
  const [facilities, setFacilities] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [favoriteTokensLoaded, setFavoriteTokensLoaded] = useState(false);
  const {
    user,
    favoriteTokens,
    setFavoriteTokens,
    currentFacility,
    setCurrentFacility,
  } = useAuth();
  const [noFacilities, setNoFacilities] = useState(false);

  const handleCurrentFacilityUpdate = async (updatedInfo) => {
    const { data, error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        current_facility: updatedInfo,
        last_update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving credentials:", error.message);
    } else {
      setCurrentFacility(updatedInfo);
    }
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
      setNoFacilities(false);
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

  const isFacilityFavorite = (facilityId) => {
    return favoriteTokens.some((facility) => facility.id === facilityId);
  };

  useEffect(() => {
    if (favoriteTokens.length < 1) {
      if (facilities.length < 1) {
        setNoFacilities(true);
      }
      return;
    }
    if (favoriteTokensLoaded) return;
    setFavoriteTokensLoaded(true);
    setNoFacilities(false);
    const sortedFacilities = favoriteTokens.sort((a, b) => {
      if (a.environment < b.environment) return -1;
      if (a.environment > b.environment) return 1;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
    setSortedColumn("Facility Id");
    try {
      setFacilities(sortedFacilities);
    } catch {
      alert("It broke");
    }
  }, [favoriteTokens]);

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

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary mb-14 h-full">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <GoStarFill className="text-lg" />
          &ensp; Favorites
        </div>
      </div>
      <div className="w-full h-full p-5 flex flex-col rounded-lg pb-10">
        <div className=" mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
          />
        </div>
        <table className="w-full table-auto border-collapse pb-96">
          <thead className="sticky top-[-1px] z-10 select-none">
            <tr className="border border-gray-300 dark:border-border bg-gray-200 dark:bg-darkNavSecondary">
              <th className="px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"></th>
              <th
                className="px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
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
                className="px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out min-w-28"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
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
                className="px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
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
                className="px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
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
              <th className="px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFacilities
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((facility, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary border-y border-gray-300 dark:border-border text-center"
                >
                  <td
                    className="px-4 py-2 hover:cursor-pointer"
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
                    className="px-4 py-2 hover:cursor-pointer"
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
                    className="px-4 py-2 hover:cursor-pointer"
                    onClick={() => addToFavorite(facility)}
                  >
                    {facility.id}
                  </td>
                  <td
                    className="px-4 py-2 hover:cursor-pointer"
                    title={
                      facility.environment === "cia-stg-1.aws."
                        ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                        : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      const baseUrl =
                        facility.environment === "cia-stg-1.aws."
                          ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                          : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`;
                      window.open(baseUrl, "_blank");
                    }}
                  >
                    <div className="flex gap-3 items-center text-center justify-center">
                      {facility.name}
                      <FaExternalLinkAlt className="text-blue-300 group-hover:text-blue-500" />
                    </div>
                  </td>
                  <td
                    className="px-4 py-2 hover:cursor-pointer"
                    onClick={() => addToFavorite(facility)}
                  >
                    {facility.propertyNumber}
                  </td>
                  <td className="px-4 py-2 hover:cursor-pointer">
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
        {/* No Facilities Notification Text */}
        {noFacilities && (
          <p className="text-center p-4 font-bold text-lg">
            No facilities currently favorited...
          </p>
        )}
        {/* Pagination Footer */}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredFacilities}
          />
        </div>
      </div>
    </div>
  );
}
