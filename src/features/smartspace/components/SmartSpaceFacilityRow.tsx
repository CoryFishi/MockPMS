import { useState } from "react";
import { FaCheckCircle, FaExternalLinkAlt, FaWalking } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import SmartLockModal from "@features/smartspace/modals/SmartLockModal";
import SmartMotionModal from "@features/smartspace/modals/SmartMotionModal";
import AccessPointModal from "@features/smartspace/modals/AccessPointModal";
import DetailModal from "@components/shared/DetailModal";
import { BiLock } from "react-icons/bi";
import { BsController, BsLockFill } from "react-icons/bs";
import { TiWiFi } from "react-icons/ti";
import { GiControlTower } from "react-icons/gi";
import { CgController } from "react-icons/cg";

export default function SmartSpaceFacilityRow({
  facility,
  setExpandedRows,
  expandedRows,
  toggledSections,
  explicitSort,
}) {
  const [isSmartlockModalOpen, setIsSmartlockModalOpen] = useState(false);
  const [smartlockModalOption, setSmartlockModalOption] = useState(null);
  const [isSmartMotionModalOpen, setIsSmartMotionModalOpen] = useState(false);
  const [smartMotionModalOption, setSmartMotionModalOption] = useState(null);
  const [isAccessPointModalOpen, setIsAccessPointModalOpen] = useState(false);
  const [accessPointModalOption, setAccessPointModalOption] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEdgeRouter, setSelectedEdgeRouter] = useState(null);

  const toggleRowExpansion = (facilityId) => {
    setExpandedRows((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const openSmartLockModal = (option) => {
    if (!isSmartlockModalOpen) {
      setSmartlockModalOption(option);
      setIsSmartlockModalOpen(true);
    }
  };
  const openSmartMotionModal = (option) => {
    if (!isSmartMotionModalOpen) {
      setSmartMotionModalOption(option);
      setIsSmartMotionModalOpen(true);
    }
  };

  const openAccessPointModal = (option) => {
    if (!isAccessPointModalOpen) {
      setAccessPointModalOption(option);
      setIsAccessPointModalOpen(true);
    }
  };

  const openDetailModal = (edgeRouter) => {
    setSelectedEdgeRouter(edgeRouter);
    setIsDetailModalOpen(true);
  };

  // If no edge router data, do not render the row
  // or if all toggled sections are false, do not render the row
  if (
    Object.keys(facility.edgeRouter).length === 0 ||
    (toggledSections.openNet === false &&
      toggledSections.smartLock === false &&
      toggledSections.smartMotion === false)
  ) {
    return null;
  }

  // If explicit sort is enabled, and smart motion is selected do not render the row when there are no smart motion devices
  if (
    facility.smartMotion.length < 1 &&
    !toggledSections.smartLock &&
    toggledSections.smartMotion &&
    explicitSort
  ) {
    return null;
  }

  // If explicit sort is enabled, and smart lock is selected do not render the row when there are no smart lock devices
  if (
    facility.smartLocks.length < 1 &&
    !toggledSections.smartMotion &&
    toggledSections.smartLock &&
    explicitSort
  ) {
    return null;
  }

  return (
    <>
      <tr className="hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
        {/* Facility Name and Expand/Collapse */}
        {toggledSections.openNet ||
        toggledSections.smartLock ||
        toggledSections.smartMotion ? (
          <td
            className="px-4 py-2 cursor-pointer"
            onClick={() => toggleRowExpansion(facility.id)}
          >
            <div
              className="flex items-center gap-2"
              title={expandedRows.includes(facility.id) ? "Collapse" : "Expand"}
            >
              <button className="text-blue-500 cursor-pointer">
                {expandedRows.includes(facility.id) ? "−" : "+"}
              </button>
              <p className="truncate max-w-[20ch]">{facility.name}</p>
              <FaExternalLinkAlt
                className="hover:text-blue-300 text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  const url =
                    facility.environment === "staging"
                      ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                      : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`;
                  window.open(url, "_blank");
                }}
                title={
                  facility.environment === "staging"
                    ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                    : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`
                }
              />
            </div>
          </td>
        ) : null}
        {/* OpenNet Section */}
        {toggledSections.openNet && (
          <>
            <td className="px-4 py-2 border-l border-zinc-300 dark:border-zinc-700">
              <div
                className="inline-flex items-center gap-1 text-center justify-center w-full cursor-pointer hover:underline"
                onClick={() => openDetailModal(facility.edgeRouter)}
              >
                {facility.edgeRouterStatus === "error" ? (
                  <IoIosWarning className="text-red-500 mr-2 min-w-5" />
                ) : facility.edgeRouterStatus === "warning" ? (
                  <IoIosWarning className="text-yellow-500 mr-2 min-w-5" />
                ) : (
                  <FaCheckCircle className="text-green-500 mr-2 min-w-5" />
                )}
                {facility.edgeRouterName}
              </div>
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              onClick={() => openAccessPointModal("online")}
            >
              {facility.onlineAccessPointsCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              onClick={() => openAccessPointModal("offline")}
            >
              {facility.offlineAccessPointsCount}
            </td>
          </>
        )}
        {toggledSections.smartLock && facility.smartLocks.length > 0 ? (
          <>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline border-l border-zinc-300 dark:border-zinc-700"
              onClick={() => openSmartLockModal("good")}
              title="Click to view Okay SmartLocks"
            >
              {facility.okCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              onClick={() => openSmartLockModal("warning")}
              title="Click to view Warning SmartLocks"
            >
              {facility.warningCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              onClick={() => openSmartLockModal("error")}
              title="Click to view Error SmartLocks"
            >
              {facility.errorCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              onClick={() => openSmartLockModal("offline")}
              title="Click to view Offline SmartLocks"
            >
              {facility.offlineCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              onClick={() => openSmartLockModal("lowestSignal")}
              title="Click to view SmartLocks with Lowest Signal"
            >
              {facility.lowestSignal}%
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              onClick={() => openSmartLockModal("lowestBattery")}
              title="Click to view SmartLocks with Lowest Battery"
            >
              {facility.lowestBattery}%
            </td>
          </>
        ) : toggledSections.smartLock ? (
          <td
            className="border-l border-zinc-300 dark:border-zinc-700"
            colSpan={toggledSections.smartLock ? 6 : 0}
          ></td>
        ) : null}
        {toggledSections.smartMotion && facility.smartMotion.length > 0 ? (
          <>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline border-l border-zinc-300 dark:border-zinc-700"
              title="Click to view Okay SmartMotion devices"
              onClick={() => openSmartMotionModal("good")}
            >
              {facility.smartMotionOkayCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              title="Click to view Warning SmartMotion devices"
              onClick={() => openSmartMotionModal("warning")}
            >
              {facility.smartMotionWarningCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              title="Click to view Error SmartMotion devices"
              onClick={() => openSmartMotionModal("error")}
            >
              {facility.smartMotionErrorCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              title="Click to view Offline SmartMotion devices"
              onClick={() => openSmartMotionModal("offline")}
            >
              {facility.smartMotionOfflineCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              title="Click to view SmartMotion devices with Lowest Signal"
              onClick={() => openSmartMotionModal("lowestSignal")}
            >
              {facility.smartMotionLowestSignal}%
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer hover:underline"
              title="Click to view SmartMotion devices with Lowest Battery"
              onClick={() => openSmartMotionModal("lowestBattery")}
            >
              {facility.smartMotionLowestBattery}%
            </td>
          </>
        ) : (
          <td
            colSpan={toggledSections.smartMotion ? 6 : 0}
            className="border-l border-zinc-300 dark:border-zinc-700"
          ></td>
        )}
      </tr>

      {expandedRows.includes(facility.id) && (
        <tr>
          <td
            colSpan={16}
            className="bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 p-5 border"
          >
            <div className="grid grid-cols-3">
              {/* Facility Info */}
              <div className="grid-cols-2 grid gap-2 text-left">
                <div>
                  <h2 className="font-bold dark:text-yellow-500">Facility</h2>
                  <p className="text-zinc-600 dark:text-zinc-200">
                    {facility.facilityDetail?.name ?? "name"}
                  </p>
                  <h2 className="font-bold dark:text-yellow-500">
                    Property Number
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-200">
                    {facility.facilityDetail?.propertyNumber ??
                      "property number"}
                  </p>
                  <h2 className="font-bold dark:text-yellow-500">
                    Facility ID
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-200">
                    {facility.facilityDetail?.id ?? "facility id"}
                  </p>
                </div>
                <div>
                  <h2 className="font-bold dark:text-yellow-500">Address</h2>
                  <p className="text-zinc-600 dark:text-zinc-200">
                    {facility.facilityDetail?.addressLine1 ?? "address line 1"}{" "}
                    {facility.facilityDetail?.addressLine2 ?? ""}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-200">
                    {facility.facilityDetail?.city ?? "city"}{" "}
                    {facility.facilityDetail?.state ?? "state"}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-200">
                    {facility.facilityDetail?.postalCode ?? "postal code"}{" "}
                    {facility.facilityDetail?.country ?? "country"}
                  </p>
                </div>
              </div>

              {/* Weather Info */}
              {facility.weather ? (
                <div className="flex items-center justify-between text-zinc-600">
                  <div className="flex items-center">
                    <img
                      src={facility.weather?.current?.condition?.icon}
                      alt="Weather Icon"
                      className="w-16 h-16"
                    />
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black dark:text-white">
                        {Math.round(facility.weather?.current?.temp_f)}
                      </span>
                      <span className="text-xl font-light dark:text-yellow-500">
                        °F
                      </span>
                    </div>
                    <div className="text-sm text-zinc-600 text-left ml-2 dark:text-zinc-200">
                      <p>
                        Precipitation:{" "}
                        {facility.weather?.current?.precip_in.toFixed(1)}%
                      </p>
                      <p>
                        Humidity:{" "}
                        {facility.weather?.current?.humidity.toFixed(1)}%
                      </p>
                      <p>
                        Wind: {facility.weather?.current?.wind_mph.toFixed(1)}{" "}
                        mph
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-semibold text-black dark:text-yellow-500">
                      Weather
                    </h3>
                    <p className="text-sm dark:text-zinc-200">
                      {facility.weather?.current?.last_updated}
                    </p>
                    <p className="text-sm dark:text-zinc-200">
                      {facility.weather?.current?.condition?.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div>No weather data available</div>
              )}

              {/* Action Button */}
              <div className="flex flex-col items-center justify-center space-y-1">
                {facility.accessPoints?.length > 0 && (
                  <button
                    className="bg-zinc-400 text-white px-2 py-1 rounded-sm flex items-center justify-center gap-2 font-bold w-2/3 hover:bg-zinc-500 cursor-pointer"
                    onClick={() => openDetailModal(facility.edgeRouter)}
                  >
                    <CgController /> View Edge Router
                  </button>
                )}
                {facility.accessPoints?.length > 0 && (
                  <button
                    className="bg-zinc-400 text-white px-2 py-1 rounded-sm flex items-center justify-center gap-2 font-bold w-2/3 hover:bg-zinc-500 cursor-pointer"
                    onClick={() => openAccessPointModal("")}
                  >
                    <TiWiFi /> View all AccessPoints
                  </button>
                )}
                {facility.smartLocks?.length > 0 && (
                  <button
                    className="bg-zinc-400 text-white px-2 py-1 rounded-sm flex items-center justify-center gap-2 font-bold w-2/3 hover:bg-zinc-500 cursor-pointer"
                    onClick={() => openSmartLockModal("")}
                  >
                    <BsLockFill /> View all SmartLocks
                  </button>
                )}
                {facility.smartMotion?.length > 0 && (
                  <button
                    className="bg-zinc-400 text-white px-2 py-1 rounded-sm flex items-center justify-center gap-2 font-bold w-2/3 hover:bg-zinc-500 cursor-pointer"
                    onClick={() => openSmartMotionModal("")}
                  >
                    <FaWalking /> View all SmartMotion
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}

      {isSmartlockModalOpen && (
        <SmartLockModal
          smartlockModalOption={smartlockModalOption}
          smartLocks={facility.smartLocks || []}
          facilityName={facility.name}
          setIsSmartlockModalOpen={setIsSmartlockModalOpen}
        />
      )}
      {isSmartMotionModalOpen && (
        <SmartMotionModal
          smartMotionModalOption={smartMotionModalOption}
          smartMotion={facility.smartMotion || []}
          facilityName={facility.name}
          setIsSmartMotionModalOpen={setIsSmartMotionModalOpen}
        />
      )}
      {isAccessPointModalOpen && (
        <AccessPointModal
          accessPointModalOption={accessPointModalOption}
          accessPoints={facility.accessPoints || []}
          facilityName={facility.name}
          setIsAccessPointModalOpen={setIsAccessPointModalOpen}
        />
      )}
      {isDetailModalOpen && (
        <DetailModal
          device={selectedEdgeRouter}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </>
  );
}
