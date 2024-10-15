import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";

export default function SmartLockFacilityCard({ facility }) {
  const [smartlocks, setSmartlocks] = useState([]);
  const [lowestSignal, setLowestSignal] = useState([]);
  const [offline, setOffline] = useState([]);
  const [lowestBattery, setLowestBattery] = useState([]);
  const [smartlockSummary, setSmartlockSummary] = useState(null);
  const [edgeRouter, setEdgeRouter] = useState(null);
  const [accessPoints, setAccessPoints] = useState(null);

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
        return lock.signalQuality < lowestLock.signalQuality
          ? lock
          : lowestLock;
      }, smartLocks[0]);
      const lowestSignal =
        Math.round((lockWithLowestSignal.signalQuality / 255) * 100) + "%";
      setLowestSignal(lowestSignal);
      console.log(lockWithLowestSignal, lowestSignal);

      // Find the lowest battery
      const lockWithLowestBattery = smartLocks.reduce((lowestLock, lock) => {
        return lock.batteryLevel < lowestLock.batteryLevel ? lock : lowestLock;
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
    const fetchData = async () => {
      const edgeRouterData = await fetchEdgeRouter();
      if (edgeRouterData) {
        setEdgeRouter(edgeRouterData);
      } else {
        return;
      }
      const locksSummaryData = await fetchSmartLockSummary();
      if (locksSummaryData) {
        setSmartlockSummary(locksSummaryData);
      } else {
        return;
      }
      const accessPointsData = await fetchAccessPoints();
      if (accessPointsData) {
        setAccessPoints(accessPointsData);
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
      {edgeRouter && (
        <div className="break-inside-avoid bg-white shadow-md rounded-lg p-5 mb-4">
          <h1 className="break-all w-full text-3xl text-black">
            {facility.name}'s Summary
          </h1>
          {smartlockSummary && (
            <>
              <h2 className="w-full border-b mb-2 border-blue-200 text-blue-500 text-lg mt-2">
                SmartLocks:
              </h2>
              <div className="grid grid-cols-3 grid-rows-2 gap-4 text-black">
                <div className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer">
                  <h2 className="text-3xl font-bold">
                    {smartlockSummary.okCount}
                  </h2>
                  <p className="text-sm">Good</p>
                </div>
                <div className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer">
                  <h2 className="text-3xl font-bold">
                    {smartlockSummary.warningCount}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer">
                  <h2 className="text-3xl font-bold">
                    {smartlockSummary.errorCount}
                  </h2>
                  <p className="text-sm">Error</p>
                </div>
                <div className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer">
                  <h2 className="text-3xl font-bold">{lowestBattery}</h2>
                  <p className="text-sm">Lowest Battery</p>
                </div>
                <div className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer">
                  <h2 className="text-3xl font-bold">{lowestSignal}</h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer">
                  <h2 className="text-3xl font-bold">{offline}</h2>
                  <p className="text-sm">Offline</p>
                </div>
              </div>
            </>
          )}

          <h2 className="w-full border-b mb-2 border-blue-200 text-blue-500 text-lg mt-2">
            OpenNet:
          </h2>
          <div className="shadow-md rounded-lg p-2 flex items-center text-black">
            <div className="w-14 h-14 bg-green-700 rounded-full"></div>
            <div className="ml-3">
              <h2 className="text-2xl">{edgeRouter?.name}</h2>
              <p className="text-sm">{edgeRouter?.lastReadDisplay}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-black">
            {accessPoints?.map((accessPoint, index) => (
              <div className="shadow-md rounded-lg p-2 flex items-center">
                <div className="w-10 h-10 bg-green-700 rounded-full"></div>
                <div className="ml-3">
                  <h2 className="text-xl">{accessPoint.name}</h2>
                  <p className="text-sm">{accessPoint.lastReadDisplay}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
