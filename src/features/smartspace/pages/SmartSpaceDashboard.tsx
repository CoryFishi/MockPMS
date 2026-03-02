import axios from "axios";
import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import SmartSpaceFacilityCard from "@features/smartspace/components/SmartSpaceFacilityCard";
import SmartSpaceExport from "@features/smartspace/components/SmartSpaceExport";
import { useAuth } from "@context/AuthProvider";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import SmartSpaceDashboardList from "@features/smartspace/components/SmartSpaceDashboardList";
import InputBox from "@components/UI/InputBox";
import SliderButton from "@components/UI/SliderButton";

export default function SmartSpaceDashboardView() {
  const [facilitiesWithBearers, setFacilitiesWithBearers] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
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
  const [facilitiesInfo, setFacilitiesInfo] = useState<any[]>([]);
  const [edgeRouterOfflineCount, setEdgeRouterOfflineCount] = useState<number>(0);
  const [edgeRouterOnlineCount, setEdgeRouterOnlineCount] = useState<number>(0);
  const [edgeRouterWarningCount, setEdgeRouterWarningCount] = useState<number>(0);
  const [accessPointsOnlineCount, setAccessPointsOnlineCount] = useState<number>(0);
  const [accessPointsOfflineCount, setAccessPointsOfflineCount] = useState<number>(0);
  const [smartlockOkayCount, setSmartlockOkayCount] = useState<number>(0);
  const [smartlockWarningCount, setSmartlockWarningCount] = useState<number>(0);
  const [smartlockErrorCount, setSmartlockErrorCount] = useState<number>(0);
  const [smartlockOfflineCount, setSmartlockOfflineCount] = useState<number>(0);
  const [smartlockLowestSignal, setSmartlockLowestSignal] = useState<any>({});
  const [smartlockLowestBattery, setSmartlockLowestBattery] = useState<any>({});
  const [totalSmartlocks, setTotalSmartlocks] = useState<number>(0);
  const [totalAccessPoints, setTotalAccessPoints] = useState<number>(0);
  const [totalEdgeRouters, setTotalEdgeRouters] = useState<number>(0);
  const [totalSmartMotion, setTotalSmartMotion] = useState<number>(0);
  const [smartMotionOkayCount, setSmartMotionOkayCount] = useState<number>(0);
  const [smartMotionWarningCount, setSmartMotionWarningCount] = useState<number>(0);
  const [smartMotionErrorCount, setSmartMotionErrorCount] = useState<number>(0);
  const [smartMotionOfflineCount, setSmartMotionOfflineCount] = useState<number>(0);
  const [smartMotionLowestSignal, setSmartMotionLowestSignal] = useState<any>({});
  const [smartMotionLowestBattery, setSmartMotionLowestBattery] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { selectedTokens } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [explicitSort, setExplicitSort] = useState<boolean>(
    JSON.parse(localStorage.getItem("smartSpaceExplicit")) || false
  );
  const [currentLoadingText, setCurrentLoadingText] = useState<string>("");
  // Search via search bar and button
  const search = useCallback((query: string) => {
    const trimmed = query.trim().toLowerCase();
    const results = facilitiesWithBearers.filter((facility) => {
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
  }, [facilitiesWithBearers]);
  // Function to get a bearer token for each facility
  const fetchBearerToken = async (facility: any) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "staging") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }
      const data = {
        grant_type: "password",
        username: facility.api,
        password: facility.apiSecret,
        client_id: facility.client,
        client_secret: facility.clientSecret,
      };

      const response = await axios.post(
        `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
        data,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error(`Error fetching token for ${facility.name}:`, error);
      toast.error(`Failed to fetch token for ${facility.name}`);
      return null;
    }
  };
  // Toggle view - list or card
  const toggleListView = () => {
    setListView(!listView);
    localStorage.setItem("smartSpaceListView", !listView ? "true" : "false");
  };
  // Add totals together from each facility
  useEffect(() => {
    const updateAggregatedCounts = (filteredFacilities: any[]) => {
      const facilitiesWithSmartLocks = filteredFacilities.filter(
        (f: any) => Array.isArray(f.smartLocks) && f.smartLocks.length > 0
      );
      const facilitiesWithSmartMotions = filteredFacilities.filter(
        (f: any) => Array.isArray(f.smartMotion) && f.smartMotion.length > 0
      );

      const totals = {
        totalAccessPoints: 0,
        totalEdgeRouters: 0,
        totalSmartlocks: 0,
        edgeRouterOfflineCount: 0,
        edgeRouterOnlineCount: 0,
        edgeRouterWarningCount: 0,
        accessPointsOnlineCount: 0,
        accessPointsOfflineCount: 0,
        smartlockOkayCount: 0,
        smartlockWarningCount: 0,
        smartlockErrorCount: 0,
        smartlockOfflineCount: 0,
        smartlockLowestSignal: "100",
        smartlockLowestBattery: "100",
        smartlockLowestSignalFacility: "N/A",
        smartlockLowestBatteryFacility: "N/A",
        smartMotionOkayCount: 0,
        smartMotionWarningCount: 0,
        smartMotionErrorCount: 0,
        smartMotionOfflineCount: 0,
        smartMotionLowestSignal: "100",
        smartMotionLowestBattery: "100",
        smartMotionLowestSignalFacility: "N/A",
        smartMotionLowestBatteryFacility: "N/A",
        totalSmartMotion: 0,
      };

      // Count all edge routers and access points (all facilities)
      for (const facility of facilitiesInfo) {
        // If explicit sort is enabled, and smart motion is selected do not render the row when there are no smart motion devices
        if (
          facility.smartMotion.length < 1 &&
          !toggledSections.smartLock &&
          toggledSections.smartMotion &&
          explicitSort
        ) {
          continue;
        }

        // If explicit sort is enabled, and smart lock is selected do not render the row when there are no smart lock devices
        if (
          facility.smartLocks.length < 1 &&
          !toggledSections.smartMotion &&
          toggledSections.smartLock &&
          explicitSort
        ) {
          continue;
        }

        totals.totalEdgeRouters += facility.edgeRouterStatus ? 1 : 1;
        totals.edgeRouterOfflineCount +=
          facility.edgeRouterStatus === "error" ? 1 : 0;
        totals.edgeRouterOnlineCount +=
          facility.edgeRouterStatus === "ok" ? 1 : 0;
        totals.edgeRouterWarningCount +=
          facility.edgeRouterStatus === "warning" ? 1 : 0;

        totals.accessPointsOnlineCount += facility.onlineAccessPointsCount;
        totals.accessPointsOfflineCount += facility.offlineAccessPointsCount;
        totals.totalAccessPoints +=
          facility.onlineAccessPointsCount + facility.offlineAccessPointsCount;
      }

      // Count only smartlock stats from facilities with smartlocks
      for (const facility of facilitiesWithSmartLocks) {
        // If explicit sort is enabled, and smart motion is selected do not render the row when there are no smart motion devices
        if (
          facility.smartMotion.length < 1 &&
          !toggledSections.smartLock &&
          toggledSections.smartMotion &&
          explicitSort
        ) {
          continue;
        }

        // If explicit sort is enabled, and smart lock is selected do not render the row when there are no smart lock devices
        if (
          facility.smartLocks.length < 1 &&
          !toggledSections.smartMotion &&
          toggledSections.smartLock &&
          explicitSort
        ) {
          continue;
        }

        totals.totalSmartlocks +=
          facility.okCount + facility.warningCount + facility.errorCount;

        totals.smartlockOkayCount += facility.okCount || 0;
        totals.smartlockWarningCount += facility.warningCount || 0;
        totals.smartlockErrorCount += facility.errorCount || 0;
        totals.smartlockOfflineCount += facility.offlineCount || 0;

        const signal = parseInt(facility.lowestSignal);
        const battery = parseInt(facility.lowestBattery);
        if (signal < parseInt(totals.smartlockLowestSignal)) {
          totals.smartlockLowestSignal = signal as any;
          totals.smartlockLowestSignalFacility = facility.name;
        }
        if (battery < parseInt(totals.smartlockLowestBattery)) {
          totals.smartlockLowestBattery = battery as any;
          totals.smartlockLowestBatteryFacility = facility.name;
        }
      }

      // Count only smartlock stats from facilities with smartmotions
      for (const facility of facilitiesWithSmartMotions) {
        // If explicit sort is enabled, and smart motion is selected do not render the row when there are no smart motion devices
        if (
          facility.smartMotion.length < 1 &&
          !toggledSections.smartLock &&
          toggledSections.smartMotion &&
          explicitSort
        ) {
          continue;
        }

        // If explicit sort is enabled, and smart lock is selected do not render the row when there are no smart lock devices
        if (
          facility.smartLocks.length < 1 &&
          !toggledSections.smartMotion &&
          toggledSections.smartLock &&
          explicitSort
        ) {
          continue;
        }

        totals.totalSmartMotion +=
          facility.smartMotionOkayCount +
          facility.smartMotionWarningCount +
          facility.smartMotionErrorCount;

        totals.smartMotionOkayCount += facility.smartMotionOkayCount || 0;
        totals.smartMotionWarningCount += facility.smartMotionWarningCount || 0;
        totals.smartMotionErrorCount += facility.smartMotionErrorCount || 0;
        totals.smartMotionOfflineCount += facility.smartMotionOfflineCount || 0;

        const signal = parseInt(facility.smartMotionLowestSignal);
        const battery = parseInt(facility.smartMotionLowestBattery);
        if (signal < parseInt(totals.smartMotionLowestSignal)) {
          totals.smartMotionLowestSignal = signal as any;
          totals.smartMotionLowestSignalFacility = facility.name;
        }
        if (battery < parseInt(totals.smartMotionLowestBattery)) {
          totals.smartMotionLowestBattery = battery as any;
          totals.smartMotionLowestBatteryFacility = facility.name;
        }
      }

      setTotalAccessPoints(totals.totalAccessPoints);
      setTotalEdgeRouters(totals.totalEdgeRouters);
      setTotalSmartlocks(totals.totalSmartlocks);
      setTotalSmartMotion(totals.totalSmartMotion);
      setEdgeRouterOfflineCount(totals.edgeRouterOfflineCount);
      setEdgeRouterWarningCount(totals.edgeRouterWarningCount);
      setEdgeRouterOnlineCount(totals.edgeRouterOnlineCount);
      setAccessPointsOnlineCount(totals.accessPointsOnlineCount);
      setAccessPointsOfflineCount(totals.accessPointsOfflineCount);
      setSmartlockOkayCount(totals.smartlockOkayCount);
      setSmartlockWarningCount(totals.smartlockWarningCount);
      setSmartlockErrorCount(totals.smartlockErrorCount);
      setSmartlockOfflineCount(totals.smartlockOfflineCount);
      setSmartlockLowestSignal({
        lowestSignal: totals.smartlockLowestSignal,
        facility: totals.smartlockLowestSignalFacility,
      });
      setSmartlockLowestBattery({
        lowestBattery: totals.smartlockLowestBattery,
        facility: totals.smartlockLowestBatteryFacility,
      });
      setSmartMotionOkayCount(totals.smartMotionOkayCount);
      setSmartMotionWarningCount(totals.smartMotionWarningCount);
      setSmartMotionErrorCount(totals.smartMotionErrorCount);
      setSmartMotionOfflineCount(totals.smartMotionOfflineCount);
      setSmartMotionLowestSignal({
        lowestSignal: totals.smartMotionLowestSignal,
        facility: totals.smartMotionLowestSignalFacility,
      });
      setSmartMotionLowestBattery({
        lowestBattery: totals.smartMotionLowestBattery,
        facility: totals.smartMotionLowestBatteryFacility,
      });
    };

    updateAggregatedCounts(filteredFacilities);
  }, [filteredFacilities, toggledSections, explicitSort, searchQuery, facilitiesInfo]);

  // Get bearer tokens prior to creating rows/cards
  useEffect(() => {
    const fetchFacilitiesWithBearers = async () => {
      try {
        const fetchFacilityWithBearerAndStats = async (facility: any) => {
          const bearer = await fetchBearerToken(facility);
          if (!bearer) return null;

          const facilityWithBearer = { ...facility, bearer };
          const stats = await fetchFacilityData(facilityWithBearer);
          return stats;
        };

        const results = await Promise.all(
          selectedTokens.map(async (facility: any) => {
            return await fetchFacilityWithBearerAndStats(facility);
          })
        );

        // Filter out any failed/null results
        const validResults = results.filter(Boolean);

        // Sort by smartLocks array length descending
        validResults.sort(
          (a, b) => (b.smartLocks?.length || 0) - (a.smartLocks?.length || 0)
        );

        setFacilitiesWithBearers(validResults);
        setFilteredFacilities(validResults);
        setFacilitiesInfo(validResults);
      } catch (err) {
        console.error("Failed to fetch facilities:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchFacilitiesWithBearers();
  }, [selectedTokens]);

  const fetchFacilityData = async (facility: any) => {
    setCurrentLoadingText(`Loading ${facility.name}...`);
    const { id, environment, bearer } = facility;
    const tokenPrefix =
      environment === "staging" ? "cia-stg-1.aws." : "";
    const tokenSuffix = environment === "staging" ? "" : environment;

    const headers = {
      Authorization: `Bearer ${bearer}`,
      accept: "application/json",
      "api-version": "2.0",
    };

    const [edgeRouter, aps, summary, smartlocks] = await Promise.all([
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/edgerouterstatus`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => null),
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/edgerouterplatformdevicesstatus`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => []),
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/smartlockstatussummary`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => null),
      axios
        .get(
          `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/smartlockstatus`,
          { headers }
        )
        .then((res) => res.data)
        .catch(() => []),
    ]);

    const fetchSmartMotion = async () => {
      const res = await axios.get(
        `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/smartmotionstatus`,
        { headers }
      );
      return res.data;
    };

    const fetchFacilityDetail = async () => {
      const res = await axios.get(
        `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}`,
        { headers }
      );
      return res.data;
    };

    const fetchWeather = async (facilityDetail: any) => {
      const weatherKey = import.meta.env.VITE_WEATHER_KEY;
      const city = facilityDetail.city;
      const res = await axios.get(
        `https://api.weatherapi.com/v1/current.json?q=${city}&key=${weatherKey}`
      );
      return res.data;
    };
    var smartMotion = [];
    if (environment !== "") {
      smartMotion = await fetchSmartMotion();
    }

    const smartMotionOkayCount = smartMotion.filter(
      (s) => s.overallStatus === "ok"
    ).length;
    const smartMotionWarningCount = smartMotion.filter(
      (s) => s.overallStatus === "warning"
    ).length;
    const smartMotionErrorCount = smartMotion.filter(
      (s) => s.overallStatus === "error"
    ).length;
    const smartMotionOfflineCount = smartMotion.filter(
      (s) => s.isDeviceOffline
    ).length;
    const smartMotionLowestSignal = Math.min(
      ...smartMotion
        .filter((s) => !s.isDeviceOffline)
        .map((s) => s.signalQuality || 255)
    );
    const smartMotionLowestBattery = Math.min(
      ...smartMotion
        .filter((s) => !s.isDeviceOffline)
        .map((s) => s.batteryLevel)
    );

    const facilityDetail = await fetchFacilityDetail();
    const weather = await fetchWeather(facilityDetail);

    const lowestSignal = smartlocks
      ? Math.min(
          ...smartlocks
            .filter((s: any) => !s.isDeviceOffline)
            .map((s: any) => s.signalQuality || 255)
        )
      : 0;
    const lowestBattery = smartlocks
      ? Math.min(
          ...smartlocks
            .filter((s: any) => !s.isDeviceOffline)
            .map((s: any) => s.batteryLevel || 100)
        )
      : 0;
    const offlineCount = smartlocks
      ? smartlocks.filter((s: any) => s.isDeviceOffline).length
      : 0;
    if (smartlocks.length > 0) {
      return {
        ...facility,
        edgeRouterStatus: edgeRouter?.connectionStatus || "error",
        onlineAccessPointsCount:
          aps.filter((ap: any) => !ap.isDeviceOffline).length || 0,
        offlineAccessPointsCount:
          aps.filter((ap: any) => ap.isDeviceOffline).length || 0,
        okCount: summary?.okCount || 0,
        warningCount: summary?.warningCount || 0,
        errorCount: summary?.errorCount || 0,
        offlineCount,
        lowestSignal: isFinite(lowestSignal)
          ? Math.round((lowestSignal / 255) * 100)
          : 0,
        lowestBattery: isFinite(lowestBattery) ? lowestBattery : 0,
        smartLocks: smartlocks || [],
        edgeRouterName: edgeRouter?.name || "Edge Router",
        edgeRouter: edgeRouter || {},
        accessPoints: aps || [],
        facilityDetail,
        weather: weather || [],
        smartMotion,
        smartMotionOkayCount,
        smartMotionWarningCount,
        smartMotionErrorCount,
        smartMotionOfflineCount,
        smartMotionLowestSignal: isFinite(smartMotionLowestSignal)
          ? Math.round((smartMotionLowestSignal / 255) * 100)
          : 0,
        smartMotionLowestBattery: isFinite(smartMotionLowestBattery)
          ? smartMotionLowestBattery
          : 0,
      };
    } else {
      return {
        ...facility,
        edgeRouterStatus: edgeRouter?.connectionStatus || "error",
        onlineAccessPointsCount:
          aps.filter((ap: any) => !ap.isDeviceOffline).length || 0,
        offlineAccessPointsCount:
          aps.filter((ap: any) => ap.isDeviceOffline).length || 0,
        okCount: -100,
        warningCount: -100,
        errorCount: -100,
        offlineCount: -100,
        lowestSignal: -100,
        lowestBattery: -100,
        smartLocks: [],
        edgeRouterName: edgeRouter?.name || "Edge Router",
        facilityDetail,
        weather,
        edgeRouter: edgeRouter || {},
        accessPoints: aps || [],
        smartMotion,
        smartMotionOkayCount,
        smartMotionWarningCount,
        smartMotionErrorCount,
        smartMotionOfflineCount,
        smartMotionLowestSignal: isFinite(smartMotionLowestSignal)
          ? Math.round((smartMotionLowestSignal / 255) * 100)
          : 0,
        smartMotionLowestBattery: isFinite(smartMotionLowestBattery)
          ? smartMotionLowestBattery
          : 0,
      };
    }
  };

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      search(searchQuery);
    } else {
      setFilteredFacilities(facilitiesWithBearers);
    }
  }, [searchQuery, facilitiesWithBearers, search]);

  return (
    <div
      className={`relative ${
        isLoading ? "overflow-hidden min-h-full" : "overflow-auto"
      } h-full dark:text-white dark:bg-zinc-900 relative`}
    >
      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner loadingText={currentLoadingText} />}
      {/* tab title */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-zinc-700 dark:bg-zinc-950">
        <div className="ml-5 flex items-center text-sm">
          <FaLock className="text-lg" />
          &ensp; SmartSpace Dashboard
        </div>
      </div>
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
            facilitiesWithBearers={facilitiesWithBearers}
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
      <div className="float-right px-5">
        <SmartSpaceExport facilitiesInfo={facilitiesInfo} />
      </div>
    </div>
  );
}
