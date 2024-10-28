import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import SmartLockFacilityCard from "./SmartLockFacilityCard";
import SmartLockFacilityRow from "./SmartLockFacilityRow";
import SmartLockExport from "./SmartLockExport";

export default function SmartLockDashboardView({
  selectedFacilities,
  setSelectedFacilities,
}) {
  const [facilitiesWithBearers, setFacilitiesWithBearers] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [listView, setListView] = useState(
    JSON.parse(localStorage.getItem("smartlockListView")) || false
  );
  const [facilitiesInfo, setFacilitiesInfo] = useState([]);

  const [edgeRouterOfflineCount, setEdgeRouterOfflineCount] = useState([]);
  const [edgeRouterOnlineCount, setEdgeRouterOnlineCount] = useState([]);
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
          totals.edgeRouterOfflineCount += facility.edgeRouterStatus ? 1 : 0;
          totals.edgeRouterOnlineCount += facility.edgeRouterStatus ? 0 : 1;
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

  const toggleListView = () => {
    setListView(!listView);
    localStorage.setItem("smartlockListView", !listView);
  };

  useEffect(() => {
    const fetchFacilitiesWithBearers = async () => {
      const updatedFacilities = await Promise.all(
        selectedFacilities.map(async (facility) => {
          const bearer = await fetchBearerToken(facility);
          return { ...facility, bearer };
        })
      );
      setFacilitiesWithBearers(updatedFacilities);
      setFilteredFacilities(updatedFacilities);
    };

    fetchFacilitiesWithBearers();
  }, [selectedFacilities]);

  const [searchQuery, setSearchQuery] = useState("");

  const search = () => {
    setFilteredFacilities([]);
    setTimeout(
      () =>
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
        ),
      500
    );
  };

  return (
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary text-center">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaLock className="text-lg" />
          &ensp; SmartLock Dashboard
        </div>
      </div>
      <p className="text-sm dark:text-white text-left">{Date()}</p>
      <div className="mt-5 mb-2 flex items-center justify-end text-center mx-5">
        <input
          type="text"
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          className="bg-green-500 text-white p-1 py-2 rounded hover:bg-green-600 ml-3 w-44 font-bold"
          onClick={() => search()}
        >
          Search
        </button>
        <button
          className="bg-slate-300 text-white p-1 py-2 rounded hover:bg-slate-400 ml-3 w-44 font-bold"
          onClick={() => toggleListView()}
        >
          {listView ? "Card View" : "List View"}
        </button>
      </div>
      {listView ? (
        <div className="w-full px-5">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200 dark:bg-darkNavSecondary">
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
              <tr className="bg-gray-200 dark:bg-darkNavSecondary">
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
                />
              ))}
              <tr className="bg-slate-50 dark:bg-darkSecondary">
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
                    ) + "% Online"
                  }
                >
                  {edgeRouterOnlineCount} Online <br />{" "}
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
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 p-5 pt-1 text-left">
          {filteredFacilities.map((facility, index) => (
            <div key={index}>
              <SmartLockFacilityCard facility={facility} />
            </div>
          ))}
        </div>
      )}
      <div className="float-right px-5">
        <SmartLockExport facilitiesInfo={facilitiesInfo} />
      </div>
    </div>
  );
}
