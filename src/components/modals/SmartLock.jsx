import axios from "axios";
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { FaWarehouse } from "react-icons/fa6";

export default function SmartLock({
  smartlockModalOption,
  smartLocks,
  facilityName,
  setIsSmartlockModalOpen,
}) {
  const [filteredSmartLocks, setFilteredSmartLocks] = useState(smartLocks);
  const [option, setOption] = useState(smartlockModalOption);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    var sortedSmartLocks = [...smartLocks].sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      return 0;
    });
    switch (option) {
      case "good":
        sortedSmartLocks = sortedSmartLocks.filter(
          (lock) => lock.overallStatus === "ok"
        );
        break;
      case "warning":
        sortedSmartLocks = sortedSmartLocks.filter(
          (lock) => lock.overallStatus === "warning"
        );
        break;
      case "error":
        sortedSmartLocks = sortedSmartLocks.filter(
          (lock) => lock.overallStatus === "error"
        );
        break;
      case "lowestSignal":
        const lowestSignalStrength = sortedSmartLocks.reduce((lowest, lock) => {
          return lock.signalQuality < lowest ? lock.signalQuality : lowest;
        }, sortedSmartLocks[0].signalQuality);

        sortedSmartLocks = sortedSmartLocks.filter(
          (lock) => lock.signalQuality === lowestSignalStrength
        );
        break;
      case "lowestBattery":
        const lowestBatteryLevel = sortedSmartLocks.reduce((lowest, lock) => {
          return lock.batteryLevel < lowest ? lock.batteryLevel : lowest;
        }, sortedSmartLocks[0].batteryLevel);

        sortedSmartLocks = sortedSmartLocks.filter(
          (lock) => lock.batteryLevel === lowestBatteryLevel
        );
        break;
      case "offline":
        sortedSmartLocks = sortedSmartLocks.filter(
          (lock) => lock.isDeviceOffline === true
        );
        break;
      default:
        break;
    }

    const filteredSmartLocks = sortedSmartLocks.filter(
      (smartlock) =>
        (smartlock.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (smartlock.unitName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (smartlock.deviceType || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(smartlock.batteryLevel || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(Math.round((smartlock.signalQuality / 255) * 100) || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (Array.isArray(smartlock.statusMessages) &&
          smartlock.statusMessages.some((message) =>
            (message || "").toLowerCase().includes(searchQuery.toLowerCase())
          ))
    );
    setFilteredSmartLocks(filteredSmartLocks);
  }, [smartLocks, option, searchQuery]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded shadow-lg text-black relative max-h-[95vh] w-full max-w-[95vw] dark:text-white dark:bg-darkPrimary">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center">
          <div className="flex text-center items-center">
            <FaWarehouse />
            <h2 className="ml-2 text-lg font-bold text-center items-center">
              {facilityName}'s SmartLocks
            </h2>
          </div>

          <button
            className="right-1 text-black hover:bg-red-500 text-2xl my-2 mr-3 px-2 rounded-full dark:text-white dark:hover:bg-red-500"
            onClick={() => setIsSmartlockModalOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className="p-5">
          {option && (
            <p
              className="text-right text-blue-500 pr-10 hover:cursor-pointer hover:text-blue-900"
              onClick={() => setOption(null)}
            >
              clear filter
            </p>
          )}
          <input
            type="text"
            placeholder="Search SmartLocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
          />
          <div className="max-h-[75vh] overflow-y-auto text-center">
            <table className="w-full table-auto border-collapse border border-gray-300 dark:border-border">
              <thead>
                <tr className="bg-gray-200 dark:bg-darkNavSecondary sticky top-[-1px] z-10">
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (a.name.toLowerCase() < b.name.toLowerCase())
                            return -1;
                          if (a.name.toLowerCase() > b.name.toLowerCase())
                            return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Name
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (
                            a.unitName.toLowerCase() < b.unitName.toLowerCase()
                          )
                            return -1;
                          if (
                            a.unitName.toLowerCase() > b.unitName.toLowerCase()
                          )
                            return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Unit
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (
                            a.deviceType.toLowerCase() <
                            b.deviceType.toLowerCase()
                          )
                            return -1;
                          if (
                            a.deviceType.toLowerCase() >
                            b.deviceType.toLowerCase()
                          )
                            return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Device Type
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (a.signalQuality < b.signalQuality) return -1;
                          if (a.signalQuality > b.signalQuality) return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Signal Quality
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (a.batteryLevel < b.batteryLevel) return -1;
                          if (a.batteryLevel > b.batteryLevel) return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Battery Level
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (
                            a.lockState.toLowerCase() <
                            b.lockState.toLowerCase()
                          )
                            return -1;
                          if (
                            a.lockState.toLowerCase() >
                            b.lockState.toLowerCase()
                          )
                            return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Lock State
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (
                            a.unitStatus.toLowerCase() <
                            b.unitStatus.toLowerCase()
                          )
                            return -1;
                          if (
                            a.unitStatus.toLowerCase() >
                            b.unitStatus.toLowerCase()
                          )
                            return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Unit Details
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (
                            a.overallStatusMessage.toLowerCase() <
                            b.overallStatusMessage.toLowerCase()
                          )
                            return -1;
                          if (
                            a.overallStatusMessage.toLowerCase() >
                            b.overallStatusMessage.toLowerCase()
                          )
                            return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Lock Status Message
                  </th>
                  <th
                    className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer"
                    onClick={() =>
                      setFilteredSmartLocks(
                        [...filteredSmartLocks].sort((a, b) => {
                          if (a.lastUpdateTimestamp < b.lastUpdateTimestamp)
                            return -1;
                          if (a.lastUpdateTimestamp > b.lastUpdateTimestamp)
                            return 1;
                          return 0;
                        })
                      )
                    }
                  >
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSmartLocks.map((smartlock, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
                  >
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.name}
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.unitName}
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.deviceType}
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {Math.round((smartlock.signalQuality / 255) * 100)}%
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.batteryLevel}%
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.lockState}
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.unitStatus}
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.statusMessages}
                    </td>
                    <td className="border border-gray-300 dark:border-border px-4 py-2">
                      {smartlock.lastUpdateTimestampDisplay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
