import PaginationFooter from "@components/shared/PaginationFooter";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import DataTable from "@components/shared/DataTable";
import { IoKeypad, IoLockOpen, IoNotificationsCircle } from "react-icons/io5";
import { LuBrainCircuit } from "react-icons/lu";
import { RiAlarmWarningFill } from "react-icons/ri";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { GoStar, GoStarFill } from "react-icons/go";
import qs from "qs";
import { FaWarehouse } from "react-icons/fa6";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@app/supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import TableButton from "@components/UI/TableButton";
import InputBox from "@components/UI/InputBox";

export default function AllFacilities({ setOpenPage, setCurrentFacilityName }) {
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
  const [noFacilities, setNoFacilities] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLoadingText, setCurrentLoadingText] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

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
    const { error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        current_facility: {
          id: updatedInfo.facilityId,
          api: updatedInfo.api,
          apiSecret: updatedInfo.apiSecret,
          client: updatedInfo.client,
          clientSecret: updatedInfo.clientSecret,
          name: updatedInfo.facilityName,
          environment: updatedInfo.environment,
          propertyNumber: updatedInfo.facilityPropertyNumber,
          token: updatedInfo.token,
        },
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
          favorite_tokens: updatedTokens,
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
          favorite_tokens: updatedTokens,
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

        setCurrentFacilityName(facility.facilityName);
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
    setIsLoading(true);
    setCurrentLoadingText("Loading facilities...");

    // Helper to fetch each facility
    const handleAccount = async (facility) => {
      try {
        const bearer = await handleLogin(facility);
        const tokenStageKey =
          facility.environment === "cia-stg-1.aws." ? "cia-stg-1.aws." : "";
        const tokenEnvKey =
          facility.environment === "cia-stg-1.aws." ? "" : facility.environment;

        const response = await axios.get(
          `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/statuslist`,
          {
            headers: {
              Authorization: "Bearer " + bearer?.access_token,
              accept: "application/json",
              "api-version": "2.0",
            },
          }
        );

        const enriched = response.data.map((item) => ({
          ...item,
          environment: facility.environment,
          api: facility.api,
          apiSecret: facility.apiSecret,
          client: facility.client,
          clientSecret: facility.clientSecret,
        }));

        return enriched;
      } catch (err) {
        console.error(`Error loading facility ${facility.client}`, err);
        return [];
      }
    };

    try {
      const facilityDataChunks = await Promise.all(
        saved.map(async (facility) => {
          setCurrentLoadingText(`Loading ${facility.client || facility.id}...`);
          return await handleAccount(facility);
        })
      );

      const flattened = facilityDataChunks.flat();

      if (flattened.length === 0) {
        setNoFacilities(true);
      } else {
        const sorted = flattened.sort((a, b) => {
          if (a.environment < b.environment) return -1;
          if (a.environment > b.environment) return 1;
          if (a.id < b.id) return -1;
          if (a.id > b.id) return 1;
          return 0;
        });

        setFacilities(sorted);
        setFilteredFacilities(sorted);
      }
    } catch (err) {
      toast.error("Facilities Failed to Load!");
      console.error("Error loading facilities:", err);
    } finally {
      setCurrentLoadingText("");
      setIsLoading(false);
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
  const FacilityStatusIcons = ({ facility }) => {
    const getStatusIcon = (status, Icon, message) => {
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
    setCurrentPage(1);
    const loweredQuery = searchQuery.toLowerCase();

    const searchableFields = [
      "facilityId",
      "facilityPropertyNumber",
      "facilityName",
      "accountName",
      "environment",
      "gatewayStatus",
      "alarmStatus",
      "deviceStatus",
      "edgeRouterPlatformDeviceStatus",
      "pmsInterfaceStatus",
      "gatewayStatusMessage",
      "alarmStatusMessage",
      "deviceStatusMessage",
      "edgeRouterPlatformDeviceStatusMessage",
      "pmsInterfaceStatusMessage",
    ];

    const filtered = facilities.filter((facility) => {
      return (
        searchableFields.some((field) => {
          const value = facility[field];
          return value?.toString().toLowerCase().includes(loweredQuery);
        }) ||
        (facility.edgeRouterPlatformDeviceStatus != null &&
          "smartlock".includes(loweredQuery))
      );
    });

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
      accessor: (r) => (isFacilityFavorite(r.facilityId) ? 1 : 0),
      render: (r) => (
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
      accessor: (r) => r.environment,
      render: (r) => (
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
      accessor: (r) => r.facilityId,
    },
    {
      key: "accountName",
      label: "Account Name",
      accessor: (r) => r.accountName,
      render: (r) => (
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
      accessor: (r) => r.facilityName,
      render: (r) => (
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
                r.environment === "cia-stg-1.aws."
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
      accessor: (r) => r.facilityPropertyNumber,
    },
    {
      sortable: false,
      key: "status",
      label: "Status",
      accessor: () => null,
      render: (r) => <FacilityStatusIcons facility={r} />,
    },
    {
      sortable: false,
      key: "actions",
      label: "Actions",
      accessor: () => null,
      render: (r) =>
        currentFacility.id === r.facilityId &&
        currentFacility.environment === r.environment ? (
          <TableButton
            onclick={() => {
              localStorage.setItem("openPage", "units");
              setOpenPage("units");
            }}
            text={"Selected"}
          />
        ) : (
          <TableButton
            onclick={() => handleSelect(r)}
            className="bg-green-500 hover:bg-green-600"
            text={"Select"}
          />
        ),
    },
  ];

  return (
    <div
      className={`relative ${
        isLoading ? "overflow-hidden min-h-full" : "overflow-auto"
      } h-full dark:text-white dark:bg-darkPrimary relative`}
    >
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner loadingText={currentLoadingText} />}
      {/* Page Header */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaWarehouse className="text-lg" />
          &ensp; All Facilities
        </div>
      </div>
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        {/* Search Bar */}
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <InputBox
            type="text"
            placeholder="Search facilities..."
            onchange={(e) => setSearchQuery(e.target.value)}
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
          onSort={handleSort}
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
