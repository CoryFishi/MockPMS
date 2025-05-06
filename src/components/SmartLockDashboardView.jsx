import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import SmartLockFacilityCard from "./SmartLockFacilityCard";
import SmartLockFacilityRow from "./SmartLockFacilityRow";
import SmartLockExport from "./SmartLockExport";
import { useAuth } from "../context/AuthProvider";
import LoadingSpinner from "./LoadingSpinner";

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

  // Search via search bar and button
  const search = () => {
    setFilteredFacilities(
      facilitiesWithBearers.filter(
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
      )
    );
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
      const aggregatedData = facilitiesInfo.reduce(
        (totals, facility) => {
          totals.totalSmartlocks +=
            facility.okCount +
            facility.warningCount +
            facility.errorCount +
            facility.offlineCount;
          totals.totalEdgeRouters += facility.edgeRouterStatus ? 1 : 1;
          totals.totalAccessPoints +=
            facility.onlineAccessPointsCount +
            facility.offlineAccessPointsCount;
          totals.edgeRouterOfflineCount +=
            facility.edgeRouterStatus === "error" ? 1 : 0;
          totals.edgeRouterOnlineCount +=
            facility.edgeRouterStatus === "ok" ? 1 : 0;
          totals.edgeRouterWarningCount +=
            facility.edgeRouterStatus === "warning" ? 1 : 0;
          totals.accessPointsOnlineCount += facility.onlineAccessPointsCount;
          totals.accessPointsOfflineCount += facility.offlineAccessPointsCount;
          totals.smartlockOkayCount += facility.okCount || 0;
          totals.smartlockWarningCount += facility.warningCount || 0;
          totals.smartlockErrorCount += facility.errorCount || 0;
          totals.smartlockOfflineCount += facility.offlineCount || 0;
          totals.smartlockLowestSignal =
            Math.min(
              parseInt(totals.smartlockLowestSignal),
              parseInt(facility.lowestSignal)
            ) + "%";
          totals.smartlockLowestBattery =
            Math.min(
              parseInt(totals.smartlockLowestBattery),
              parseInt(facility.lowestBattery)
            ) + "%";

          return totals;
        },
        {
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
          smartlockLowestSignal: "100%",
          smartlockLowestBattery: "100%",
        }
      );
      setTotalAccessPoints(aggregatedData.totalAccessPoints);
      setTotalEdgeRouters(aggregatedData.totalEdgeRouters);
      setTotalSmartlocks(aggregatedData.totalSmartlocks);
      setEdgeRouterOfflineCount(aggregatedData.edgeRouterOfflineCount);
      setEdgeRouterWarningCount(aggregatedData.edgeRouterWarningCount);
      setEdgeRouterOnlineCount(aggregatedData.edgeRouterOnlineCount);
      setAccessPointsOnlineCount(aggregatedData.accessPointsOnlineCount);
      setAccessPointsOfflineCount(aggregatedData.accessPointsOfflineCount);
      setSmartlockOkayCount(aggregatedData.smartlockOkayCount);
      setSmartlockWarningCount(aggregatedData.smartlockWarningCount);
      setSmartlockErrorCount(aggregatedData.smartlockErrorCount);
      setSmartlockOfflineCount(aggregatedData.smartlockOfflineCount);
      setSmartlockLowestSignal(aggregatedData.smartlockLowestSignal);
      setSmartlockLowestBattery(aggregatedData.smartlockLowestBattery);
    };
    updateAggregatedCounts(facilitiesInfo);
  }, [facilitiesInfo]);

  // Get bearer tokens prior to creating rows/cards
  useEffect(() => {
    const fetchFacilitiesWithBearers = async () => {
      try {
        const updatedFacilities = await Promise.all(
          selectedTokens.map(async (facility) => {
            setCurrentLoadingText(`Loading ${facility.client}...`);
            const bearer = await fetchBearerToken(facility);
            return { ...facility, bearer };
          })
        );
        setFacilitiesWithBearers(updatedFacilities);
        setFilteredFacilities(updatedFacilities);
      } catch (error) {
        console.error("Error fetching facilities:", error);
      } finally {
        setIsLoading(false); // Set loading to false once all async operations complete
      }
    };

    // Initial fetch
    fetchFacilitiesWithBearers();

    // Set up interval for every 2 minutes
    const interval = setInterval(fetchFacilitiesWithBearers, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedTokens]);

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
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
        />
        {/* Search Button */}
        <button
          className="bg-green-500 text-white p-1 py-2 rounded-sm hover:bg-green-600 ml-3 w-44 font-bold cursor-pointer hover:transition hover:duration-300 hover:ease-in-out"
          onClick={() => search()}
          disabled={!searchQuery || searchQuery.length < 2} // Disable if empty or less than 2 characters
          title="Search for facilities by ID, property number, name, or environment"
        >
          Search
        </button>
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
            <thead>
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
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Facility
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Edge Router
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Online APs
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Offline APs
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Okay
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Warning
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Error
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Offline
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Lowest Signal Quality
                </th>
                <th className="border border-gray-300 dark:border-border px-4 py-2">
                  Lowest Battery Level
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFacilities.map((facility, index) => (
                <SmartLockFacilityRow
                  setFacilitiesInfo={setFacilitiesInfo}
                  key={index}
                  facility={facility}
                  index={index}
                  setExpandedRows={setExpandedRows}
                  expandedRows={expandedRows}
                />
              ))}
              <tr className="bg-slate-100 dark:bg-darkSecondary">
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2 font-bold"
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
                  title="Lowest Signal"
                >
                  {smartlockLowestSignal}
                </td>
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  title="Lowest Battery"
                >
                  {smartlockLowestBattery}
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
                  title="Lowest Signal"
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockLowestSignal}
                  </h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title="Lowest Battery"
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockLowestBattery}{" "}
                  </h2>
                  <p className="text-sm">Lowest Battery</p>
                </div>
              </div>
            </div>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {filteredFacilities.map((facility, index) => (
              <div key={index} className="break-inside-avoid">
                <SmartLockFacilityCard
                  setFacilitiesInfo={setFacilitiesInfo}
                  facility={facility}
                />
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
