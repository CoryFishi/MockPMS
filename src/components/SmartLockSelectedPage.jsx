import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import PaginationFooter from "./PaginationFooter";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function SmartLockSelectedPage() {
  const [facilities, setFacilities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedTokensLoaded, setSelectedTokensLoaded] = useState(false);
  const [noFacilities, setNoFacilities] = useState(false);

  const { user, selectedTokens, setSelectedTokens } = useAuth();

  const handleSelectedFacilitiesUpdate = async (newFacility, isSelected) => {
    // Fetch existing favorite tokens for the user
    const { data: currentData, error: fetchError } = await supabase
      .from("user_data")
      .select("selected_tokens")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching favorite tokens:", fetchError.message);
      toast.error("Failed to retrieve favorite credentials.");
      return;
    }
    if (isSelected) {
      // Filter out the token to remove
      setNoFacilities(false);
      const updatedTokens = (currentData?.selected_tokens || []).filter(
        (token) => token.id !== newFacility.id
      );

      // Upsert the updated tokens array back to the database
      const { data, error } = await supabase.from("user_data").upsert(
        {
          user_id: user.id,
          selected_tokens: updatedTokens,
          last_update_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("Error removing favorite token:", error.message);
      } else {
        setSelectedTokens(updatedTokens);
      }
    } else {
      // Filter in the token to remove
      setNoFacilities(false);
      const updatedTokens = [
        ...(currentData?.selected_tokens || []),
        newFacility,
      ];
      const { data, error } = await supabase.from("user_data").upsert(
        {
          user_id: user.id,
          selected_tokens: updatedTokens,
          last_update_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("Error saving favorite tokens:", error.message);
      } else {
        setSelectedTokens(updatedTokens);
      }
    }
  };

  const addToSelected = async (facility) => {
    const isSelected = isFacilitySelected(facility.id);
    handleSelectedFacilitiesUpdate(facility, isSelected);
  };

  const isFacilitySelected = (facilityId) => {
    return selectedTokens.some((facility) => facility.id === facilityId);
  };

  useEffect(() => {
    if (selectedTokens.length < 1) {
      if (facilities.length < 1) {
        setNoFacilities(true);
      }
      return;
    }
    if (selectedTokensLoaded) return;
    setSelectedTokensLoaded(true);
    setNoFacilities(false);
    const sortedFacilities = selectedTokens.sort((a, b) => {
      if (a.environment < b.environment) return -1;
      if (a.environment > b.environment) return 1;
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });
    setSortedColumn("Facility Id");
    try {
      setFacilities(sortedFacilities);
      toast.success(<b>Selected facilites loaded successfully!</b>);
    } catch {
      alert("It broke");
    }
  }, [selectedTokens]);

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
          <RiCheckboxCircleFill className="text-lg" />
          &ensp; Selected Facilities
        </div>
      </div>
      <div className="w-full px-5 flex flex-col rounded-lg h-full">
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
          />
        </div>
        <div>
          <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
            {/* Header */}
            <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary">
              <tr className="bg-gray-200 dark:bg-darkNavSecondary text-center">
                <th className="px-4 py-2 text-left hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"></th>
                <th
                  className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
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
                  className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
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
                  className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
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
                  className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
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
                    className="border-y border-gray-300 dark:border-border hover:bg-gray-100 dark:hover:bg-darkNavSecondary hover:cursor-pointer"
                  >
                    <td
                      className="px-4 py-2"
                      onClick={() => addToSelected(facility)}
                    >
                      <div className="flex justify-center text-yellow-500">
                        {isFacilitySelected(facility.id) ? (
                          <RiCheckboxCircleFill className="text-lg" />
                        ) : (
                          <RiCheckboxBlankCircleLine className="text-lg text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToSelected(facility)}
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
                      className="border-y border-gray-300 dark:border-border px-4 py-2"
                      onClick={() => addToSelected(facility)}
                    >
                      {facility.id}
                    </td>
                    <td
                      className="px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToSelected(facility)}
                    >
                      <div className="flex gap-3 items-center">
                        {facility.name}
                        <FaExternalLinkAlt
                          title={
                            facility.environment === "cia-stg-1.aws."
                              ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                              : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`
                          }
                          className="text-blue-300 group-hover:text-blue-500"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const baseUrl =
                              facility.environment === "cia-stg-1.aws."
                                ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                                : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`;
                            window.open(baseUrl, "_blank");
                          }}
                        />
                      </div>
                    </td>
                    <td
                      className="px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToSelected(facility)}
                    >
                      {facility.propertyNumber}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {noFacilities && (
            <div className="w-full text-center mt-5 text-red-500">
              No Facilities Currently Selected...
            </div>
          )}
        </div>
        {/* Modal footer/pagination */}
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
