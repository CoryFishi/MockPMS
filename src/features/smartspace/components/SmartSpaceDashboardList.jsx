import { useState } from "react";
import SmartSpaceFacilityRow from "@features/SmartSpace/components/SmartSpaceFacilityRow";

export default function SmartSpaceDashboardList({
  filteredFacilities,
  facilitiesWithBearers,
  setFilteredFacilities,
  totalSmartlocks,
  totalAccessPoints,
  totalEdgeRouters,
  edgeRouterOnlineCount,
  edgeRouterWarningCount,
  edgeRouterOfflineCount,
  accessPointsOnlineCount,
  accessPointsOfflineCount,
  smartlockOkayCount,
  smartlockWarningCount,
  smartlockErrorCount,
  smartlockOfflineCount,
  smartlockLowestSignal,
  smartlockLowestBattery,
  toggledSections,
  explicitSort,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedRows, setExpandedRows] = useState([]);

  const handleSort = (key) => {
    let nextDirection = "asc";

    if (sortKey === key) {
      if (sortDirection === "asc") nextDirection = "desc";
      else if (sortDirection === "desc") nextDirection = null;
    }

    setSortKey(nextDirection ? key : null);
    setSortDirection(nextDirection);

    if (!nextDirection) {
      setFilteredFacilities(facilitiesWithBearers);
      return;
    }

    const sorted = [...filteredFacilities].sort((a, b) => {
      const aVal = a[key] ?? 0;
      const bVal = b[key] ?? 0;

      if (typeof aVal === "string") {
        return nextDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return nextDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
    setFilteredFacilities(sorted);
  };

  return (
    <table className="w-full">
      <thead className="select-none">
        <tr className="bg-zinc-100 dark:bg-zinc-800">
          {toggledSections.openNet ||
          toggledSections.smartLock ||
          toggledSections.smartMotion ? (
            <th className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"></th>
          ) : null}
          {toggledSections.openNet && (
            <th
              className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
              colSpan="3"
            >
              OpenNet
            </th>
          )}
          {toggledSections.smartLock && (
            <th
              className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
              colSpan="6"
            >
              SmartLock
            </th>
          )}
          {toggledSections.smartMotion && (
            <th
              className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
              colSpan="6"
            >
              SmartMotion
            </th>
          )}
        </tr>
        <tr className="bg-zinc-100 dark:bg-zinc-800">
          {/* Facility Section */}
          {toggledSections.openNet ||
          toggledSections.smartLock ||
          toggledSections.smartMotion ? (
            <th
              onClick={() => handleSort("name")}
              className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
            >
              Facility{" "}
              {sortKey === "name" && (sortDirection === "asc" ? "▲" : "▼")}
            </th>
          ) : null}
          {/* OpenNet Section */}
          {toggledSections.openNet && (
            <>
              <th
                onClick={() => handleSort("edgeRouterStatus")}
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
              >
                Edge Router{" "}
                {sortKey === "edgeRouterStatus" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("onlineAccessPointsCount")}
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
              >
                Online APs{" "}
                {sortKey === "onlineAccessPointsCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("offlineAccessPointsCount")}
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
              >
                Offline APs{" "}
                {sortKey === "offlineAccessPointsCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
            </>
          )}
          {/* SmartLock Section */}
          {toggledSections.smartLock && (
            <>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("okCount")}
              >
                Okay{" "}
                {sortKey === "okCount" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("warningCount")}
              >
                Warning{" "}
                {sortKey === "warningCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("errorCount")}
              >
                Error{" "}
                {sortKey === "errorCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("offlineCount")}
              >
                Offline{" "}
                {sortKey === "offlineCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("lowestSignal")}
                className="cursor-pointer border border-zinc-300 dark:border-zinc-700 px-4 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-900"
              >
                Lowest Signal{" "}
                {sortKey === "lowestSignal" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("lowestBattery")}
                className="cursor-pointer border border-zinc-300 dark:border-zinc-700 px-4 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-900"
              >
                Lowest Battery{" "}
                {sortKey === "lowestBattery" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
            </>
          )}
          {/* SmartMotion Section */}
          {toggledSections.smartMotion && (
            <>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("okCount")}
              >
                Okay{" "}
                {sortKey === "okCount" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("warningCount")}
              >
                Warning{" "}
                {sortKey === "warningCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("errorCount")}
              >
                Error{" "}
                {sortKey === "errorCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-900"
                onClick={() => handleSort("offlineCount")}
              >
                Offline{" "}
                {sortKey === "offlineCount" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("lowestSignal")}
                className="cursor-pointer border border-zinc-300 dark:border-zinc-700 px-4 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-900"
              >
                Lowest Signal{" "}
                {sortKey === "lowestSignal" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("lowestBattery")}
                className="cursor-pointer border border-zinc-300 dark:border-zinc-700 px-4 py-2 hover:bg-zinc-300 dark:hover:bg-zinc-900"
              >
                Lowest Battery{" "}
                {sortKey === "lowestBattery" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {filteredFacilities.map((facility, index) => (
          <SmartSpaceFacilityRow
            facility={facility}
            index={index}
            setExpandedRows={setExpandedRows}
            expandedRows={expandedRows}
            key={index}
            toggledSections={toggledSections}
            explicitSort={explicitSort}
          />
        ))}
        <tr className="bg-zinc-100 dark:bg-zinc-800 text-center">
          {/* Facility Section */}
          {toggledSections.openNet ||
          toggledSections.smartLock ||
          toggledSections.smartMotion ? (
            <td
              className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 font-bold text-left"
              title={
                totalSmartlocks +
                " SmartLocks \n" +
                totalAccessPoints +
                " Access Points \n" +
                totalEdgeRouters +
                " Edge Routers"
              }
            >
              Totals:
            </td>
          ) : null}
          {/* OpenNet Section */}
          {toggledSections.openNet && (
            <>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={
                  Math.round((edgeRouterOnlineCount / totalEdgeRouters) * 100) +
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
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={
                  Math.round(
                    (accessPointsOnlineCount / totalAccessPoints) * 100
                  ) + "% Online"
                }
              >
                {accessPointsOnlineCount}
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={
                  Math.round(
                    (accessPointsOfflineCount / totalAccessPoints) * 100
                  ) + "% Offline"
                }
              >
                {accessPointsOfflineCount}
              </td>
            </>
          )}
          {/* SmartLock Section */}
          {toggledSections.smartLock && (
            <>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={
                  Math.round((smartlockOkayCount / totalSmartlocks) * 100) +
                  "% Okay Status"
                }
              >
                {smartlockOkayCount}
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={
                  Math.round((smartlockWarningCount / totalSmartlocks) * 100) +
                  "% Warning Status"
                }
              >
                {smartlockWarningCount}
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={
                  Math.round((smartlockErrorCount / totalSmartlocks) * 100) +
                  "% Error Status"
                }
              >
                {smartlockErrorCount}
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={
                  Math.round((smartlockOfflineCount / totalSmartlocks) * 100) +
                  "% Offline"
                }
              >
                {smartlockOfflineCount}
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={smartlockLowestSignal.facility}
              >
                {smartlockLowestSignal.lowestSignal}%
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={smartlockLowestBattery.facility}
              >
                {smartlockLowestBattery.lowestBattery}%
              </td>
            </>
          )}
          {/* Smart Motion Section */}
          {toggledSections.smartMotion && (
            <>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={"-"}
              >
                -
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={"-"}
              >
                -
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={"-"}
              >
                -
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={"-"}
              >
                -
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={"-"}
              >
                -
              </td>
              <td
                className="border border-zinc-300 dark:border-zinc-700 px-4 py-2"
                title={"-"}
              >
                -
              </td>
            </>
          )}
        </tr>
      </tbody>
    </table>
  );
}
