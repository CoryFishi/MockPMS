import { useState } from "react";
import SmartLock from "@features/smartlock/modals/SmartLock";
import { RiRouterFill } from "react-icons/ri";
import SmartLockDetailModal from "@components/shared/DetailModal";
import { IoMdArrowDropdown, IoMdArrowDropup } from "react-icons/io";

export default function SmartLockFacilityCard({ facility }) {
  const [isSmartlockModalOpen, setIsSmartlockModalOpen] = useState(false);
  const [smartlockModalOption, setSmartlockModalOption] = useState(null);
  const [selectedRouter, setSelectedRouter] = useState(null);
  const [isSmartlockSectionOpen, setIsSmartlockSectionOpen] = useState(true);
  const [isOpenNetSectionOpen, setIsOpenNetSectionOpen] = useState(true);
  const [isCardShown, setIsCardShown] = useState(true);

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
      {selectedRouter && (
        <SmartLockDetailModal
          onClose={() => setSelectedRouter(null)}
          lock={selectedRouter}
        />
      )}

      {facility && (
        <div className="break-inside-avoid bg-white shadow-lg rounded-lg p-5 mb-4 border dark:bg-zinc-900 text-black dark:text-white dark:border-zinc-700">
          <h1
            className="break-all w-full text-2xl cursor-pointer flex items-center"
            onClick={() => setIsCardShown(!isCardShown)}
            title={`${isCardShown ? "Collapse " : "Expand "}${facility.name}`}
          >
            {isCardShown ? <IoMdArrowDropdown /> : <IoMdArrowDropup />}{" "}
            {facility.name}
          </h1>
          {isCardShown && (
            <>
              {facility.smartLocks.length > 0 && (
                <>
                  <h2
                    className="w-full border-b-2 mb-2 border-yellow-400 text-black dark:text-white text-lg mt-2 select-none flex gap-2 items-center cursor-pointer"
                    onClick={() =>
                      setIsSmartlockSectionOpen(!isSmartlockSectionOpen)
                    }
                  >
                    {isSmartlockSectionOpen ? (
                      <IoMdArrowDropdown />
                    ) : (
                      <IoMdArrowDropup />
                    )}{" "}
                    SmartLocks:{" "}
                    <p
                      className="text-xs text-zinc-400 cursor-pointer "
                      onClick={(e) => {
                        e.stopPropagation();
                        openSmartLockModal();
                      }}
                      title="Click to view all smart locks"
                    >
                      view all smartlocks
                    </p>
                  </h2>
                  {isSmartlockSectionOpen && (
                    <div className="grid grid-cols-3 grid-rows-2 gap-4 text-black dark:text-white">
                      <div
                        className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border dark:border-zinc-700 hover:scale-105 transition-transform duration-300"
                        onClick={() => openSmartLockModal("good")}
                      >
                        <h2 className="text-3xl font-bold">
                          {facility.okCount}
                        </h2>
                        <p className="text-sm">Good</p>
                      </div>
                      <div
                        className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border dark:border-zinc-700 hover:scale-105 transition-transform duration-300"
                        onClick={() => openSmartLockModal("warning")}
                      >
                        <h2 className="text-3xl font-bold">
                          {facility.warningCount}
                        </h2>
                        <p className="text-sm">Warning</p>
                      </div>
                      <div
                        className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border dark:border-zinc-700 hover:scale-105 transition-transform duration-300"
                        onClick={() => openSmartLockModal("error")}
                      >
                        <h2 className="text-3xl font-bold">
                          {facility.errorCount}
                        </h2>
                        <p className="text-sm">Error</p>
                      </div>
                      <div
                        className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border dark:border-zinc-700 hover:scale-105 transition-transform duration-300"
                        onClick={() => openSmartLockModal("lowestBattery")}
                      >
                        <h2 className="text-3xl font-bold">
                          {facility.lowestBattery}%
                        </h2>
                        <p className="text-sm">Lowest Battery</p>
                      </div>
                      <div
                        className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border dark:border-zinc-700 hover:scale-105 transition-transform duration-300"
                        onClick={() => openSmartLockModal("lowestSignal")}
                      >
                        <h2 className="text-3xl font-bold">
                          {facility.lowestSignal}%
                        </h2>
                        <p className="text-sm">Lowest Signal</p>
                      </div>
                      <div
                        className="text-center shadow-md rounded-lg p-3 hover:cursor-pointer border dark:border-zinc-700 hover:scale-105 transition-transform duration-300"
                        onClick={() => openSmartLockModal("offline")}
                      >
                        <h2 className="text-3xl font-bold">
                          {facility.offlineCount}
                        </h2>
                        <p className="text-sm">Offline</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              <h2
                className="w-full border-b-2 mb-2 border-yellow-400 text-black dark:text-white text-lg mt-2 select-none cursor-pointer flex items-center"
                onClick={() => setIsOpenNetSectionOpen(!isOpenNetSectionOpen)}
              >
                {isOpenNetSectionOpen ? (
                  <IoMdArrowDropdown />
                ) : (
                  <IoMdArrowDropup />
                )}{" "}
                OpenNet:
              </h2>
              {isOpenNetSectionOpen && (
                <>
                  <div
                    className="shadow-md rounded-lg p-2 flex items-center text-black dark:text-white border dark:border-zinc-700 cursor-pointer hover:scale-105 transition-transform duration-300"
                    title={facility?.edgeRouter?.connectionStatusMessage}
                    onClick={() => setSelectedRouter(facility.edgeRouter)}
                  >
                    <RiRouterFill
                      className={`w-14 h-14 rounded-full ${
                        facility.edgeRouterStatus === "warning"
                          ? "text-yellow-500"
                          : facility.edgeRouterStatus === "error"
                          ? "text-red-500"
                          : "text-green-600"
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
                        className="shadow-md rounded-lg p-2 flex items-center border dark:border-zinc-700 cursor-pointer hover:scale-105 transition-transform duration-300"
                        key={index}
                        title={accessPoint.connectionStatusMessage}
                        onClick={() => setSelectedRouter(accessPoint)}
                      >
                        <RiRouterFill
                          className={`w-10 h-10 rounded-full ${
                            accessPoint.isDevicePaired === false
                              ? "text-yellow-500"
                              : accessPoint.isDeviceOffline === true
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        />
                        <div className="ml-3">
                          <h2 className="text-xl">{accessPoint.name}</h2>
                          <p className="text-sm">
                            {new Date(
                              accessPoint.lastUpdateTimestamp
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
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
