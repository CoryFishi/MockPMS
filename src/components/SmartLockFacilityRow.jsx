import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import SmartLock from "./modals/SmartLock";
import { FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import { useAuth } from "../context/AuthProvider";
import { sendFacilityReportEmail } from "../functions/facilityReportEmail";

export default function SmartLockFacilityRow({
  setFacilitiesInfo,
  facility,
  setExpandedRows,
  expandedRows,
}) {
  const [smartlocks, setSmartlocks] = useState([]);
  const [lowestSignal, setLowestSignal] = useState([]);
  const [offline, setOffline] = useState([]);
  const [lowestBattery, setLowestBattery] = useState([]);
  const [smartlockSummary, setSmartlockSummary] = useState(null);
  const [edgeRouter, setEdgeRouter] = useState(null);
  const [accessPoints, setAccessPoints] = useState(null);
  const [isSmartlockModalOpen, setIsSmartlockModalOpen] = useState(false);
  const [smartlockModalOption, setSmartlockModalOption] = useState(null);
  const [lowestSignalSmartlock, setLowestSignalSmartlock] = useState([]);
  const [lowestBatterySmartlock, setLowestBatterySmartlock] = useState([]);
  const [facilityDetail, setFacilityDetail] = useState({});
  const [currentWeather, setCurrentWeather] = useState({});
  const { user } = useAuth();

  const weatherAPI = import.meta.env.VITE_WEATHER_KEY;

  const toggleRowExpansion = (facilityId) => {
    setExpandedRows((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  useEffect(() => {
    const facilityData = {
      name: facility.name,
      lowestSignal:
        lowestSignal && Object.keys(lowestSignal).length > 0
          ? lowestSignal
          : "100%",
      offlineCount: offline > 0 ? offline : 0,
      lowestBattery:
        lowestBattery && Object.keys(lowestBattery).length > 0
          ? lowestBattery
          : "100%",
      errorCount: smartlockSummary?.errorCount || 0,
      okCount: smartlockSummary?.okCount || 0,
      warningCount: smartlockSummary?.warningCount || 0,
      edgeRouterStatus: edgeRouter?.connectionStatus,
      offlineAccessPointsCount: Array.isArray(accessPoints)
        ? accessPoints.filter((ap) => ap.isDeviceOffline === true).length
        : 0,
      onlineAccessPointsCount: Array.isArray(accessPoints)
        ? accessPoints.filter((ap) => ap.isDeviceOffline === false).length
        : 0,
    };

    setFacilitiesInfo((prev) => {
      const existingIndex = prev.findIndex((f) => f.name === facility.name);

      if (existingIndex !== -1) {
        const updatedFacilities = [...prev];
        updatedFacilities[existingIndex] = facilityData;
        return updatedFacilities;
      } else {
        return [...prev, facilityData];
      }
    });
  }, [
    facility,
    smartlocks,
    lowestSignal,
    offline,
    lowestBattery,
    smartlockSummary,
    edgeRouter,
    accessPoints,
  ]);

  const openSmartLockModal = (option) => {
    if (isSmartlockModalOpen) {
      return;
    }
    setSmartlockModalOption(option);
    setIsSmartlockModalOpen(true);
  };

  const fetchSmartLockSummary = async () => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${facility.id}/smartlockstatussummary`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching SmartLocks for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have SmartLocks`);
      return null;
    }
  };
  const fetchEdgeRouter = async () => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${facility.id}/edgerouterstatus`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching EdgeRouter for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have an EdgeRouter`);
      return null;
    }
  };
  const fetchAccessPoints = async () => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${facility.id}/edgerouterplatformdevicesstatus`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching Access Points for: ${facility.name}`,
        error
      );
      return null;
    }
  };
  const fetchSmartLock = async () => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${facility.id}/smartlockstatus`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const smartLocks = response.data;

      // Find the lowest signalQuality
      const lockWithLowestSignal = smartLocks.reduce((lowestLock, lock) => {
        return lock.signalQuality < lowestLock.signalQuality &&
          !lock.isDeviceOffline
          ? lock
          : lowestLock;
      }, smartLocks[0]);

      const lowestSignal =
        Math.round((lockWithLowestSignal.signalQuality / 255) * 100) + "%";
      setLowestSignal(lowestSignal);
      setLowestSignalSmartlock(lockWithLowestSignal);

      // Find the lowest battery
      const lockWithLowestBattery = smartLocks.reduce((lowestLock, lock) => {
        return lock.batteryLevel < lowestLock.batteryLevel &&
          !lock.isDeviceOffline
          ? lock
          : lowestLock;
      }, smartLocks[0]);
      const lowestBattery = lockWithLowestBattery.batteryLevel + "%";
      setLowestBattery(lowestBattery);
      setLowestBatterySmartlock(lockWithLowestBattery);

      const offlineDeviceCount = smartLocks.filter(
        (lock) => lock.isDeviceOffline === true
      ).length;
      setOffline(offlineDeviceCount);

      return smartLocks;
    } catch (error) {
      console.error(`Error fetching SmartLocks for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have SmartLocks`);
      return null;
    }
  };
  const fetchFacilityDetail = async () => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${facility.id}`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const currentWeather = await fetchWeather(response.data.postalCode);
      if (currentWeather) {
        setCurrentWeather(currentWeather);
      }
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching facility detail for: ${facility.name}`,
        error
      );
      toast.error(`${facility.name} can't be detailed`);
      return null;
    }
  };
  const fetchWeather = async (postalCode) => {
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?q=${postalCode}&key=${weatherAPI}`,
        {
          headers: {
            accept: "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching facility weather for: ${facility.name}`,
        error
      );
      toast.error(`${facility.name} can't find weather`);
      return null;
    }
  };
  const sendEmail = async () => {
    try {
      const response = await fetch("/.netlify/functions/sendEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: user.email,
          subject: "Hello from Resend via Netlify Function",
          html: "<strong>It works!</strong>",
        }),
      });

      const data = await response.json();
      console.log("Email sent:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const edgeRouterData = await fetchEdgeRouter();
      if (edgeRouterData) {
        setEdgeRouter(edgeRouterData);
      } else {
        return;
      }
      const accessPointsData = await fetchAccessPoints();
      if (accessPointsData) {
        setAccessPoints(accessPointsData);
      }
      const locksSummaryData = await fetchSmartLockSummary();
      const totalLocks =
        locksSummaryData.errorCount +
        locksSummaryData.warningCount +
        locksSummaryData.okCount;
      if (totalLocks > 0) {
        setSmartlockSummary(locksSummaryData);
      } else {
        return;
      }
      const smartlockData = await fetchSmartLock();
      if (smartlockData) {
        setSmartlocks(smartlockData);
      }
      const facilityDetail = await fetchFacilityDetail();
      if (facilityDetail) {
        setFacilityDetail(facilityDetail);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <tr className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary relative border border-gray-300 dark:border-border ">
        <td
          className="px-4 py-2"
          onClick={() => toggleRowExpansion(facility.id)}
        >
          <div className="flex items-center gap-2 cursor-pointer">
            <button
              className="text-blue-500"
              title={expandedRows.includes(facility.id) ? "Collapse" : "Expand"}
            >
              {expandedRows.includes(facility.id) ? "−" : "+"}
            </button>
            {facility.name}
            <FaExternalLinkAlt
              className="text-blue-300 group-hover:text-blue-500"
              title={
                facility.environment === "cia-stg-1.aws."
                  ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                  : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`
              }
              onClick={(e) => {
                e.stopPropagation();
                e.prev;
                const baseUrl =
                  facility.environment === "cia-stg-1.aws."
                    ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                    : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`;
                window.open(baseUrl, "_blank");
              }}
            />
          </div>
        </td>
        <td className="px-4 py-2" title={edgeRouter?.connectionStatusMessage}>
          <div className="inline-flex items-center gap-1">
            {edgeRouter?.connectionStatus === "error" ? (
              <IoIosWarning className="text-red-500 mr-2" />
            ) : edgeRouter?.connectionStatus === "warning" ? (
              <IoIosWarning className="text-yellow-500 mr-2" />
            ) : (
              <FaCheckCircle className="text-green-500 mr-2" />
            )}
            {edgeRouter?.name}
          </div>
        </td>
        <td
          className="px-4 py-2"
          title={
            Array.isArray(accessPoints)
              ? `${accessPoints
                  .filter((ap) => ap.isDeviceOffline === false)
                  .map((ap) => ap.name)
                  .join(", ")}\n${Math.round(
                  (accessPoints.filter((ap) => ap.isDeviceOffline === false)
                    .length /
                    accessPoints.length) *
                    100
                )}% Online`
              : ""
          }
        >
          {Array.isArray(accessPoints)
            ? accessPoints.filter((ap) => ap.isDeviceOffline === false).length
            : 0}
        </td>

        <td
          className="px-4 py-2"
          title={
            Array.isArray(accessPoints)
              ? `${accessPoints
                  .filter((ap) => ap.isDeviceOffline === true)
                  .map((ap) => ap.name)
                  .join(", ")}\n${Math.round(
                  (accessPoints.filter((ap) => ap.isDeviceOffline === true)
                    .length /
                    accessPoints.length) *
                    100
                )}% Offline`
              : ""
          }
        >
          {Array.isArray(accessPoints)
            ? accessPoints.filter((ap) => ap.isDeviceOffline === true).length
            : 0}
        </td>

        <td
          className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
          onClick={() => openSmartLockModal("good")}
          title={
            Math.round(
              (smartlockSummary?.okCount /
                (smartlockSummary?.okCount +
                  smartlockSummary?.warningCount +
                  smartlockSummary?.errorCount)) *
                100
            ) +
            "%" +
            " Okay Status"
          }
        >
          {smartlockSummary?.okCount}
        </td>
        <td
          className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
          onClick={() => openSmartLockModal("warning")}
          title={
            Math.round(
              (smartlockSummary?.warningCount /
                (smartlockSummary?.okCount +
                  smartlockSummary?.warningCount +
                  smartlockSummary?.errorCount)) *
                100
            ) +
            "%" +
            " Warning Status"
          }
        >
          {smartlockSummary?.warningCount}
        </td>
        <td
          className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
          onClick={() => openSmartLockModal("error")}
          title={
            Math.round(
              (smartlockSummary?.errorCount /
                (smartlockSummary?.okCount +
                  smartlockSummary?.warningCount +
                  smartlockSummary?.errorCount)) *
                100
            ) +
            "%" +
            " Error Status"
          }
        >
          {smartlockSummary?.errorCount}
        </td>
        <td
          className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
          onClick={() => openSmartLockModal("offline")}
          title={
            Math.round(
              (offline /
                (smartlockSummary?.okCount +
                  smartlockSummary?.warningCount +
                  smartlockSummary?.errorCount)) *
                100
            ) +
            "%" +
            " Offline"
          }
        >
          {offline}
        </td>
        <td
          className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
          onClick={() => openSmartLockModal("lowestSignal")}
          title={"SmartLock " + lowestSignalSmartlock.name}
        >
          {lowestSignal}
        </td>
        <td
          className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
          onClick={() => openSmartLockModal("lowestBattery")}
          title={"SmartLock " + lowestBatterySmartlock.name}
        >
          {lowestBattery}
        </td>
      </tr>
      {expandedRows.includes(facility.id) && (
        <tr>
          <td
            colSpan="10"
            className="bg-gray-100 dark:border-border dark:bg-darkNavPrimary p-5 border"
          >
            <div className="grid grid-cols-3">
              <div className="grid-cols-2 grid gap-2 text-left">
                <div>
                  <h2 className="font-bold dark:text-yellow-500">Facility</h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facilityDetail.name}
                  </p>
                  <h2 className="font-bold dark:text-yellow-500">
                    Property Number
                  </h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facilityDetail.propertyNumber || "null"}
                  </p>
                  <h2 className="font-bold dark:text-yellow-500">
                    Facility ID
                  </h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facilityDetail.id || "null"}
                  </p>
                </div>
                <div>
                  <h2 className="font-bold dark:text-yellow-500">Address</h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facilityDetail.addressLine1} {facilityDetail.addressLine2}
                  </p>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facilityDetail.city} {facilityDetail.state}
                  </p>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facilityDetail.postalCode} {facilityDetail.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                {/* Icon and Temperature */}
                <div className="flex items-center ">
                  {/* Weather Icon */}
                  <img
                    src={currentWeather?.current?.condition?.icon}
                    alt="Weather Icon"
                    className="w-16 h-16"
                  />
                  {/* Temperature */}
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-black dark:text-white">
                      {Math.round(currentWeather?.current?.temp_f)}
                    </span>
                    <span className="text-xl font-light dark:text-yellow-500">
                      °F
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 text-left ml-2 dark:text-gray-200">
                    <p>
                      Precipitation:{" "}
                      {currentWeather?.current?.precip_in.toFixed(1)}%
                    </p>
                    <p>
                      Humidity: {currentWeather?.current?.humidity.toFixed(1)}%
                    </p>
                    <p>
                      Wind: {currentWeather?.current?.wind_mph.toFixed(1)} mph
                    </p>
                  </div>
                </div>
                {/* Weather Header */}
                <div className="text-right">
                  <h3 className="text-2xl font-semibold text-black dark:text-yellow-500">
                    Weather
                  </h3>
                  <p className="text-sm dark:text-gray-200">
                    {currentWeather?.current?.last_updated}
                  </p>
                  <p className="text-sm dark:text-gray-200">
                    {currentWeather?.current?.condition.text}
                  </p>
                </div>
              </div>
              <div className="items-end space-y-1 my-auto">
                <button
                  className="bg-gray-400 text-white px-2 py-1 rounded font-bold w-2/3 hover:bg-gray-500"
                  onClick={() => openSmartLockModal("")}
                >
                  View all SmartLocks
                </button>
                <button
                  className="bg-gray-400 text-white px-2 py-1 rounded font-bold w-2/3 hover:bg-gray-500"
                  onClick={() =>
                    sendFacilityReportEmail(
                      user,
                      facility,
                      edgeRouter,
                      accessPoints,
                      smartlockSummary,
                      facilityDetail,
                      currentWeather
                    )
                  }
                >
                  Send Facility Detail Report
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
      {isSmartlockModalOpen && (
        <SmartLock
          smartlockModalOption={smartlockModalOption}
          smartLocks={smartlocks}
          facilityName={facility.name}
          setIsSmartlockModalOpen={setIsSmartlockModalOpen}
        />
      )}
    </>
  );
}
