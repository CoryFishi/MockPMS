import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import SmartLockFacilityCard from "./SmartLockFacilityCard";
import SmartLockFacilityRow from "./SmartLockFacilityRow";
import SmartLockExport from "./SmartLockExport";
import { useAuth } from "../context/AuthProvider";

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

  const [pageLoadDateTime, setPageLoadDateTime] = useState(
    new Date().toLocaleString()
  );

  // Send email with facility information
  const sendEmail = async () => {
    const rows = facilitiesInfo.map((facility) => ({
      facilityName: facility.name,
      edgeRouter: facility.edgeRouterStatus,
      onlineAPs: facility.onlineAccessPointsCount,
      offlineAPs: facility.offlineAccessPointsCount,
      okay: facility.okCount,
      warning: facility.warningCount,
      error: facility.errorCount,
      offline: facility.offlineCount,
      lowestSignal: facility.lowestSignal,
      lowestBattery: facility.lowestBattery,
    }));

    const html = generateHTML(rows);

    try {
      const response = await fetch("/.netlify/functions/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: user.email,
          subject: "SmartLock Status Report",
          html,
        }),
      });

      // Check if response is JSON
      if (response.ok) {
        const data = await response.json();
        console.log("Email sent:", data);
      } else {
        const errorText = await response.text(); // Read error as text
        console.error("Error:", errorText);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const generateHTML = (rows) => `
  <div style="width: 100%; padding: 10px; font-family: Arial, sans-serif; color: #333;">
    <h1 style="text-align: center;">SmartLock Status Report</h1>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #edf2f7; border: 1px solid #e2e8f0;">
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;"></th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;" colspan="3">OpenNet</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;" colspan="6">SmartLock</th>
        </tr>
        <tr style="background-color: #edf2f7; border: 1px solid #e2e8f0;">
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Facility</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Edge Router</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Online APs</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Offline APs</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Okay</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Warning</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Error</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Offline</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Lowest Signal</th>
          <th style="padding: 0.5rem; border: 1px solid #e2e8f0;">Lowest Battery</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.facilityName}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.edgeRouter}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.onlineAPs}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.offlineAPs}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.okay}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.warning}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.error}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.offline}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.lowestSignal}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${row.lowestBattery}</td>
          </tr>
        `
          )
          .join("")}
          <tr>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">Totals:</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${
              edgeRouterOnlineCount > 0 ? edgeRouterOnlineCount + " Online" : ""
            }
                  ${
                    edgeRouterWarningCount > 0 &&
                    edgeRouterOnlineCount > 0 && <br />
                  }
                  ${
                    edgeRouterWarningCount > 0
                      ? edgeRouterWarningCount + " Warning"
                      : ""
                  }
                  ${edgeRouterOfflineCount > 0 && <br />}
                  ${
                    edgeRouterOfflineCount > 0
                      ? edgeRouterOfflineCount + " Offline"
                      : ""
                  }
                    </td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${accessPointsOnlineCount}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${accessPointsOfflineCount}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${smartlockOkayCount}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${smartlockWarningCount}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${smartlockErrorCount}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${smartlockOfflineCount}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${smartlockLowestSignal}</td>
            <td style="padding: 0.5rem; border: 1px solid #e2e8f0;">${smartlockLowestBattery}</td>
          </tr>
      </tbody>
    </table>
  </div>
`;

  // Search via search bar and button
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
      const updatedFacilities = await Promise.all(
        selectedTokens.map(async (facility) => {
          const bearer = await fetchBearerToken(facility);
          return { ...facility, bearer };
        })
      );
      setFacilitiesWithBearers(updatedFacilities);
      setFilteredFacilities(updatedFacilities);
    };

    // Initial fetch
    fetchFacilitiesWithBearers();

    // Set up interval for every 2 minutes
    const interval = setInterval(fetchFacilitiesWithBearers, 2 * 60 * 1000);

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, [selectedTokens]);

  return (
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary text-center mb-14">
      {/* tab title */}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaLock className="text-lg" />
          &ensp; SmartLock Dashboard
        </div>
      </div>
      {/* Last update date/time */}
      <p className="text-sm dark:text-white text-left">{pageLoadDateTime}</p>
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
          className="bg-green-500 text-white p-1 py-2 rounded-sm hover:bg-green-600 ml-3 w-44 font-bold"
          onClick={() => search()}
        >
          Search
        </button>
        {/* Toggle view button */}
        <button
          className="bg-slate-300 text-white p-1 py-2 rounded-sm hover:bg-slate-400 ml-3 w-44 font-bold"
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
              <h1 className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg hover:cursor-pointer">
                Edge Routers:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
              <h1 className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg hover:cursor-pointer">
                Access Points:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
              <h1 className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg hover:cursor-pointer">
                SmartLocks:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  title={
                    Math.round((smartlockOkayCount / totalSmartlocks) * 100) +
                    "% Okay Status"
                  }
                >
                  <h2 className="text-3xl font-bold">{smartlockOkayCount}</h2>
                  <p className="text-sm">Okay</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  title={
                    Math.round((smartlockErrorCount / totalSmartlocks) * 100) +
                    "% Error Status"
                  }
                >
                  <h2 className="text-3xl font-bold">{smartlockErrorCount}</h2>
                  <p className="text-sm">Error</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  title="Lowest Signal"
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockLowestSignal}
                  </h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
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
      {/* Email Button */}
      <div>
        <p
          className="text-black dark:text-white p-1 py-2 rounded-sm font-bold hover:text-slate-400 dark:hover:text-slate-400 hover:cursor-pointer mr-5"
          onClick={() => sendEmail()}
        >
          Email Report
        </p>
      </div>
    </div>
  );
}
