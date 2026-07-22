import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FaLock } from "react-icons/fa";
import SmartSpaceFacilityCard from "@views/smartspace/dashboard/SmartSpaceFacilityCard";
import SmartSpaceExport from "@views/smartspace/dashboard/SmartSpaceExport";
import { useAuth } from "@context/AuthProvider";
import SmartSpaceDashboardList from "@views/smartspace/dashboard/SmartSpaceDashboardList";
import InputBox from "@components/ui/InputBox";
import SliderButton from "@components/ui/SliderButton";
import { useFacilityStatusQueries, FACILITY_QUERY_KEY } from "@hooks/smartspace";

export default function SmartSpaceDashboardView() {
  const { selectedTokens, getBearerToken } = useAuth();
  const queryClient = useQueryClient();
  const { loaded, pending, errored, lastUpdatedAt } = useFacilityStatusQueries(
    selectedTokens,
    getBearerToken
  );

  // Sorted stable copy of loaded facilities (most smartlocks first), the
  // source list for search and for the List's sort-reset.
  const loadedFacilities = useMemo(
    () =>
      [...loaded].sort(
        (a, b) => (b.smartLocks?.length || 0) - (a.smartLocks?.length || 0)
      ),
    [loaded]
  );

  const [filteredFacilities, setFilteredFacilities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listView, setListView] = useState(
    JSON.parse(localStorage.getItem("smartSpaceListView")) || true
  );
  const [toggledSections, setToggledSections] = useState(
    JSON.parse(localStorage.getItem("smartSpaceToggledSections")) || {
      openNet: true,
      smartLock: true,
      smartMotion: true,
    }
  );
  const [explicitSort, setExplicitSort] = useState<boolean>(
    JSON.parse(localStorage.getItem("smartSpaceExplicit")) || false
  );
  // Search via search bar and button
  const search = useCallback((query: string) => {
    const trimmed = query.trim().toLowerCase();
    const results = loadedFacilities.filter((facility) => {
      const searchableFields = [
        facility.id?.toString(),
        facility.name,
        facility.propertyNumber,
        facility.environment,
        facility.facilityDetail?.addressLine1,
        facility.facilityDetail?.city,
        facility.facilityDetail?.postalCode,
      ];

      return searchableFields.some((field) =>
        field?.toString().toLowerCase().includes(trimmed)
      );
    });
    setFilteredFacilities(results);
  }, [loadedFacilities]);
  // Toggle view - list or card
  const toggleListView = () => {
    setListView(!listView);
    localStorage.setItem("smartSpaceListView", !listView ? "true" : "false");
  };

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      search(searchQuery);
    } else {
      setFilteredFacilities(loadedFacilities);
    }
  }, [searchQuery, loadedFacilities, search]);

  const totals = useMemo(() => {
    const t = {
      totalAccessPoints: 0,
      totalEdgeRouters: 0,
      totalSmartlocks: 0,
      totalSmartMotion: 0,
      edgeRouterOfflineCount: 0,
      edgeRouterOnlineCount: 0,
      edgeRouterWarningCount: 0,
      accessPointsOnlineCount: 0,
      accessPointsOfflineCount: 0,
      smartlockOkayCount: 0,
      smartlockWarningCount: 0,
      smartlockErrorCount: 0,
      smartlockOfflineCount: 0,
      smartlockLowestSignal: { lowestSignal: 100 as any, facility: "N/A" },
      smartlockLowestBattery: { lowestBattery: 100 as any, facility: "N/A" },
      smartMotionOkayCount: 0,
      smartMotionWarningCount: 0,
      smartMotionErrorCount: 0,
      smartMotionOfflineCount: 0,
      smartMotionLowestSignal: { lowestSignal: 100 as any, facility: "N/A" },
      smartMotionLowestBattery: { lowestBattery: 100 as any, facility: "N/A" },
    };

    // Mirrors the row-hiding rules in SmartSpaceFacilityRow so totals match
    // what is actually rendered.
    const hiddenByExplicitSort = (facility: any) =>
      (facility.smartMotion.length < 1 &&
        !toggledSections.smartLock &&
        toggledSections.smartMotion &&
        explicitSort) ||
      (facility.smartLocks.length < 1 &&
        !toggledSections.smartMotion &&
        toggledSections.smartLock &&
        explicitSort);

    for (const facility of filteredFacilities) {
      if (hiddenByExplicitSort(facility)) continue;

      t.totalEdgeRouters += 1;
      t.edgeRouterOfflineCount += facility.edgeRouterStatus === "error" ? 1 : 0;
      t.edgeRouterOnlineCount += facility.edgeRouterStatus === "ok" ? 1 : 0;
      t.edgeRouterWarningCount += facility.edgeRouterStatus === "warning" ? 1 : 0;
      t.accessPointsOnlineCount += facility.onlineAccessPointsCount;
      t.accessPointsOfflineCount += facility.offlineAccessPointsCount;
      t.totalAccessPoints +=
        facility.onlineAccessPointsCount + facility.offlineAccessPointsCount;

      if (Array.isArray(facility.smartLocks) && facility.smartLocks.length > 0) {
        t.totalSmartlocks +=
          facility.okCount + facility.warningCount + facility.errorCount;
        t.smartlockOkayCount += facility.okCount || 0;
        t.smartlockWarningCount += facility.warningCount || 0;
        t.smartlockErrorCount += facility.errorCount || 0;
        t.smartlockOfflineCount += facility.offlineCount || 0;

        const signal = parseInt(facility.lowestSignal);
        const battery = parseInt(facility.lowestBattery);
        if (signal < parseInt(t.smartlockLowestSignal.lowestSignal)) {
          t.smartlockLowestSignal = { lowestSignal: signal, facility: facility.name };
        }
        if (battery < parseInt(t.smartlockLowestBattery.lowestBattery)) {
          t.smartlockLowestBattery = { lowestBattery: battery, facility: facility.name };
        }
      }

      if (Array.isArray(facility.smartMotion) && facility.smartMotion.length > 0) {
        t.totalSmartMotion +=
          facility.smartMotionOkayCount +
          facility.smartMotionWarningCount +
          facility.smartMotionErrorCount;
        t.smartMotionOkayCount += facility.smartMotionOkayCount || 0;
        t.smartMotionWarningCount += facility.smartMotionWarningCount || 0;
        t.smartMotionErrorCount += facility.smartMotionErrorCount || 0;
        t.smartMotionOfflineCount += facility.smartMotionOfflineCount || 0;

        const signal = parseInt(facility.smartMotionLowestSignal);
        const battery = parseInt(facility.smartMotionLowestBattery);
        if (signal < parseInt(t.smartMotionLowestSignal.lowestSignal)) {
          t.smartMotionLowestSignal = { lowestSignal: signal, facility: facility.name };
        }
        if (battery < parseInt(t.smartMotionLowestBattery.lowestBattery)) {
          t.smartMotionLowestBattery = { lowestBattery: battery, facility: facility.name };
        }
      }
    }
    return t;
  }, [filteredFacilities, toggledSections, explicitSort]);

  const {
    totalAccessPoints,
    totalEdgeRouters,
    totalSmartlocks,
    totalSmartMotion,
    edgeRouterOfflineCount,
    edgeRouterOnlineCount,
    edgeRouterWarningCount,
    accessPointsOnlineCount,
    accessPointsOfflineCount,
    smartlockOkayCount,
    smartlockWarningCount,
    smartlockErrorCount,
    smartlockOfflineCount,
    smartlockLowestSignal,
    smartlockLowestBattery,
    smartMotionOkayCount,
    smartMotionWarningCount,
    smartMotionErrorCount,
    smartMotionOfflineCount,
    smartMotionLowestSignal,
    smartMotionLowestBattery,
  } = totals;

  return (
    <div className="relative overflow-auto h-full dark:text-white dark:bg-zinc-900">
      {/* tab title */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-zinc-700 dark:bg-zinc-950">
        <div className="ml-5 flex items-center text-sm">
          <FaLock className="text-lg" />
          &ensp; SmartSpace Dashboard
        </div>
      </div>
      {pending.length > 0 && (
        <div className="mx-5 mt-3 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="h-2 flex-1 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full bg-yellow-500 transition-all duration-500"
              style={{
                width: `${
                  ((selectedTokens.length - pending.length) /
                    Math.max(selectedTokens.length, 1)) *
                  100
                }%`,
              }}
            />
          </div>
          <span className="whitespace-nowrap">
            {selectedTokens.length - pending.length} of {selectedTokens.length} facilities loaded
          </span>
        </div>
      )}
      <div className="mt-5 mb-2 flex items-center justify-end text-center mx-5">
        {/* Search Bar */}

        <InputBox
          type="text"
          placeholder="Search facilities..."
          onchange={(e) => {
            const value = e.target.value;
            setSearchQuery(value);
            search(value);
          }}
          value={searchQuery}
        />

        {lastUpdatedAt > 0 && (
          <span className="mr-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            Last updated {new Date(lastUpdatedAt).toLocaleTimeString()}
          </span>
        )}
        <button
          className="bg-zinc-500 text-white p-1 py-2 rounded-sm hover:bg-zinc-600 ml-3 w-28 font-bold cursor-pointer hover:transition hover:duration-300 hover:ease-in-out"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: [FACILITY_QUERY_KEY] })
          }
        >
          Refresh All
        </button>

        {/* Toggle view button */}
        <button
          className="bg-yellow-500 text-white p-1 py-2 rounded-sm hover:bg-yellow-600 ml-3 w-44 font-bold cursor-pointer hover:transition hover:duration-300 hover:ease-in-out"
          onClick={() => toggleListView()}
        >
          {listView ? "Card View" : "List View"}
        </button>
      </div>
      <div className="mt-2 mb-2 flex items-center justify-between text-center mx-5">
        <div className="flex gap-3 items-center text-center">
          <div className="flex gap-1 items-center">
            <label htmlFor="toggleOpenNetView">Explicit</label>
            <SliderButton
              onclick={() => {
                setExplicitSort(!explicitSort);
                localStorage.setItem("smartSpaceExplicit", !explicitSort ? "true" : "false");
              }}
              value={explicitSort}
            />
          </div>
        </div>
        <div className="flex gap-3 items-center justify-end text-center">
          <div className="flex gap-1 items-center">
            <label htmlFor="toggleOpenNetView">OpenNet</label>
            <SliderButton
              onclick={() => {
                setToggledSections((prev: any) => ({
                  ...prev,
                  openNet: !prev.openNet,
                }));
                localStorage.setItem(
                  "smartSpaceToggledSections",
                  JSON.stringify({
                    ...toggledSections,
                    openNet: !toggledSections.openNet,
                  })
                )
              }}
              value={toggledSections.openNet}
            />
          </div>
          <div className="flex gap-1 items-center">
            <label htmlFor="toggleSmartLockView">SmartLock</label>
            <SliderButton
              onclick={() => {
                setToggledSections((prev: any) => ({
                  ...prev,
                  smartLock: !prev.smartLock,
                }));
                localStorage.setItem(
                  "smartSpaceToggledSections",
                  JSON.stringify({
                    ...toggledSections,
                    smartLock: !toggledSections.smartLock,
                  })
                )
              }}
              value={toggledSections.smartLock}
            />
          </div>
          <div className="flex gap-1 items-center">
            <label htmlFor="toggleSmartMotionView">SmartMotion</label>
            <SliderButton
              onclick={() => {
                setToggledSections((prev: any) => ({
                  ...prev,
                  smartMotion: !prev.smartMotion,
                }));
                localStorage.setItem(
                  "smartSpaceToggledSections",
                  JSON.stringify({
                    ...toggledSections,
                    smartMotion: !toggledSections.smartMotion,
                  })
                )
              }}
              value={toggledSections.smartMotion}
            />
          </div>
        </div>
      </div>
      {/* List view */}
      {listView ? (
        <div className="w-full px-5">
          <SmartSpaceDashboardList
            filteredFacilities={filteredFacilities}
            totalSmartlocks={totalSmartlocks}
            totalAccessPoints={totalAccessPoints}
            totalEdgeRouters={totalEdgeRouters}
            edgeRouterOnlineCount={edgeRouterOnlineCount}
            edgeRouterWarningCount={edgeRouterWarningCount}
            edgeRouterOfflineCount={edgeRouterOfflineCount}
            accessPointsOnlineCount={accessPointsOnlineCount}
            accessPointsOfflineCount={accessPointsOfflineCount}
            smartlockOkayCount={smartlockOkayCount}
            smartlockWarningCount={smartlockWarningCount}
            smartlockErrorCount={smartlockErrorCount}
            smartlockOfflineCount={smartlockOfflineCount}
            smartlockLowestSignal={smartlockLowestSignal}
            smartlockLowestBattery={smartlockLowestBattery}
            facilitiesWithBearers={loadedFacilities}
            setFilteredFacilities={setFilteredFacilities}
            toggledSections={toggledSections}
            explicitSort={explicitSort}
            smartMotionOkayCount={smartMotionOkayCount}
            smartMotionWarningCount={smartMotionWarningCount}
            smartMotionErrorCount={smartMotionErrorCount}
            smartMotionOfflineCount={smartMotionOfflineCount}
            smartMotionLowestSignal={smartMotionLowestSignal}
            smartMotionLowestBattery={smartMotionLowestBattery}
            totalSmartMotion={totalSmartMotion}
            pendingFacilities={pending}
            erroredFacilities={errored}
          />
        </div>
      ) : (
        // Card View
        <div className="p-5 pt-1 text-left">
          <div className="bg-white shadow-lg rounded-lg p-5 mb-4 border dark:bg-zinc-900 text-black dark:text-white dark:border-zinc-700 flex justify-center gap-8">
            <div>
              <h1 className="w-full border-b-2 mb-2 border-yellow-400 text-black dark:text-white text-lg">
                Edge Routers:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (edgeRouterOnlineCount / totalEdgeRouters) * 100
                    ) + "% Online \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {edgeRouterOnlineCount > 0 ? edgeRouterOnlineCount : "0"}
                  </h2>
                  <p className="text-sm">Online</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (edgeRouterWarningCount / totalEdgeRouters) * 100
                    ) + "% Warning"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {edgeRouterWarningCount > 0 ? edgeRouterWarningCount : "0"}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (edgeRouterOfflineCount / totalEdgeRouters) * 100
                    ) + "% Offline \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {edgeRouterOfflineCount > 0 ? edgeRouterOfflineCount : "0"}
                  </h2>
                  <p className="text-sm">Offline</p>
                </div>
              </div>
            </div>
            <div>
              <h1 className="w-full border-b-2 mb-2 border-yellow-400 text-black dark:text-white text-lg">
                Access Points:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (accessPointsOnlineCount / totalAccessPoints) * 100
                    ) + "% Online \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {accessPointsOnlineCount > 0
                      ? accessPointsOnlineCount
                      : "0"}
                  </h2>
                  <p className="text-sm">Online</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (accessPointsOfflineCount / totalAccessPoints) * 100
                    ) + "% Offline \n"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {accessPointsOfflineCount > 0
                      ? accessPointsOfflineCount
                      : "0"}
                  </h2>
                  <p className="text-sm">Offlline</p>
                </div>
              </div>
            </div>
            <div>
              <h1 className="w-full border-b-2 mb-2 border-yellow-400 text-black dark:text-white text-lg">
                SmartLocks:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round((smartlockOkayCount / totalSmartlocks) * 100) +
                    "% Okay Status"
                  }
                >
                  <h2 className="text-3xl font-bold">{smartlockOkayCount}</h2>
                  <p className="text-sm">Okay</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartlockWarningCount / totalSmartlocks) * 100
                    ) + "% Warning Status"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockWarningCount}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round((smartlockErrorCount / totalSmartlocks) * 100) +
                    "% Error Status"
                  }
                >
                  <h2 className="text-3xl font-bold">{smartlockErrorCount}</h2>
                  <p className="text-sm">Error</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartlockOfflineCount / totalSmartlocks) * 100
                    ) + "% Offline"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockOfflineCount}
                  </h2>
                  <p className="text-sm">Offline</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={smartlockLowestSignal.facility}
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockLowestSignal.lowestSignal}%
                  </h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={smartlockLowestBattery.facility}
                >
                  <h2 className="text-3xl font-bold">
                    {smartlockLowestBattery.lowestBattery}%
                  </h2>
                  <p className="text-sm">Lowest Battery</p>
                </div>
              </div>
            </div>
            <div>
              <h1 className="w-full border-b-2 mb-2 border-yellow-400 text-black dark:text-white text-lg">
                SmartMotion:
              </h1>
              <div className="flex gap-2">
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartMotionOkayCount / totalSmartMotion) * 100
                    ) + "% Okay Status"
                  }
                >
                  <h2 className="text-3xl font-bold">{smartMotionOkayCount}</h2>
                  <p className="text-sm">Okay</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartMotionWarningCount / totalSmartMotion) * 100
                    ) + "% Warning Status"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {smartMotionWarningCount}
                  </h2>
                  <p className="text-sm">Warning</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartMotionErrorCount / totalSmartMotion) * 100
                    ) + "% Error Status"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {smartMotionErrorCount}
                  </h2>
                  <p className="text-sm">Error</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={
                    Math.round(
                      (smartMotionOfflineCount / totalSmartMotion) * 100
                    ) + "% Offline"
                  }
                >
                  <h2 className="text-3xl font-bold">
                    {smartMotionOfflineCount}
                  </h2>
                  <p className="text-sm">Offline</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={smartMotionLowestSignal.facility}
                >
                  <h2 className="text-3xl font-bold">
                    {smartMotionLowestSignal.lowestSignal}%
                  </h2>
                  <p className="text-sm">Lowest Signal</p>
                </div>
                <div
                  className="text-center shadow-md rounded-lg p-3 border"
                  title={smartMotionLowestBattery.facility}
                >
                  <h2 className="text-3xl font-bold">
                    {smartMotionLowestBattery.lowestBattery}%
                  </h2>
                  <p className="text-sm">Lowest Battery</p>
                </div>
              </div>
            </div>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {filteredFacilities.map((facility, index) => (
              <div key={index} className="break-inside-avoid">
                <SmartSpaceFacilityCard
                  facility={facility}
                  toggledSections={toggledSections}
                  explicitSort={explicitSort}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Export Button */}
      <div
        className="float-right px-5"
        title={
          pending.length > 0
            ? `Export available after all facilities load (${pending.length} remaining)`
            : undefined
        }
      >
        <div className={pending.length > 0 ? "pointer-events-none opacity-50" : ""}>
          <SmartSpaceExport facilitiesInfo={loadedFacilities} />
        </div>
      </div>
    </div>
  );
}
