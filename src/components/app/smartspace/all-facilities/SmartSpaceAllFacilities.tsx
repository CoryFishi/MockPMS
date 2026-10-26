import DataTable from "@components/shared/DataTable";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import PaginationFooter from "@components/shared/PaginationFooter";
import toast from "react-hot-toast";
import React, { useMemo, useState } from "react";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@lib/supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import { IoKeypad, IoLockOpen, IoNotificationsCircle } from "react-icons/io5";
import { LuBrainCircuit } from "react-icons/lu";
import { RiAlarmWarningFill } from "react-icons/ri";
import { FaWarehouse } from "react-icons/fa6";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import InputBox from "@components/ui/InputBox";
import { useFacilityStatusLists, filterFacilities } from "@hooks/statuslist";
import { useTableSort } from "@hooks/tableSort";
import { toFacilityRefs } from "@hooks/facilityRefs";
import PageHeader from "@components/shared/PageHeader";

export default function SmartSpaceAllFacilitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const { user, tokens, selectedTokens, setSelectedTokens } = useAuth();
  const { facilities, settledCount, total, allSettled, noFacilities, isLoading } =
    useFacilityStatusLists();
  const searchedFacilities = useMemo(
    () => filterFacilities(facilities, searchQuery),
    [facilities, searchQuery]
  );
  const { sortedRows: filteredFacilities, sortedColumn, sortDirection, onSort } =
    useTableSort(searchedFacilities);

  const handleSelectedFacilitiesUpdate = async (newFacility: any, isSelected: boolean) => {
    const { data: currentData, error: fetchError } = await supabase
      .from("user_data")
      .select("selected_tokens")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching selected tokens:", fetchError.message);
      toast.error("Failed to retrieve selected facilities.");
      return;
    }

    const formattedFacility = {
      id: newFacility.facilityId,
      api: newFacility.api,
      apiSecret: newFacility.apiSecret,
      client: newFacility.client,
      clientSecret: newFacility.clientSecret,
      name: newFacility.facilityName,
      environment: newFacility.environment,
      propertyNumber: newFacility.facilityPropertyNumber,
    };

    let updatedTokens;

    if (isSelected) {
      updatedTokens = (currentData?.selected_tokens || []).filter(
        (token) => token.id !== formattedFacility.id
      );
    } else {
      updatedTokens = [
        ...(currentData?.selected_tokens || []).filter(
          (token) => token.id !== formattedFacility.id
        ),
        formattedFacility,
      ];
    }

    const { error: upsertError } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        selected_tokens: toFacilityRefs(updatedTokens, tokens),
        last_update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("Error saving selected tokens:", upsertError.message);
      toast.error("Failed to update selected facilities.");
    } else {
      setSelectedTokens(updatedTokens);
    }
  };
  const addToSelected = async (facility: any) => {
    const isSelected = isFacilitySelected(facility.facilityId);
    handleSelectedFacilitiesUpdate(facility, isSelected);
  };

  const FacilityStatusIcons = ({ facility }: { facility: any }) => {
    const getStatusIcon = (status: string, Icon: any, message: string) => {
      if (!status) return null;
      const color =
        status === "ok"
          ? "text-green-500"
          : status === "warning"
          ? "text-yellow-500"
          : status === "error"
          ? "text-red-500"
          : "";
      return <Icon className={`${color} inline-block`} title={message || ""} />;
    };

    return (
      <>
        {getStatusIcon(
          facility.gatewayStatus,
          LuBrainCircuit,
          facility.gatewayStatusMessage
        )}
        {getStatusIcon(
          facility.edgeRouterStatus,
          IoLockOpen,
          facility.edgeRouterPlatformDeviceStatusMessage
        )}
        {getStatusIcon(
          facility.deviceStatus,
          IoKeypad,
          facility.deviceStatusMessage
        )}
        {getStatusIcon(
          facility.alarmStatus,
          RiAlarmWarningFill,
          facility.alarmStatusMessage
        )}
        {getStatusIcon(
          facility.pmsInterfaceStatus,
          IoNotificationsCircle,
          facility.pmsInterfaceStatusMessage
        )}
      </>
    );
  };
  const isFacilitySelected = (facilityId: string) => {
    return (selectedTokens || []).some(
      (facility) => facility.id === facilityId
    );
  };

  const environmentLabel = {
    "-dev": "Development",
    "": "Production",
    "-qa": "QA",
    "staging": "Staging",
  };

  const columns = [
    {
      key: "isSelected",
      label: "◯",
      accessor: (f: any) => (isFacilitySelected(f.facilityId) ? 1 : 0),
      render: (f: any) => (
        <div
          className="flex justify-center text-yellow-500 cursor-pointer items-center"
          onClick={(e) => {
            e.stopPropagation();
            addToSelected(f);
          }}
        >
          {isFacilitySelected(f.facilityId) ? (
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
      accessor: (f: any) => f.environment?.toLowerCase() || "",
      render: (f: any) => environmentLabel[f.environment] ?? "N/A",
    },
    {
      key: "facilityId",
      label: "Facility Id",
      accessor: (f: any) => f.facilityId,
    },
    {
      key: "accountName",
      label: "Account Name",
      accessor: (f: any) =>
        f.accountName.length > 24
          ? f.accountName.slice(0, 24) + "..."
          : f.accountName || "",
    },
    {
      key: "facilityName",
      label: "Facility Name",
      accessor: (f: any) => f.facilityName?.toLowerCase() || "",
      render: (f: any) => (
        <div className="flex gap-3 items-center justify-center">
          <p className="pl-1 truncate max-w-[32ch]">
            {f.facilityName.length > 24
              ? f.facilityName.slice(0, 24) + "..."
              : f.facilityName}
          </p>
          <FaExternalLinkAlt
            title={`https://portal.${
              f.environment === "staging"
                ? f.environment
                : "insomniaccia" + f.environment
            }.com/facility/${f.id}/dashboard`}
            className="text-blue-300 hover:text-blue-500 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url =
                f.environment === "staging"
                  ? `https://portal.${f.environment}insomniaccia.com/facility/${f.id}/dashboard`
                  : `https://portal.insomniaccia${f.environment}.com/facility/${f.id}/dashboard`;
              window.open(url, "_blank");
            }}
          />
        </div>
      ),
    },
    {
      key: "facilityPropertyNumber",
      label: "Property Number",
      accessor: (f: any) => f.facilityPropertyNumber || "",
    },
    {
      key: "status",
      label: "Status",
      accessor: () => "",
      render: (f: any) => <FacilityStatusIcons facility={f} />,
      sortable: false,
    },
  ];

  return (
    <div
      className={`relative ${
        isLoading ? "overflow-hidden min-h-full" : "overflow-auto"
      } h-full dark:text-white dark:bg-zinc-900 relative`}
    >
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner loadingText={total ? `${settledCount}/${total} loaded` : ""} />}
      {/* Header */}
      <PageHeader
        icon={FaWarehouse}
        title="All Facilities"
        meta={!allSettled && total ? `Loading ${settledCount}/${total}...` : undefined}
      />
      {/* Body */}
      <div className="w-full px-5 flex flex-col rounded-lg h-full">
        {/* Search Bar */}
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <InputBox
            placeholder="Search facilities..."
            value={searchQuery}
            onchange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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
            onSort={onSort}
          />
          {/* If no facilities display no facilities text */}
          {noFacilities && (
            <div className="w-full text-center mt-5 text-red-500">
              No Authorized Facilities To Choose From...
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
