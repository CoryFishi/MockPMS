import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import SmartLockFacilityCard from "../components/SmartLockFacilityCard";
import SmartLockFacilityRow from "../components/SmartLockFacilityRow";
import SmartLockExport from "../components/SmartLockExport";
import { useAuth } from "../../../context/AuthProvider";
import LoadingSpinner from "../../../components/shared/LoadingSpinner";

export default function SmartLockDashboardView({}) {
  const [facilitiesWithBearers, setFacilitiesWithBearers] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [listView, setListView] = useState(
    JSON.parse(localStorage.getItem("smartlockListView")) || false
  );
  const [facilitiesInfo, setFacilitiesInfo] = useState([]);
  const [edgeRouterOfflineCount, setEdgeRouterOfflineCount] = useState([]);
  const [edgeRouterOnlineCount, setEdgeRouterOnlineCount] = useState([]);
  const [edgeRouterWarningCount, setEdgeRouterWarningCount] = useState([]);
  const [accessPointsOnlineCount, setAccessPointsOnlineCount] = useState([]);
  const [accessPointsOfflineCount, setAccessPointsOfflineCount] = useState([]);
  const [smartlockOkayCount, setSmartlockOkayCount] = useState([]);
  const [smartlockWarningCount, setSmartlockWarningCount] = useState([]);
  const [smartlockErrorCount, setSmartlockErrorCount] = useState([]);
  const [smartlockOfflineCount, setSmartlockOfflineCount] = useState([]);
  const [smartlockLowestSignal, setSmartlockLowestSignal] = useState([]);
  const [smartlockLowestBattery, setSmartlockLowestBattery] = useState([]);
  const [totalSmartlocks, setTotalSmartlocks] = useState(0);
  const [totalAccessPoints, setTotalAccessPoints] = useState(0);
  const [totalEdgeRouters, setTotalEdgeRouters] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedTokens, user } = useAuth();
  const [expandedRows, setExpandedRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLoadingText, setCurrentLoadingText] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (key) => {
    let nextDirection = "asc";

    if (sortKey === key) {
      if (sortDirection === "asc") nextDirection = "desc";
      else if (sortDirection === "desc") nextDirection = null;
    }

    setSortKey(nextDirection ? key : null);
    setSortDirection(nextDirection);

    if (!nextDirection) {
      setFilteredFacilities(facilitiesWithBearers);
      return;
    }

    const sorted = [...filteredFacilities].sort((a, b) => {
      const aVal = a[key] ?? 0;
      const bVal = b[key] ?? 0;

      if (typeof aVal === "string") {
        return nextDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return nextDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    setFilteredFacilities(sorted);
  };

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      search(searchQuery);
    } else {
      setFilteredFacilities(facilitiesWithBearers);
    }
  }, [facilitiesWithBearers]);

  // Search via search bar and button
  const search = (query) => {
    const trimmed = query.trim().toLowerCase();
    const results = facilitiesWithBearers.filter((facility) => {
      const searchableFields = [
        facility.id?.toString(),
        facility.name,
        facility.propertyNumber,
        facility.environment,
        facility.facilityDetail?.addressLine1,
        facility.facilityDetail?.city,
        facility.facilityDetail?.postalCode,
      ];

      return searchableFields.some((field) =>
        field?.toString().toLowerCase().includes(trimmed)
      );
    });
    setFilteredFacilities(results);
  };

  // Function to get a bearer token for each facility
  const fetchBearerToken = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }
      const data = {
        grant_type: "password",
        username: facility.api,
        password: facility.apiSecret,
        client_id: facility.client,
        client_secret: facility.clientSecret,
      };

      const response = await axios.post(
        `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
        data,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error(`Error fetching token for ${facility.name}:`, error);
      toast.error(`Failed to fetch token for ${facility.name}`);
      return null;
    }
  };

  // Toggle view - list or card
  const toggleListView = () => {
    setListView(!listView);
    localStorage.setItem("smartlockListView", !listView);
  };

  // Add totals together from each facility
  useEffect(() => {
    const updateAggregatedCounts = (facilitiesInfo) => {
      const facilitiesWithSmartLocks = facilitiesInfo.filter(
        (f) => Array.isArray(f.smartLocks) && f.smartLocks.length > 0
      );

      const totals = {
        totalAccessPoints: 0,
        totalEdgeRouters: 0,
        totalSmartlocks: 0,
        edgeRouterOfflineCount: 0,
        edgeRouterOnlineCount: 0,
        edgeRouterWarningCount: 0,
        accessPointsOnlineCount: 0,
        accessPointsOfflineCount: 0,
        smartlockOkayCount: 0,
        smartlockWarningCount: 0,
        smartlockErrorCount: 0,
        smartlockOfflineCount: 0,
        smartlockLowestSignal: "100",
        smartlockLowestBattery: "100",
        smartlockLowestSignalFacility: "N/A",
        smartlockLowestBatteryFacility: "N/A",
      };

      // Count all edge routers and access points (all facilities)
      for (const facility of facilitiesInfo) {
        totals.totalEdgeRouters += facility.edgeRouterStatus ? 1 : 1;
        totals.edgeRouterOfflineCount +=
          facility.edgeRouterStatus === "error" ? 1 : 0;
        totals.edgeRouterOnlineCount +=
          facility.edgeRouterStatus === "ok" ? 1 : 0;
        totals.edgeRouterWarningCount +=
          facility.edgeRouterStatus === "warning" ? 1 : 0;

        totals.accessPointsOnlineCount += facility.onlineAccessPointsCount;
        totals.accessPointsOfflineCount += facility.offlineAccessPointsCount;
        totals.totalAccessPoints +=
          facility.onlineAccessPointsCount + facility.offlineAccessPointsCount;
      }

      // Count only smartlock stats from facilities with smartlocks
      for (const facility of facilitiesWithSmartLocks) {
        totals.totalSmartlocks +=
          facility.okCount +
          facility.warningCount +
          facility.errorCount +
          facility.offlineCount;

        totals.smartlockOkayCount += facility.okCount || 0;
        totals.smartlockWarningCount += facility.warningCount || 0;
        totals.smartlockErrorCount += facility.errorCount || 0;
        totals.smartlockOfflineCount += facility.offlineCount || 0;

        const signal = parseInt(facility.lowestSignal);
        const battery = parseInt(facility.lowestBattery);
        if (signal < parseInt(totals.smartlockLowestSignal)) {
          totals.smartlockLowestSignal = signal;
          totals.smartlockLowestSignalFacility = facility.name;
        }
        if (battery < parseInt(totals.smartlockLowestBattery)) {
          totals.smartlockLowestBattery = battery;
          totals.smartlockLowestBatteryFacility = facility.name;
        }
      }

      setTotalAccessPoints(totals.totalAccessPoints);
      setTotalEdgeRouters(totals.totalEdgeRouters);
      setTotalSmartlocks(totals.totalSmartlocks);
      setEdgeRouterOfflineCount(totals.edgeRouterOfflineCount);
      setEdgeRouterWarningCount(totals.edgeRouterWarningCount);
      setEdgeRouterOnlineCount(totals.edgeRouterOnlineCount);
      setAccessPointsOnlineCount(totals.accessPointsOnlineCount);
      setAccessPointsOfflineCount(totals.accessPointsOfflineCount);
      setSmartlockOkayCount(totals.smartlockOkayCount);
      setSmartlockWarningCount(totals.smartlockWarningCount);
      setSmartlockErrorCount(totals.smartlockErrorCount);
      setSmartlockOfflineCount(totals.smartlockOfflineCount);
      setSmartlockLowestSignal({
        lowestSignal: totals.smartlockLowestSignal,
        facility: totals.smartlockLowestSignalFacility,
      });
      setSmartlockLowestBattery({
        lowestBattery: totals.smartlockLowestBattery,
        facility: totals.smartlockLowestBatteryFacility,
      });
    };

    updateAggregatedCounts(facilitiesInfo);
  }, [facilitiesInfo]);

  // Get bearer tokens prior to creating rows/cards
  useEffect(() => {
    const fetchFacilitiesWithBearers = async () => {
      try {
        let currentIndex = 0;

        const fetchFacilityWithBearerAndStats = async (facility) => {
          setCurrentLoadingText(
            `Loading ${facility.client} (${currentIndex + 1} of ${
              selectedTokens.length
            })...`
          );
          const bearer = await fetchBearerToken(facility);
          if (!bearer) return null;

          const facilityWithBearer = { ...facility, bearer };
          const stats = await fetchFacilityData(facilityWithBearer);
          return stats;
        };

        const results = await Promise.all(
          selectedTokens.map(async (facility, index) => {
            currentIndex = index;
            return await fetchFacilityWithBearerAndStats(facility);
          })
        );

        // Filter out any failed/null results
        const validResults = results.filter(Boolean);
        setFacilitiesWithBearers(validResults);
        setFilteredFacilities(validResults);
        setFacilitiesInfo(validResults);
      } catch (err) {
        console.error("Failed to fetch facilities:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchFacilitiesWithBearers();
  }, [selectedTokens]);

  const fetchFacilityData = async (facility) => {
    const { id, environment, bearer } = facility;
    const tokenPrefix =
      environment === "cia-stg-1.aws." ? "cia-stg-1.aws." : "";
    const tokenSuffix = environment === "cia-stg-1.aws." ? "" : environment;

    const headers = {
      Authorization: `Bearer ${bearer}`,
      accept: "application/json",
      "api-version": "2.0",
    };

    const [edgeRouter, aps, summary, smartlocks] = await Promise.all([
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/edgerouterstatus`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => null),
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/edgerouterplatformdevicesstatus`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => []),
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/smartlockstatussummary`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => null),
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/smartlockstatus`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => []),
    ]);

    const fetchFacilityDetail = async () => {
      const res = await axios.get(
        `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}`,
        { headers }
      );
      return res.data;
    };

    const fetchWeather = async (postalCode) => {
      const weatherKey = import.meta.env.VITE_WEATHER_KEY;
      const res = await axios.get(
        `https://api.weatherapi.com/v1/current.json?q=${postalCode}&key=${weatherKey}`
      );
      return res.data;
    };

    const facilityDetail = await fetchFacilityDetail();
    const weather = await fetchWeather(facilityDetail.postalCode);

    const lowestSignal = Math.min(
      ...smartlocks
        .filter((s) => !s.isDeviceOffline)
        .map((s) => s.signalQuality || 255)
    );
    const lowestBattery = Math.min(
      ...smartlocks
        .filter((s) => !s.isDeviceOffline)
        .map((s) => s.batteryLevel || 100)
    );
    const offlineCount = smartlocks.filter((s) => s.isDeviceOffline).length;
    if (smartlocks.length > 0) {
      return {
        ...facility,
        edgeRouterStatus: edgeRouter?.connectionStatus || "error",
        onlineAccessPointsCount:
          aps.filter((ap) => !ap.isDeviceOffline).length || 0,
        offlineAccessPointsCount:
          aps.filter((ap) => ap.isDeviceOffline).length || 0,
        okCount: summary?.okCount || 0,
        warningCount: summary?.warningCount || 0,
        errorCount: summary?.errorCount || 0,
        offlineCount,
        lowestSignal: isFinite(lowestSignal)
          ? Math.round((lowestSignal / 255) * 100)
          : 100,
        lowestBattery: isFinite(lowestBattery) ? lowestBattery : 100,
        smartLocks: smartlocks || [],
        edgeRouterName: edgeRouter?.name || "Edge Router",
        facilityDetail,
        weather,
      };
    } else {
      return {
        ...facility,
        edgeRouterStatus: edgeRouter?.connectionStatus || "error",
        onlineAccessPointsCount:
          aps.filter((ap) => !ap.isDeviceOffline).length || 0,
        offlineAccessPointsCount:
          aps.filter((ap) => ap.isDeviceOffline).length || 0,
        okCount: -100,
        warningCount: -100,
        errorCount: -100,
        offlineCount: -100,
        lowestSignal: -100,
        lowestBattery: -100,
        smartLocks: [],
        edgeRouterName: edgeRouter?.name || "Edge Router",
        facilityDetail,
        weather,
        edgeRouter: edgeRouter || {},
        accessPoints: aps || [],
      };
    }
  };

  return (
    <div
      className={`relative ${
        isLoading ? "overflow-hidden min-h-full" : "overflow-auto"
      } h-full dark:text-white dark:bg-darkPrimary relative`}
    >
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner loadingText={currentLoadingText} />}
      {/* tab title */}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaLock className="text-lg" />
          &ensp; SmartLock Dashboard
        </div>
      </div>
      <div className="mt-5 mb-2 flex items-center justify-end text-center mx-5">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => {
            const value = e.target.value;
            setSearchQuery(value);
            search(value);
          }}
          className="border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
        />

        {/* Toggle view button */}
        <button
          className="bg-slate-300 text-white p-1 py-2 rounded-sm hover:bg-slate-400 ml-3 w-44 font-bold cursor-pointer hover:transition hover:duration-300 hover:ease-in-out"
          onClick={() => toggleListView()}
        >
          {listView ? "Card View" : "List View"}
        </button>
      </div>
      {/* List view */}
      {listView ? (
        <div className="w-full px-5">
          <table className="w-full">
            <thead className="select-none">
              <tr className="bg-slate-100 dark:bg-darkNavSecondary">
                <th className="border border-gray-300 dark:border-border px-4 py-2"></th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  colSpan="3"
                >
                  OpenNet
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  colSpan="6"
                >
                  SmartLock
                </th>
              </tr>
              <tr className="bg-slate-100 dark:bg-darkNavSecondary">
                <th
                  onClick={() => handleSort("name")}
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                >
                  Facility{" "}
                  {sortKey === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("edgeRouterStatus")}
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                >
                  Edge Router{" "}
                  {sortKey === "edgeRouterStatus" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("onlineAccessPointsCount")}
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                >
                  Online APs{" "}
                  {sortKey === "onlineAccessPointsCount" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("offlineAccessPointsCount")}
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                >
                  Offline APs{" "}
                  {sortKey === "offlineAccessPointsCount" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                  onClick={() => handleSort("okCount")}
                >
                  Okay{" "}
                  {sortKey === "okCount" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                  onClick={() => handleSort("warningCount")}
                >
                  Warning{" "}
                  {sortKey === "warningCount" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                  onClick={() => handleSort("errorCount")}
                >
                  Error{" "}
                  {sortKey === "errorCount" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  className="border border-gray-300 dark:border-border px-4 py-2 cursor-pointer"
                  onClick={() => handleSort("offlineCount")}
                >
                  Offline{" "}
                  {sortKey === "offlineCount" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("lowestSignal")}
                  className="cursor-pointer border border-gray-300 dark:border-border px-4 py-2"
                >
                  Lowest Signal{" "}
                  {sortKey === "lowestSignal" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("lowestBattery")}
                  className="cursor-pointer border border-gray-300 dark:border-border px-4 py-2"
                >
                  Lowest Battery{" "}
                  {sortKey === "lowestBattery" &&
                    (sortDirection === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFacilities.map((facility, index) => (
                <SmartLockFacilityRow
                  facility={facility}
                  index={index}
                  setExpandedRows={setExpandedRows}
                  expandedRows={expandedRows}
                  key={index}
                />
              ))}
              <tr className="bg-slate-100 dark:bg-darkSecondary text-center">
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2 font-bold text-left"
                  title={totalSmartlocks + " SmartLocks"}
                >
                  Totals:
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={
                    Math.round(
                      (edgeRouterOnlineCount / totalEdgeRouters) * 100
                    ) +
                    "% Online \n" +
                    Math.round(
                      (edgeRouterOfflineCount / totalEdgeRouters) * 100
                    ) +
                    "% Offline \n" +
                    Math.round(
                      (edgeRouterWarningCount / totalEdgeRouters) * 100
                    ) +
                    "% Warning"
                  }
                >
                  {edgeRouterOnlineCount > 0
                    ? edgeRouterOnlineCount + " Online"
                    : ""}
                  {edgeRouterWarningCount > 0 && edgeRouterOnlineCount > 0 && (
                    <br />
                  )}
                  {edgeRouterWarningCount > 0
                    ? edgeRouterWarningCount + " Warning"
                    : ""}
                  {edgeRouterOfflineCount > 0 && <br />}
                  {edgeRouterOfflineCount > 0
                    ? edgeRouterOfflineCount + " Offline"
                    : ""}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={
                    Math.round(
                      (accessPointsOnlineCount / totalAccessPoints) * 100
                    ) + "% Online"
                  }
                >
                  {accessPointsOnlineCount}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={
                    Math.round(
                      (accessPointsOfflineCount / totalAccessPoints) * 100
                    ) + "% Offline"
                  }
                >
                  {accessPointsOfflineCount}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={
                    Math.round((smartlockOkayCount / totalSmartlocks) * 100) +
                    "% Okay Status"
                  }
                >
                  {smartlockOkayCount}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={
                    Math.round(
                      (smartlockWarningCount / totalSmartlocks) * 100
                    ) + "% Warning Status"
                  }
                >
                  {smartlockWarningCount}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={
                    Math.round((smartlockErrorCount / totalSmartlocks) * 100) +
                    "% Error Status"
                  }
                >
                  {smartlockErrorCount}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={
                    Math.round(
                      (smartlockOfflineCount / totalSmartlocks) * 100
                    ) + "% Offline"
                  }
                >
                  {smartlockOfflineCount}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={smartlockLowestSignal.facility}
                >
                  {smartlockLowestSignal.lowestSignal}%
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title={smartlockLowestBattery.facility}
                >
                  {smartlockLowestBattery.lowestBattery}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        // Card View
        <div className="p-5 pt-1 text-left">
          <div className="bg-white shadow-lg rounded-lg p-5 mb-4 border dark:bg-darkSecondary text-black dark:text-white dark:border-border flex justify-center gap-8">
            <div>
              <h1 className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg">
                Edge Routers:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (edgeRouterOnlineCount / totalEdgeRouters) * 100
                    ) + "% Online \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {edgeRouterOnlineCount > 0 ? edgeRouterOnlineCount : "0"}
                  </h2>
                  <p className="text-sm">Online</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (edgeRouterWarningCount / totalEdgeRouters) * 100
                    ) + "% Warning"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {edgeRouterWarningCount > 0 ? edgeRouterWarningCount : "0"}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (edgeRouterOfflineCount / totalEdgeRouters) * 100
                    ) + "% Offline \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {edgeRouterOfflineCount > 0 ? edgeRouterOfflineCount : "0"}
                  </h2>
                  <p className="text-sm">Offline</p>
                </div>
              </div>
            </div>
            <div>
              <h1 className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg">
                Access Points:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (accessPointsOnlineCount / totalAccessPoints) * 100
                    ) + "% Online \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {accessPointsOnlineCount > 0
                      ? accessPointsOnlineCount
                      : "0"}
                  </h2>
                  <p className="text-sm">Online</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (accessPointsOfflineCount / totalAccessPoints) * 100
                    ) + "% Offline \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {accessPointsOfflineCount > 0
                      ? accessPointsOfflineCount
                      : "0"}
                  </h2>
                  <p className="text-sm">Offlline</p>
                </div>
              </div>
            </div>
            <div>
              <h1 className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg">
                SmartLocks:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round((smartlockOkayCount / totalSmartlocks) * 100) +
                    "% Okay Status"
                  }
                >
                  <h2 className="text-3xl font-bold">{smartlockOkayCount}</h2>
                  <p className="text-sm">Okay</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartlockWarningCount / totalSmartlocks) * 100
                    ) + "% Warning Status"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockWarningCount}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round((smartlockErrorCount / totalSmartlocks) * 100) +
                    "% Error Status"
                  }
                >
                  <h2 className="text-3xl font-bold">{smartlockErrorCount}</h2>
                  <p className="text-sm">Error</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartlockOfflineCount / totalSmartlocks) * 100
                    ) + "% Offline"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockOfflineCount}
                  </h2>
                  <p className="text-sm">Offline</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={smartlockLowestSignal.facility}
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockLowestSignal.lowestSignal}%
                  </h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={smartlockLowestBattery.facility}
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockLowestBattery.lowestBattery}%
                  </h2>
                  <p className="text-sm">Lowest Battery</p>
                </div>
              </div>
            </div>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {filteredFacilities.map((facility, index) => (
              <div key={index} className="break-inside-avoid">
                <SmartLockFacilityCard facility={facility} />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Export Button */}
      <div className="float-right px-5">
        <SmartLockExport facilitiesInfo={facilitiesInfo} />
      </div>
    </div>
  );
}
