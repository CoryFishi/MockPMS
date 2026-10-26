import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@context/AuthProvider";
import { buildApiUrl, authHeaders, getEnvironmentName } from "@hooks/opentech";

export const STATUSLIST_QUERY_KEY = "facility-statuslist";

const REQUEST_TIMEOUT_MS = 15000;
const FAILURE_TOAST_ID = "statuslist-failures";
const FAILURE_NAMES_SHOWN = 3;

// Every facility visible to one saved credential, tagged with that credential
async function fetchStatusList(
  credential: any,
  ensureBearerToken: (credential: any) => Promise<string | null>
) {
  const bearer = await ensureBearerToken(credential);
  if (!bearer) throw new Error("Authentication failed");

  const response = await axios.get(buildApiUrl(credential, "/facilities/statuslist"), {
    headers: authHeaders({ token: { access_token: bearer } }),
    timeout: REQUEST_TIMEOUT_MS,
  });

  return response.data.map((item: any) => ({
    ...item,
    environment: credential.environment,
    api: credential.api,
    apiSecret: credential.apiSecret,
    client: credential.client,
    clientSecret: credential.clientSecret,
  }));
}

function compareFacilities(a: any, b: any) {
  if (a.environment < b.environment) return -1;
  if (a.environment > b.environment) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

// Module-level so its identity is stable: React Query then only re-runs it
// (and hands back new arrays) when a query result changes
function combineStatusLists(results: UseQueryResult<any[]>[]) {
  return {
    facilities: results.flatMap((r) => r.data ?? []).sort(compareFacilities),
    settledCount: results.filter((r) => !r.isPending).length,
    failedIndexes: results.flatMap((r, i) => (r.isError ? [i] : [])),
  };
}

const credentialLabel = (c: any) =>
  `${c.name || c.client} (${getEnvironmentName(c)})`;

/**
 * Facilities across every saved credential, one cached query per credential
 * (shared by the PMS and SmartSpace All Facilities pages). Rows appear as each
 * credential responds, revisiting reuses the cache, and adding a credential
 * only fetches the new one. Failures are reported in a single toast.
 */
export function useFacilityStatusLists() {
  const { tokens, isPulled, ensureBearerToken } = useAuth();
  const credentials: any[] = useMemo(() => (isPulled ? tokens : []), [isPulled, tokens]);

  const { facilities, settledCount, failedIndexes } = useQueries({
    queries: credentials.map((credential) => ({
      queryKey: [STATUSLIST_QUERY_KEY, credential.api, credential.environment],
      queryFn: () => fetchStatusList(credential, ensureBearerToken),
      retry: false,
    })),
    combine: combineStatusLists,
  });

  const total = credentials.length;
  const allSettled = isPulled && settledCount === total;

  const failedLabels = failedIndexes
    .map((i) => credentials[i])
    .filter(Boolean)
    .map(credentialLabel)
    .join(", ");

  useEffect(() => {
    if (!allSettled || !failedLabels) return;
    const labels = failedLabels.split(", ");
    const shown = labels.slice(0, FAILURE_NAMES_SHOWN).join(", ");
    const more = labels.length > FAILURE_NAMES_SHOWN ? ` and ${labels.length - FAILURE_NAMES_SHOWN} more` : "";
    console.error("Credentials failed to load:", labels);
    toast.error(
      `${labels.length} credential${labels.length === 1 ? "" : "s"} failed to load: ${shown}${more}.`,
      { id: FAILURE_TOAST_ID, duration: 6000 }
    );
  }, [allSettled, failedLabels]);

  return {
    facilities,
    settledCount,
    total,
    allSettled,
    failedCount: failedIndexes.length,
    noFacilities: allSettled && facilities.length === 0,
    // Block the page only until the first rows arrive; show progress after that
    isLoading: !isPulled || (!allSettled && facilities.length === 0),
  };
}

const SEARCHABLE_FIELDS = [
  "facilityId",
  "facilityPropertyNumber",
  "facilityName",
  "accountName",
  "environment",
  "gatewayStatus",
  "alarmStatus",
  "deviceStatus",
  "edgeRouterPlatformDeviceStatus",
  "pmsInterfaceStatus",
  "gatewayStatusMessage",
  "alarmStatusMessage",
  "deviceStatusMessage",
  "edgeRouterPlatformDeviceStatusMessage",
  "pmsInterfaceStatusMessage",
];

// Search used by the All Facilities tables; "smartlock" matches SmartLock facilities
export function filterFacilities(facilities: any[], query: string) {
  const lowered = query.toLowerCase();
  if (!lowered) return facilities;
  return facilities.filter(
    (facility) =>
      SEARCHABLE_FIELDS.some((field) =>
        facility[field]?.toString().toLowerCase().includes(lowered)
      ) ||
      (facility.edgeRouterPlatformDeviceStatus != null && "smartlock".includes(lowered))
  );
}
