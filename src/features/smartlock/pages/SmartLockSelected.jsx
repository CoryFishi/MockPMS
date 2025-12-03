import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@app/supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import InputBox from "@components/UI/InputBox";

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
      const { error } = await supabase.from("user_data").upsert(
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
      const { error } = await supabase.from("user_data").upsert(
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
    try {
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
      setFacilities(sortedFacilities);
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
  const columns = [
    {
      key: "isSelected",
      label: "◯",
      accessor: (f) => (isFacilitySelected(f.id) ? 1 : 0),
      render: (f) => (
        <div
          className="flex justify-center text-yellow-500 cursor-pointer items-center"
          onClick={(e) => {
            e.stopPropagation();
            addToSelected(f);
          }}
        >
          {isFacilitySelected(f.id) ? (
            <RiCheckboxCircleFill className="text-lg" />
          ) : (
            <RiCheckboxBlankCircleLine className="text-lg text-slate-400" />
          )}
        </div>
      ),
    },
    {
      key: "environment",
      label: "Environment",
      accessor: (f) => f.environment?.toLowerCase() || "",
      render: (f) => environmentLabel[f.environment] ?? "N/A",
    },
    {
      key: "id",
      label: "Facility Id",
      accessor: (f) => f.id,
    },
    {
      key: "name",
      label: "Facility Name",
      accessor: (f) => f.name?.toLowerCase() || "",
      render: (f) => (
        <div className="flex gap-3 items-center justify-center">
          <p className="pl-1 truncate max-w-[32ch]">
            {f.name.length > 24 ? f.name.slice(0, 24) + "..." : f.name}
          </p>
          <FaExternalLinkAlt
            title={`https://portal.${
              f.environment === "cia-stg-1.aws."
                ? f.environment
                : "insomniaccia" + f.environment
            }.com/facility/${f.id}/dashboard`}
            className="text-blue-300 hover:text-blue-500 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url =
                f.environment === "cia-stg-1.aws."
                  ? `https://portal.${f.environment}insomniaccia.com/facility/${f.id}/dashboard`
                  : `https://portal.insomniaccia${f.environment}.com/facility/${f.id}/dashboard`;
              window.open(url, "_blank");
            }}
          />
        </div>
      ),
    },
    {
      key: "propertyNumber",
      label: "Property Number",
      accessor: (f) => f.propertyNumber || "",
    },
  ];
  const environmentLabel = {
    "-dev": "Development",
    "": "Production",
    "-qa": "QA",
    "cia-stg-1.aws.": "Staging",
  };
  return (
    <div className="relative overflow-auto h-full dark:text-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-zinc-700 dark:bg-zinc-950">
        <div className="ml-5 flex items-center text-sm">
          <RiCheckboxCircleFill className="text-lg" />
          &ensp; Selected Facilities
        </div>
      </div>
      {/* Body */}
      <div className="w-full px-5 flex flex-col rounded-lg h-full">
        {/* Seach Bar */}
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <InputBox
            placeholder="Search facilities..."
            value={searchQuery}
            onchange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md"
          />
        </div>
        {/* Table */}
        <div>
          <DataTable
            columns={columns}
            data={filteredFacilities}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            sortDirection={sortDirection}
            sortedColumn={sortedColumn}
            onSort={handleColumnSort}
          />
          {/* If no facilities display no facilities text */}
          {noFacilities && (
            <div className="w-full text-center mt-5 text-red-500">
              No Facilities Currently Selected...
            </div>
          )}
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
    </div>
  );
}
