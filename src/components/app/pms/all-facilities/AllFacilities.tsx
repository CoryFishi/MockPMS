import PaginationFooter from "@components/shared/PaginationFooter";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import DataTable from "@components/shared/DataTable";
import { IoKeypad, IoLockOpen, IoNotificationsCircle } from "react-icons/io5";
import { LuBrainCircuit } from "react-icons/lu";
import { RiAlarmWarningFill } from "react-icons/ri";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import { GoStar, GoStarFill } from "react-icons/go";
import { FaWarehouse } from "react-icons/fa6";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@lib/supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import TableButton from "@components/ui/TableButton";
import InputBox from "@components/ui/InputBox";
import { useFacilityStatusLists, filterFacilities } from "@hooks/statuslist";
import { useTableSort } from "@hooks/tableSort";
import { useNavigate } from "react-router-dom";
import { toFacilityRef, toFacilityRefs } from "@hooks/facilityRefs";
import PageHeader from "@components/shared/PageHeader";

export default function AllFacilities({ setCurrentFacilityName }) {
  const {
    user,
    tokens,
    favoriteTokens,
    setFavoriteTokens,
    currentFacility,
    setCurrentFacility,
    ensureBearerToken,
  } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [hoveredRow, setHoveredRow] = useState(null);

  const { facilities, settledCount, total, allSettled, noFacilities, isLoading } =
    useFacilityStatusLists();
  const searchedFacilities = useMemo(
    () => filterFacilities(facilities, searchQuery),
    [facilities, searchQuery]
  );
  const { sortedRows: filteredFacilities, sortedColumn, sortDirection, onSort } =
    useTableSort(searchedFacilities);

  const handleCurrentFacilityUpdate = async (updatedInfo) => {
    const { error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        current_facility: toFacilityRef({
          id: updatedInfo.facilityId,
          api: updatedInfo.api,
          apiSecret: updatedInfo.apiSecret,
          client: updatedInfo.client,
          clientSecret: updatedInfo.clientSecret,
          name: updatedInfo.facilityName,
          environment: updatedInfo.environment,
          propertyNumber: updatedInfo.facilityPropertyNumber,
        }, tokens),
        last_update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving credentials:", error.message);
    } else {
      setCurrentFacility({
        id: updatedInfo.facilityId,
        api: updatedInfo.api,
        apiSecret: updatedInfo.apiSecret,
        client: updatedInfo.client,
        clientSecret: updatedInfo.clientSecret,
        name: updatedInfo.facilityName,
        environment: updatedInfo.environment,
        propertyNumber: updatedInfo.facilityPropertyNumber,
        token: updatedInfo.token,
      });
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
      const { error } = await supabase.from("user_data").upsert(
        {
          user_id: user.id,
          favorite_tokens: toFacilityRefs(updatedTokens, tokens),
          last_update_at: new Date().toISOString(),
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
      const { error } = await supabase.from("user_data").upsert(
        {
          user_id: user.id,
          favorite_tokens: toFacilityRefs(updatedTokens, tokens),
          last_update_at: new Date().toISOString(),
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
  const handleSelectLogin = async (facility) => {
    const bearer = await ensureBearerToken(facility);
    if (!bearer) throw new Error("Authentication failed");
    const updatedFacility = {
      ...facility,
      token: { access_token: bearer },
    };
    handleCurrentFacilityUpdate(updatedFacility);
    setCurrentFacilityName(facility.facilityName);
    return { data: updatedFacility };
  };

  const handleSelect = async (facility: any) => {
    await handleCurrentFacilityUpdate(facility);
    await toast.promise(handleSelectLogin(facility), {
      loading: "Selecting facility...",
      success: <b>Facility selected!</b>,
      error: <b>Could not select facility.</b>,
    });
    navigate("/pms/units");
  };
  const addToFavorite = async (facility: any) => {
    const isFavorite = isFacilityFavorite(facility.facilityId);
    handleFavoriteFacilitiesUpdate(
      {
        id: facility.facilityId,
        api: facility.api,
        apiSecret: facility.apiSecret,
        client: facility.client,
        clientSecret: facility.clientSecret,
        name: facility.facilityName,
        environment: facility.environment,
        propertyNumber: facility.facilityPropertyNumber,
      },
      isFavorite
    );
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

  const isFacilityFavorite = (facilityId: number) => {
    return (favoriteTokens || []).some(
      (facility: any) => facility.id === facilityId
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
      key: "isFavorite",
      label: "★",
      accessor: (r: any) => (isFacilityFavorite(r.facilityId) ? 1 : 0),
      render: (r: any) => (
        <div
          className="flex justify-center text-yellow-500 cursor-pointer"
          onClick={() => addToFavorite(r)}
        >
          {isFacilityFavorite(r.facilityId) ? (
            <GoStarFill />
          ) : (
            <GoStar className="text-zinc-400" />
          )}
        </div>
      ),
    },
    {
      key: "environment",
      label: "Environment",
      accessor: (r: any) => r.environment,
      render: (r: any) => (
        <span
          onMouseEnter={() => setHoveredRow(r.facilityId)}
          className="cursor-pointer"
        >
          {environmentLabel[r.environment] ?? "N/A"}
        </span>
      ),
    },
    {
      key: "facilityId",
      label: "Facility Id",
      accessor: (r: any) => r.facilityId,
    },
    {
      key: "accountName",
      label: "Account Name",
      accessor: (r: any) => r.accountName,
      render: (r: any) => (
        <span>
          {r.accountName.length > 24
            ? r.accountName.slice(0, 24) + "..."
            : r.accountName}
        </span>
      ),
    },
    {
      key: "facilityName",
      label: "Facility Name",
      accessor: (r: any) => r.facilityName,
      render: (r: any) => (
        <div className="flex gap-2 justify-center">
          <span>
            {r.facilityName.length > 24
              ? r.facilityName.slice(0, 24) + "..."
              : r.facilityName}
          </span>
          <FaExternalLinkAlt
            className="text-blue-300 hover:text-blue-500 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const url =
                r.environment === "staging"
                  ? `https://portal.${r.environment}insomniaccia.com/facility/${r.facilityId}/dashboard`
                  : `https://portal.insomniaccia${r.environment}.com/facility/${r.facilityId}/dashboard`;
              window.open(url, "_blank");
            }}
          />
        </div>
      ),
    },
    {
      key: "facilityPropertyNumber",
      label: "Property Number",
      accessor: (r: any) => r.facilityPropertyNumber,
    },
    {
      sortable: false,
      key: "status",
      label: "Status",
      accessor: () => null,
      render: (r: any) => <FacilityStatusIcons facility={r} />,
    },
    {
      sortable: false,
      key: "actions",
      label: "Actions",
      accessor: () => null,
      render: (r: any) =>
        currentFacility.id === r.facilityId &&
        currentFacility.environment === r.environment ? (
          <TableButton
            onclick={() => navigate("/pms/units")}
            text={"Selected"}
          />
        ) : (
          <TableButton
            onclick={() => handleSelect(r)}
            className="bg-yellow-500 hover:bg-yellow-600"
            text={"Select"}
          />
        ),
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
      {/* Page Header */}
      <PageHeader
        icon={FaWarehouse}
        title="All Facilities"
        meta={!allSettled && total ? `Loading ${settledCount}/${total}...` : undefined}
      />
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        {/* Search Bar */}
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <InputBox
            type="text"
            placeholder="Search facilities..."
            onchange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            value={searchQuery}
          />
        </div>
        {/* Facilities Table */}
        <DataTable
          columns={columns}
          data={filteredFacilities}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={onSort}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
        />

        {/* No Facilities Notification Text */}
        {noFacilities && (
          <p className="text-center p-4 font-bold text-lg">
            No authorized facilities to choose from...
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
