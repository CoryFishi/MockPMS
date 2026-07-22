# SmartSpace Dashboard — Progressive Loading & Failure Resilience

**Date:** 2026-07-22
**Status:** Approved for planning

## Problem

The SmartSpace dashboard (`src/components/app/smartspace/dashboard/SmartSpaceDashboard.tsx`) has two user-facing problems:

1. **A single facility failure can blank the whole dashboard.** Inside `fetchFacilityData`, the `fetchFacilityDetail()` and `fetchWeather()` awaits have no error handling. If either rejects for any one facility, the outer `Promise.all` rejects, the facility list is never set, and the user sees an empty dashboard even though every other facility loaded successfully.
2. **The full-page loading spinner blocks until the slowest facility finishes.** All selected facilities (50+ in the worst case) each make ~7 HTTP calls behind one spinner, with no timeouts and some calls needlessly sequential. Loads regularly take 2+ minutes; a hung request hangs the screen indefinitely.

## Decisions (confirmed with user)

| Question | Decision |
|---|---|
| Loading experience | Progressive rows — shell renders immediately, each facility appears as its data arrives; no full-page spinner |
| Failed facility | Stays visible as an error row/card with the failure reason and a per-facility Retry button |
| Partial endpoint failure | Degrade gracefully — row renders with what loaded; missing sections marked "unavailable". Error state reserved for critical failures |
| Scale target | 50+ selected facilities (350+ HTTP requests) — needs concurrency control |
| Return visits | Show cached data instantly, refresh in background (stale-while-revalidate), with "Last updated" timestamp and manual Refresh |
| Approach | **B — adopt TanStack Query (`@tanstack/react-query`)** |

## Architecture

### Provider

- Add `@tanstack/react-query` to `package.json`.
- Create a `QueryClient` in `App.tsx` and wrap the router in `QueryClientProvider`.
- Defaults: `staleTime: 5 * 60 * 1000` (matches the app's 5-minute refresh convention), `gcTime: 30 * 60 * 1000`, `retry: 1`, `refetchOnWindowFocus: false`.

### Per-facility queries

- The dashboard calls `useQueries` with one query per facility in `selectedTokens`.
- Query key: `['smartspace-facility', environment, id]`.
- `queryFn` is the current `fetchFacilityData` logic moved into a new module `src/hooks/smartspace.ts` (alongside `opentech.ts` / `supabase.ts`). That module is the single owner of SmartSpace dashboard OpenTech URLs.
- `refetchInterval: 5 * 60 * 1000` replaces manual interval logic.
- Because each facility is an independent query, `useQueries` re-renders as each settles — rows stream in progressively.

### Concurrency limiter

- TanStack Query does not cap cross-query parallelism, so `src/hooks/smartspace.ts` includes a small semaphore helper (~15 lines, no dependency) limiting facility fetches to **6 in flight at once**. Additional facilities queue.

### Per-facility fetch flow

1. Bearer token from `getBearerToken(facility)` (AuthProvider cache), falling back to a fresh auth call.
2. Then, **in parallel**: edge router status, edge router platform devices (APs), smartlock summary, smartlock status, smartmotion status, facility detail.
3. Weather chains after facility detail (needs the city) — no longer blocks anything else.
4. Every axios call has `timeout: 15000`.

### Failure semantics

- **Critical** (throws → query error → error row): bearer token acquisition, facility detail.
- **Non-critical** (caught individually → partial data): edge router, APs, smartlock summary, smartlock status, smartmotion, weather. The query result carries `failedSections: string[]` naming what's missing.

## Components

### `src/hooks/smartspace.ts` (new)

Exports `useFacilityStatusQueries(selectedTokens)`, the per-facility fetch function, and the concurrency limiter.

### `SmartSpaceDashboard.tsx` (refactor)

- Data fetching moves out entirely; component consumes `useFacilityStatusQueries`.
- The ~25 aggregate-counter `useState`s and the counting `useEffect` collapse into one `useMemo` deriving the totals object from loaded facilities (same math). Totals update live as rows arrive.
- Full-page `LoadingSpinner` removed. While any query is pending, show a slim progress indicator: "N of M facilities loaded".
- "Last updated" timestamp (max `dataUpdatedAt` across queries) plus a **Refresh all** button that refetches all facility queries.
- Search filters over whatever has loaded so far, unchanged mechanics.

### Row states (list and card view)

- **Skeleton** (query pending): facility name + environment shown immediately (known from `selectedTokens`); device cells are pulsing placeholders.
- **Loaded**: existing `SmartSpaceFacilityRow` / `SmartSpaceFacilityCard`. Cells for any `failedSections` show "—" with a warning tooltip (e.g. "SmartMotion data unavailable").
- **Error** (critical failure): facility name, environment, short reason ("Authentication failed" / "Request timed out"), and a **Retry** button wired to that query's `refetch()`.

New components in the `dashboard/` folder: `FacilityPendingRow` and `FacilityErrorRow` for list view, and `FacilityPendingCard` and `FacilityErrorCard` for card view.

`SmartSpaceDashboardList.tsx` accepts pending and errored entries as new props and renders them below the loaded rows. Existing sorting applies to loaded rows only.

### Export

`SmartSpaceExport` receives only fully loaded facilities and is disabled with a hint while any facility is still pending, so exports are never silently incomplete.

## Scope

**In scope:** `App.tsx` (provider), `src/hooks/smartspace.ts` (new), `SmartSpaceDashboard.tsx`, `SmartSpaceDashboardList.tsx`, new pending/error row components, `package.json`.

**Out of scope:** other SmartSpace pages (reports, tester, mapping, selected), migrating any other page to react-query, PMS pages.

## Verification (manual — repo has no test infrastructure)

1. Dashboard shell + skeletons render immediately on navigation; no full-page spinner.
2. Rows stream in as facilities load; totals update live.
3. Corrupting one facility's credentials yields exactly one error row; Retry refetches just that facility.
4. Blocking the weather API still renders full rows, weather cell marked unavailable.
5. Navigate away and back: cached rows render instantly, background refresh follows; "Last updated" is accurate.
6. Network tab shows at most ~6 facilities' requests in flight at a time with 50+ selected.
7. No request outlives its 15-second timeout; a hung endpoint degrades to a partial row or error row, never a stuck screen.
