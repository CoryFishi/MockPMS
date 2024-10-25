import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import SmartLock from "./modals/SmartLock";

import { FaCheckCircle } from "react-icons/fa";

import { IoIosWarning } from "react-icons/io";

export default function SmartLockFacilityRow({
  setFacilitiesInfo,
  facility,
  index,
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
      edgeRouterStatus: edgeRouter?.isDeviceOffline,
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
    };

    fetchData();
  }, []);

  return (
    <tr className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary relative">
      <td
        className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
        onClick={() => openSmartLockModal("")}
      >
        {facility.name}
      </td>
      <td
        className="border border-gray-300 dark:border-border px-4 py-2"
        title={edgeRouter?.connectionStatusMessage}
      >
        <div className="inline-flex items-center gap-1">
          {edgeRouter?.isDeviceOffline ? (
            <IoIosWarning className="text-red-500 mr-2" />
          ) : (
            <FaCheckCircle className="text-green-500 mr-2" />
          )}
          {edgeRouter?.name}
        </div>
      </td>
      <td
        className="border border-gray-300 dark:border-border px-4 py-2"
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
        className="border border-gray-300 dark:border-border px-4 py-2"
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
        className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
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
        className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
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
        className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
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
        className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
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
        className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
        onClick={() => openSmartLockModal("lowestSignal")}
        title={"SmartLock " + lowestSignalSmartlock.name}
      >
        {lowestSignal}
      </td>
      <td
        className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
        onClick={() => openSmartLockModal("lowestBattery")}
        title={"SmartLock " + lowestBatterySmartlock.name}
      >
        {lowestBattery}
      </td>
      {isSmartlockModalOpen && (
        <SmartLock
          smartlockModalOption={smartlockModalOption}
          smartLocks={smartlocks}
          facilityName={facility.name}
          setIsSmartlockModalOpen={setIsSmartlockModalOpen}
        />
      )}
    </tr>
  );
}
