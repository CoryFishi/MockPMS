import axios from "axios";
import { useCallback, type SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@context/AuthProvider";
import { buildApiUrl, authHeaders, type Facility } from "@hooks/opentech";

export const FACILITY_RESOURCE_QUERY_KEY = "facility-resource";

const REQUEST_TIMEOUT_MS = 15000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
// Stable fallback so `data` keeps its identity while nothing is loaded
const EMPTY: any[] = [];

interface Options<T> {
  // Post-process the response before it is cached (e.g. sort)
  transform?: (data: any) => T[];
  retry?: boolean | number;
}

/**
 * A list under `/facilities/{id}` for the current facility, cached per
 * facility: revisiting a page or switching back to a facility is instant, and
 * it refreshes every 5 minutes while mounted. `setData` mirrors a useState
 * setter (value or updater) and writes into the cache, for optimistic edits.
 */
export function useFacilityResource<T = any>(
  facility: Partial<Facility> | null | undefined,
  path: string,
  { transform, retry }: Options<T> = {}
) {
  const queryClient = useQueryClient();
  const { ensureBearerToken } = useAuth();
  const queryKey = [FACILITY_RESOURCE_QUERY_KEY, facility?.environment, facility?.id, path];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      // Not facility.token: the stored one may be stale, and the key omits it
      const bearer = await ensureBearerToken(facility);
      if (!bearer) throw new Error("Authentication failed");
      const response = await axios.get(
        buildApiUrl(facility as Facility, `/facilities/${facility!.id}${path}`),
        { headers: authHeaders({ token: { access_token: bearer } }), timeout: REQUEST_TIMEOUT_MS }
      );
      return transform ? transform(response.data) : (response.data as T[]);
    },
    enabled: !!facility?.api && facility?.id != null,
    refetchInterval: FIVE_MINUTES_MS,
    ...(retry !== undefined && { retry }),
  });

  const keyHash = JSON.stringify(queryKey);
  const setData = useCallback(
    (update: SetStateAction<T[]>) =>
      queryClient.setQueryData<T[]>(JSON.parse(keyHash), (prev) =>
        typeof update === "function"
          ? (update as (prev: T[]) => T[])(prev ?? EMPTY)
          : update
      ),
    [queryClient, keyHash]
  );

  return {
    data: (query.data ?? EMPTY) as T[],
    setData,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export const sortByUnitNumber = (rows: any[]) =>
  [...rows].sort((a, b) => {
    if (a.unitNumber < b.unitNumber) return -1;
    if (a.unitNumber > b.unitNumber) return 1;
    return 0;
  });
