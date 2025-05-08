import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { GoStar, GoStarFill } from "react-icons/go";
import qs from "qs";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@app/supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function Favorites({ setOpenPage, setCurrentFacilityName }) {
  const [facilities, setFacilities] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [hasFavoriteTokensLoaded, setHasFavoriteTokensLoaded] = useState(false);
  const {
    user,
    favoriteTokens,
    setFavoriteTokens,
    currentFacility,
    setCurrentFacility,
  } = useAuth();
  const [noFacilities, setNoFacilities] = useState(false);

  const handleSort = (columnKey, accessor = (a) => a[columnKey]) => {
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
      setFilteredFacilities([...facilities]);
      return;
    }

    const sorted = [...filteredFacilities].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredFacilities(sorted);
  };
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
    try {
      if (favoriteTokens.length < 1) {
        if (facilities.length < 1) {
          setNoFacilities(true);
        }
        return;
      }
      if (hasFavoriteTokensLoaded) return;
      setHasFavoriteTokensLoaded(true);
      setNoFacilities(false);
      setFacilities(favoriteTokens);
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

  const environmentLabel = {
    "-dev": "Development",
    "": "Production",
    "-qa": "QA",
    "cia-stg-1.aws.": "Staging",
  };

  const columns = [
    {
      key: "isFavorite",
      label: "★",
      accessor: (r) => (isFacilityFavorite(r.id) ? 1 : 0),
      render: (r) => (
        <div
          className="flex justify-center text-yellow-500 cursor-pointer"
          onClick={() => addToFavorite(r)}
        >
          {isFacilityFavorite(r.id) ? (
            <GoStarFill />
          ) : (
            <GoStar className="text-slate-400" />
          )}
        </div>
      ),
    },
    {
      key: "environment",
      label: "Environment",
      accessor: (r) => r.environment,
      render: (r) => environmentLabel[r.environment] ?? "N/A",
    },
    {
      key: "id",
      label: "Facility Id",
      accessor: (r) => r.id,
    },
    {
      key: "name",
      label: "Facility Name",
      accessor: (r) => r.name,
      render: (r) => (
        <div className="flex gap-3 items-center justify-center">
          {r.name}
          <FaExternalLinkAlt
            className="text-blue-300 hover:text-blue-500 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const baseUrl =
                r.environment === "cia-stg-1.aws."
                  ? `https://portal.${r.environment}insomniaccia.com/facility/${r.id}/dashboard`
                  : `https://portal.insomniaccia${r.environment}.com/facility/${r.id}/dashboard`;
              window.open(baseUrl, "_blank");
            }}
          />
        </div>
      ),
    },
    {
      key: "propertyNumber",
      label: "Property Number",
      accessor: (r) => r.propertyNumber,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (r) =>
        currentFacility.id === r.id &&
        currentFacility.environment === r.environment ? (
          <button
            className="font-bold bg-gray-200 text-white px-2 py-1 rounded-sm cursor-pointer"
            onClick={() => {
              localStorage.setItem("openPage", "units");
              setOpenPage("units");
            }}
          >
            Selected
          </button>
        ) : (
          <button
            className="font-bold bg-green-500 text-white px-2 py-1 rounded-sm hover:bg-green-600 cursor-pointer"
            onClick={() => handleSelect(r)}
          >
            Select
          </button>
        ),
    },
  ];

  return (
    <div className="relative overflow-auto h-full dark:text-white dark:bg-darkPrimary">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <GoStarFill className="text-lg" />
          &ensp; Favorites
        </div>
      </div>
      <div className="w-full h-fit p-5 flex flex-col rounded-lg pb-10">
        <div className=" mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredFacilities}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleSort}
        />

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
