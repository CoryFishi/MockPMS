import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import qs from "qs";
import { FaWarehouse } from "react-icons/fa6";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import PaginationFooter from "./PaginationFooter";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import { IoKeypad, IoLockOpen, IoNotificationsCircle } from "react-icons/io5";
import { LuBrainCircuit } from "react-icons/lu";
import { RiAlarmWarningFill } from "react-icons/ri";

export default function SmartLockAllFacilitiesPage({}) {
  const [facilities, setFacilities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [noFacilities, setNoFacilities] = useState(false);
  const { user, tokens, selectedTokens, setSelectedTokens } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentLoadingText, setCurrentLoadingText] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleSort = (columnKey, accessor = (a) => a[columnKey]) => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(newDirection);
    setSortedColumn(columnKey);

    const sorted = [...filteredFacilities].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredFacilities(sorted);
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
  const handleFacilities = async (saved) => {
    const handleAccount = async (facility) => {
      setCurrentLoadingText(`Loading ${facility.client}...`);
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
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/statuslist`,
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
          if (response.data.length > 0) setNoFacilities(false);

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
        setCurrentLoadingText(`Loading ${facility.name || facility.id}...`);
        await handleAccount(facility);
      }
      if (saved.length < 1) {
        setNoFacilities(true);
      }
    } catch (error) {
      toast.error("Facilities Failed to Load!");
    } finally {
      setCurrentLoadingText("");
      setIsLoading(false);
    }
  };
  const handleSelectedFacilitiesUpdate = async (newFacility, isSelected) => {
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
        selected_tokens: updatedTokens,
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

  const addToSelected = async (facility) => {
    const isSelected = isFacilitySelected(facility.facilityId);
    handleSelectedFacilitiesUpdate(facility, isSelected);
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
  const isFacilitySelected = (facilityId) => {
    return (selectedTokens || []).some(
      (facility) => facility.id === facilityId
    );
  };

  useEffect(() => {
    if (!tokens) return;
    handleFacilities(tokens);
  }, [tokens]);

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

  return (
    <div
      className={`relative ${
        isLoading ? "overflow-hidden min-h-full" : "overflow-auto"
      } h-full dark:text-white dark:bg-darkPrimary relative`}
    >
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner loadingText={currentLoadingText} />}
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
            className="mb-2 border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
          />
        </div>
        <div>
          <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
            {/* Header */}
            <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary">
              <tr className="bg-gray-200 dark:bg-darkNavSecondary text-center">
                <th
                  className="px-4 py-2 hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-darkPrimary"
                  onClick={() =>
                    handleSort("isSelected", (a) =>
                      isFacilitySelected(a.facilityId) ? 1 : 0
                    )
                  }
                >
                  <RiCheckboxBlankCircleLine className="text-lg text-slate-400" />

                  {sortedColumn === "isSelected" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-2 hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-darkPrimary"
                  onClick={() =>
                    handleSort(
                      "environment",
                      (a) => a.environment?.toLowerCase() || ""
                    )
                  }
                >
                  Environment
                  {sortedColumn === "environment" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-2 hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-darkPrimary min-w-28"
                  onClick={() => handleSort("facilityId", (a) => a.facilityId)}
                >
                  Facility Id
                  {sortedColumn === "facilityId" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-2 hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-darkPrimary"
                  onClick={() =>
                    handleSort(
                      "accountName",
                      (a) => a.accountName?.toLowerCase() || ""
                    )
                  }
                >
                  Account Name
                  {sortedColumn === "accountName" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-2 hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-darkPrimary"
                  onClick={() =>
                    handleSort(
                      "facilityName",
                      (a) => a.facilityName?.toLowerCase() || ""
                    )
                  }
                >
                  Facility Name
                  {sortedColumn === "facilityName" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th
                  className="px-4 py-2 hover:cursor-pointer hover:bg-zinc-300 dark:hover:bg-darkPrimary"
                  onClick={() =>
                    handleSort(
                      "facilityPropertyNumber",
                      (a) => a.facilityPropertyNumber?.toLowerCase() || ""
                    )
                  }
                >
                  Property Number
                  {sortedColumn === "facilityPropertyNumber" && (
                    <span className="ml-2">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
                <th className="px-4 py-2">Status</th>
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
                    className="hover:bg-zinc-100 dark:hover:bg-darkNavSecondary border-y border-zinc-300 dark:border-border text-center relative"
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td
                      className="px-4 py-2 hover:cursor-pointer"
                      onClick={() => addToSelected(facility)}
                    >
                      <div className="flex justify-center text-yellow-500">
                        {isFacilitySelected(facility.facilityId) ? (
                          <RiCheckboxCircleFill className="text-lg" />
                        ) : (
                          <RiCheckboxBlankCircleLine className="text-lg text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-2 hover:cursor-pointer"
                      onClick={() => setHoveredRow(index)}
                    >
                      {environmentLabel[facility.environment] ?? "N/A"}{" "}
                      {hoveredRow === index && (
                        <div className="absolute bg-zinc-50 border dark:border-zinc-700 dark:bg-zinc-800 text-black p-2 rounded-sm shadow-lg z-10 top-10 left-2/4 transform -translate-x-1/2 text-left w-5/6 dark:text-white">
                          <div className="grid grid-cols-4 gap-1 overflow-hidden">
                            {Object.entries(facility).map(
                              ([key, value], index) => (
                                <div key={index} className="break-words">
                                  <span className="font-bold text-yellow-400">
                                    {key}:
                                  </span>
                                  <br />
                                  <span className="whitespace-normal break-words">
                                    {value === null
                                      ? "null"
                                      : value === ""
                                      ? "null"
                                      : value === true
                                      ? "true"
                                      : value === false
                                      ? "false"
                                      : value}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td
                      className="border-y border-gray-300 dark:border-border px-4 py-2"
                      onClick={() => setHoveredRow(index)}
                    >
                      {facility.facilityId}
                    </td>
                    <td
                      className="px-4 py-2 hover:cursor-pointer"
                      onClick={() => setHoveredRow(index)}
                    >
                      {facility.accountName.length > 24
                        ? facility.accountName.slice(0, 24) + "..."
                        : facility.accountName}
                    </td>
                    <td
                      className="px-4 py-2 hover:cursor-pointer"
                      onClick={() => setHoveredRow(index)}
                    >
                      <div className="flex gap-3 items-center">
                        <p className="pl-1 truncate max-w-[32ch]">
                          {facility.facilityName.length > 24
                            ? facility.facilityName.slice(0, 24) + "..."
                            : facility.facilityName}
                        </p>
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
                      onClick={() => setHoveredRow(index)}
                    >
                      {facility.facilityPropertyNumber}
                    </td>
                    <td
                      className="border-zinc-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                      onClick={() => setHoveredRow(index)}
                    >
                      <FacilityStatusIcons facility={facility} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {noFacilities && (
            <div className="w-full text-center mt-5 text-red-500">
              No Authorized Facilities To Choose From...
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
