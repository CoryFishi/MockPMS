import React, { useState } from "react";
import SmartLock from "../modals/SmartLock";
import { RiRouterFill } from "react-icons/ri";

export default function SmartLockFacilityCard({ facility }) {
  const [isSmartlockModalOpen, setIsSmartlockModalOpen] = useState(false);
  const [smartlockModalOption, setSmartlockModalOption] = useState(null);

  const openSmartLockModal = (option) => {
    if (isSmartlockModalOpen) {
      return;
    }
    setSmartlockModalOption(option);
    setIsSmartlockModalOpen(true);
  };

  return (
    <>
      {isSmartlockModalOpen && (
        <SmartLock
          smartlockModalOption={smartlockModalOption}
          smartLocks={facility.smartLocks}
          facilityName={facility.name}
          setIsSmartlockModalOpen={setIsSmartlockModalOpen}
        />
      )}
      {facility && (
        <div className="break-inside-avoid bg-white shadow-lg rounded-lg p-5 mb-4 border dark:bg-darkSecondary text-black dark:text-white dark:border-border">
          <h1
            className="break-all w-full text-2xl"
            onClick={() => console.log(facility)}
          >
            {facility.name}'s Summary
          </h1>
          {facility.smartLocks.length > 0 && (
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
                  <h2 className="text-3xl font-bold">{facility.okCount}</h2>
                  <p className="text-sm">Good</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("warning")}
                >
                  <h2 className="text-3xl font-bold">
                    {facility.warningCount}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("error")}
                >
                  <h2 className="text-3xl font-bold">{facility.errorCount}</h2>
                  <p className="text-sm">Error</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("lowestBattery")}
                >
                  <h2 className="text-3xl font-bold">
                    {facility.lowestBattery}%
                  </h2>
                  <p className="text-sm">Lowest Battery</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("lowestSignal")}
                >
                  <h2 className="text-3xl font-bold">
                    {facility.lowestSignal}%
                  </h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border"
                  onClick={() => openSmartLockModal("offline")}
                >
                  <h2 className="text-3xl font-bold">
                    {facility.offlineCount}
                  </h2>
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
            title={facility?.edgeRouter?.connectionStatusMessage}
          >
            <RiRouterFill
              className={`w-14 h-14 rounded-full ${
                facility.edgeRouterStatus === "warning"
                  ? "text-yellow-500"
                  : facility.edgeRouterStatus === "error"
                  ? "text-red-500"
                  : "text-green-700"
              }`}
            />
            <div className="ml-3">
              <h2 className="text-2xl">{facility.edgeRouterName}</h2>
              <p className="text-sm">
                {new Date(
                  facility?.edgeRouter?.eventLastReceivedOn
                ).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-black dark:text-white mt-2">
            {facility.accessPoints?.map((accessPoint, index) => (
              <div
                className="shadow-md rounded-lg p-2 flex items-center border"
                key={index}
                title={accessPoint.connectionStatusMessage}
              >
                <RiRouterFill
                  className={`w-10 h-10 rounded-full ${
                    accessPoint.isDevicePaired === false
                      ? "text-yellow-500"
                      : accessPoint.isDeviceOffline === true
                      ? "text-red-500"
                      : "text-green-700"
                  }`}
                />
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
