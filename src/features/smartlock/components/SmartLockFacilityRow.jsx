import { useState } from "react";
import { FaCheckCircle, FaExternalLinkAlt } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import SmartLock from "../modals/SmartLock";
import PropTypes from "prop-types";

SmartLockFacilityRow.propTypes = {
  facility: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    edgeRouterStatus: PropTypes.string.isRequired,
    edgeRouterName: PropTypes.string.isRequired,
    onlineAccessPointsCount: PropTypes.number.isRequired,
    offlineAccessPointsCount: PropTypes.number.isRequired,
    smartLocks: PropTypes.arrayOf(PropTypes.object).isRequired,
    okCount: PropTypes.number.isRequired,
    warningCount: PropTypes.number.isRequired,
    errorCount: PropTypes.number.isRequired,
  }).isRequired,
  setExpandedRows: PropTypes.func.isRequired,
  expandedRows: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default function SmartLockFacilityRow({
  facility,
  setExpandedRows,
  expandedRows,
}) {
  const [isSmartlockModalOpen, setIsSmartlockModalOpen] = useState(false);
  const [smartlockModalOption, setSmartlockModalOption] = useState(null);

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

  return (
    <>
      <tr className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary border border-gray-300 dark:border-border">
        <td
          className="px-4 py-2 cursor-pointer"
          onClick={() => toggleRowExpansion(facility.id)}
        >
          <div className="flex items-center gap-2">
            <button className="text-blue-500" title="Expand/Collapse">
              {expandedRows.includes(facility.id) ? "−" : "+"}
            </button>
            <p className="truncate max-w-[20ch]">{facility.name}</p>
            <FaExternalLinkAlt
              className="text-blue-300 hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                const url =
                  facility.environment === "cia-stg-1.aws."
                    ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                    : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`;
                window.open(url, "_blank");
              }}
            />
          </div>
        </td>

        <td className="px-4 py-2" onClick={() => console.log(facility)}>
          <div className="inline-flex items-center gap-1 text-center">
            {facility.edgeRouterStatus === "error" ? (
              <IoIosWarning className="text-red-500 mr-2" />
            ) : facility.edgeRouterStatus === "warning" ? (
              <IoIosWarning className="text-yellow-500 mr-2" />
            ) : (
              <FaCheckCircle className="text-green-500 mr-2" />
            )}
            {facility.edgeRouterName}
          </div>
        </td>
        <td className="px-4 py-2 text-center">
          {facility.onlineAccessPointsCount}
        </td>
        <td className="px-4 py-2 text-center">
          {facility.offlineAccessPointsCount}
        </td>
        {facility.smartLocks.length > 1 ? (
          <>
            <td
              className="px-4 py-2 text-center cursor-pointer"
              onClick={() => openSmartLockModal("good")}
            >
              {facility.okCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer"
              onClick={() => openSmartLockModal("warning")}
            >
              {facility.warningCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer"
              onClick={() => openSmartLockModal("error")}
            >
              {facility.errorCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer"
              onClick={() => openSmartLockModal("offline")}
            >
              {facility.offlineCount}
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer"
              onClick={() => openSmartLockModal("lowestSignal")}
            >
              {facility.lowestSignal}%
            </td>
            <td
              className="px-4 py-2 text-center cursor-pointer"
              onClick={() => openSmartLockModal("lowestBattery")}
            >
              {facility.lowestBattery}%
            </td>
          </>
        ) : (
          <td colSpan={6}></td>
        )}
      </tr>

      {expandedRows.includes(facility.id) && (
        <tr>
          <td
            colSpan="10"
            className="bg-gray-100 dark:border-border dark:bg-darkNavPrimary p-5 border"
          >
            <div className="grid grid-cols-3">
              {/* Facility Info */}
              <div className="grid-cols-2 grid gap-2 text-left">
                <div>
                  <h2 className="font-bold dark:text-yellow-500">Facility</h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facility.facilityDetail?.name}
                  </p>
                  <h2 className="font-bold dark:text-yellow-500">
                    Property Number
                  </h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facility.facilityDetail?.propertyNumber || "null"}
                  </p>
                  <h2 className="font-bold dark:text-yellow-500">
                    Facility ID
                  </h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facility.facilityDetail?.id || "null"}
                  </p>
                </div>
                <div>
                  <h2 className="font-bold dark:text-yellow-500">Address</h2>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facility.facilityDetail?.addressLine1}{" "}
                    {facility.facilityDetail?.addressLine2}
                  </p>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facility.facilityDetail?.city}{" "}
                    {facility.facilityDetail?.state}
                  </p>
                  <p className="text-slate-600 dark:text-gray-200">
                    {facility.facilityDetail?.postalCode}{" "}
                    {facility.facilityDetail?.country}
                  </p>
                </div>
              </div>

              {/* Weather Info */}
              <div className="flex items-center justify-between text-slate-600">
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
                  <div className="text-sm text-slate-600 text-left ml-2 dark:text-gray-200">
                    <p>
                      Precipitation:{" "}
                      {facility.weather?.current?.precip_in.toFixed(1)}%
                    </p>
                    <p>
                      Humidity: {facility.weather?.current?.humidity.toFixed(1)}
                      %
                    </p>
                    <p>
                      Wind: {facility.weather?.current?.wind_mph.toFixed(1)} mph
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-2xl font-semibold text-black dark:text-yellow-500">
                    Weather
                  </h3>
                  <p className="text-sm dark:text-gray-200">
                    {facility.weather?.current?.last_updated}
                  </p>
                  <p className="text-sm dark:text-gray-200">
                    {facility.weather?.current?.condition?.text}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col items-center justify-center space-y-1">
                {facility.smartLocks?.length > 0 && (
                  <button
                    className="bg-gray-400 text-white px-2 py-1 rounded-sm font-bold w-2/3 hover:bg-gray-500 hover:cursor-pointer"
                    onClick={() => openSmartLockModal("")}
                  >
                    View all SmartLocks
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}

      {isSmartlockModalOpen && (
        <SmartLock
          smartlockModalOption={smartlockModalOption}
          smartLocks={facility.smartLocks || []} // optional
          facilityName={facility.name}
          setIsSmartlockModalOpen={setIsSmartlockModalOpen}
        />
      )}
    </>
  );
}
