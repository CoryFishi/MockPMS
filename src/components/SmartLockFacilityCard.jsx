import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import SmartLock from "./modals/SmartLock";

export default function SmartLockFacilityCard({ setFacilitiesInfo, facility }) {
  const [smartlocks, setSmartlocks] = useState([]);
  const [lowestSignal, setLowestSignal] = useState([]);
  const [offline, setOffline] = useState([]);
  const [lowestBattery, setLowestBattery] = useState([]);
  const [smartlockSummary, setSmartlockSummary] = useState(null);
  const [edgeRouter, setEdgeRouter] = useState(null);
  const [accessPoints, setAccessPoints] = useState(null);
  const [isSmartlockModalOpen, setIsSmartlockModalOpen] = useState(false);
  const [smartlockModalOption, setSmartlockModalOption] = useState(null);

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

      // Find the lowest battery
      const lockWithLowestBattery = smartLocks.reduce((lowestLock, lock) => {
        return lock.batteryLevel < lowestLock.batteryLevel &&
          !lock.isDeviceOffline
          ? lock
          : lowestLock;
      }, smartLocks[0]);
      const lowestBattery = lockWithLowestBattery.batteryLevel + "%";
      setLowestBattery(lowestBattery);

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
    <>
      {isSmartlockModalOpen && (
        <SmartLock
          smartlockModalOption={smartlockModalOption}
          smartLocks={smartlocks}
          facilityName={facility.name}
          setIsSmartlockModalOpen={setIsSmartlockModalOpen}
        />
      )}
      {edgeRouter && (
        <div className="break-inside-avoid bg-white shadow-lg rounded-lg p-5 mb-4 border dark:bg-darkSecondary text-black dark:text-white dark:border-border">
          <h1
            className="break-all w-full text-2xl"
            onClick={() => console.log(smartlockSummary)}
          >
            {facility.name}'s Summary
          </h1>
          {smartlockSummary && (
            <>
              <h2
                className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg mt-2 hover:cursor-pointer"
                onClick={() => openSmartLockModal()}
              >
                SmartLocks:
              </h2>
              <div className="grid grid-cols-3 grid-rows-2 gap-4 text-black dark:text-white">
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("good")}
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockSummary.okCount}
                  </h2>
                  <p className="text-sm">Good</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("warning")}
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockSummary.warningCount}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("error")}
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockSummary.errorCount}
                  </h2>
                  <p className="text-sm">Error</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("lowestBattery")}
                >
                  <h2 className="text-3xl font-bold">{lowestBattery}</h2>
                  <p className="text-sm">Lowest Battery</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("lowestSignal")}
                >
                  <h2 className="text-3xl font-bold">{lowestSignal}</h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("offline")}
                >
                  <h2 className="text-3xl font-bold">{offline}</h2>
                  <p className="text-sm">Offline</p>
                </div>
              </div>
            </>
          )}

          <h2 className="w-full border-b mb-2 border-yellow-500 text-black dark:text-white text-lg mt-2 hover:cursor-pointer">
            OpenNet:
          </h2>
          <div
            className="shadow-md rounded-lg p-2 flex items-center text-black dark:text-white border"
            title={edgeRouter.connectionStatusMessage}
          >
            <div
              className={`w-14 h-14 rounded-full ${
                edgeRouter.connectionStatus === "warning"
                  ? "bg-yellow-500"
                  : edgeRouter.connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-green-700"
              }`}
            ></div>
            <div className="ml-3">
              <h2 className="text-2xl">{edgeRouter?.name}</h2>
              <p className="text-sm">
                {new Date(edgeRouter.eventLastReceivedOn).toLocaleString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-black dark:text-white mt-2">
            {accessPoints?.map((accessPoint, index) => (
              <div
                className="shadow-md rounded-lg p-2 flex items-center border"
                key={index}
                title={accessPoint.connectionStatusMessage}
              >
                <div
                  className={`w-10 h-10 rounded-full ${
                    accessPoint.isDevicePaired === false
                      ? "bg-yellow-500"
                      : accessPoint.isDeviceOffline === true
                      ? "bg-red-500"
                      : "bg-green-700"
                  }`}
                ></div>
                <div className="ml-3">
                  <h2 className="text-xl">{accessPoint.name}</h2>
                  <p className="text-sm">
                    {new Date(accessPoint.lastUpdateTimestamp).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
