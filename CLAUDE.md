# MockPMS — Claude Agent Guide

## Project Overview

MockPMS is an internal tooling app used by OpenTech Alliance's **onboarding/support teams** and **QA team** to interact with and test the Insomniac CIA platform. It is not a customer-facing product.

**Primary use cases:**
- **Onboarding & Support** — quickly select a customer facility, inspect its units and visitors, verify configurations, and open the Control Center portal directly from the tool
- **QA** — test OpenTech API behavior across environments (Production, Staging, Dev, QA) without needing a full platform setup; the Scripts section exposes admin-level bulk operations for platform admins

It is a React + TypeScript frontend that drives the OpenTech API directly. Supabase handles auth and user data storage only — all property/facility data comes from the OpenTech API.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · Supabase · Axios · TanStack React Query · React Router 7 · react-hot-toast · recharts (reports) · react-konva (mapping canvas) · react-icons

---

## Verifying Changes

```bash
npm run check      # typecheck + lint — run after every change; must stay at 0 errors
npm run build      # vite build — does NOT typecheck, so it is not a substitute for check
npm run dev        # http://localhost:5173 (needs a .env with the Supabase keys)
```

- The baseline is green: `tsc` reports 0 errors and `eslint` 0 errors (only two pre-existing `react-refresh/only-export-components` warnings). Any new error is yours.
- There is no test suite. Behavior changes are verified by running the app, which needs real Supabase + OpenTech credentials — if you cannot, say so rather than claiming the change works.
- `tsconfig` has `strict: false` and much of the code is loosely typed (`any`). Type new code properly; don't widen existing types to silence errors.
- Unused vars are flagged by `@typescript-eslint/no-unused-vars`; prefix intentionally unused args with `_`.
- `.env` holds Supabase keys — never print it, commit it, or paste it into output. Everything `VITE_*` is bundled into the public JS, so a secret must never get a `VITE_` variable.
- Design specs and implementation plans live in `docs/superpowers/{specs,plans}/`, named `YYYY-MM-DD-<topic>.md`.

---

## Code Map

```
src/
├── main.tsx                  # QueryClientProvider → AuthProvider → BrowserRouter → App
├── app/App.tsx               # Top-level routes, Toaster, dark mode state
├── components/
│   ├── app/                  # @views — pages, one folder per platform (admin, auth, pms, smartspace,
│   │                         #   authentication-settings, user-settings); modals live beside their page
│   ├── shared/               # @components/shared — DataTable, PaginationFooter, DetailModal, Navbar, ...
│   └── ui/                   # @components/ui — buttons, inputs, ModalContainer
├── context/AuthProvider.tsx  # Global auth, user data, bearer token cache (useAuth)
├── hooks/
│   ├── opentech.ts           # OpenTech URL/header/login helpers + Facility type
│   ├── facilityRefs.ts       # store/hydrate favorite, selected and current facilities (see Supabase)
│   ├── facilityResource.ts   # useFacilityResource — cached per-facility lists (units, visitors, ...)
│   ├── statuslist.ts         # useFacilityStatusLists — facilities across all saved credentials
│   ├── smartspace.ts         # React Query facility-status fetching for the SmartSpace dashboard
│   ├── tableSort.ts          # useTableSort — DataTable sort state that survives data changes
│   └── supabase.ts           # addEvent() user-event logging
└── lib/supabaseClient.ts     # the single Supabase client (anon key)
supabase/migrations/          # SQL migrations (RLS policies, admin functions) — applied manually in the Supabase SQL editor
```

Notable pages: `pms/DeleteModal.tsx` is shared by `units/` and `visitors/`. `admin/users/CopyUserData.tsx` merges/replaces tokens, favorites, and selected facilities between users. `smartspace/mapping/` is a react-konva floor-plan editor (`applyChange.ts` holds its state transitions; `facility1.json` is sample data).

---

## Path Aliases

**Always import via aliases — never relative paths.** Defined in both `tsconfig.json` (`paths`) and `vite.config.ts` (`resolve.alias`); change both together.

`@components` → `src/components` · `@views` → `src/components/app` · `@context` · `@hooks` · `@lib` · `@app` · `@assets` → `src/<name>`

---

## Environment Variables

Typed in `src/vite-env.d.ts`; read via `import.meta.env.VITE_*`.

```env
VITE_SUPABASE_URL=         # Supabase project URL
VITE_SUPABASE_KEY=         # Public anon key (row-level security applies)
VITE_WEATHER_KEY=          # weatherapi.com key — used by hooks/smartspace.ts for facility weather
VITE_RESEND_KEY=           # Listed in README but not read anywhere in src/
```

---

## Auth Context (`useAuth`)

Import: `import { useAuth } from "@context/AuthProvider"`

| Value | Type | Description |
|---|---|---|
| `user` | `any \| null` | Supabase auth user |
| `setUser` | fn | |
| `role` | `string` | e.g. `"user"`, `"admin"` |
| `permissions` | `object` | From `roles` table — see Permissions below |
| `tokens` | `array` | Stored credentials `[{name, api, apiSecret, client, clientSecret, environment}]` |
| `setTokens` | fn | Update stored credentials (triggers auto-auth for new ones) |
| `favoriteTokens` | `array` | Favorited facilities |
| `setFavoriteTokens` | fn | |
| `selectedTokens` | `array` | SmartSpace selected facilities |
| `setSelectedTokens` | fn | |
| `currentFacility` | `object` | Active facility `{id, name, api, apiSecret, client, clientSecret, environment, token: {access_token, ...}}` |
| `setCurrentFacility` | fn | |
| `isPulled` | `boolean` | True after initial Supabase data fetch |
| `setIsPulled` | fn | |
| `isLoading` | `boolean` | Initial auth loading |
| `noUser` | `boolean` | No authenticated user |
| `bearerTokens` | `BearerMap` | Cached bearer tokens — see Bearer Token System |
| `getBearerToken` | fn | `(credential) => string \| null` |
| `ensureBearerToken` | fn | `(credential) => Promise<string \| null>` — cache, else shared in-flight login |

---

## Bearer Token System

All OpenTech API calls require a bearer token. AuthProvider keeps a central cache so no component needs to re-authenticate on its own.

```typescript
type BearerMap = Record<string, { access_token: string; expires_at: number }>
// Key: `${credential.api}::${credential.environment}`
// expires_at: absolute ms timestamp (Date.now() + expires_in * 1000)
```

`getBearerToken(credential)` returns the cached `access_token`, or `null` if missing/expired. It reads from a ref, so it is stable and safe in `useCallback`/`useEffect` deps.

`ensureBearerToken(credential)` returns the cached token, or joins a login already in flight for that credential, or logs in; it resolves `null` on failure and is stable. Prefer it in new code — concurrent callers share one auth request instead of each logging in.

The cache is persisted to `localStorage.bearerTokens` (expired entries dropped on load, cleared on `SIGNED_OUT`), so a reload doesn't re-authenticate every credential.

AuthProvider automatically:
1. **On load and when `tokens` changes** — calls `ensureBearerToken` for every credential (no-op for cached ones)
2. **Every 5 minutes** — refreshes tokens expiring within 10 minutes; patches `currentFacility.token` if it matches

Standard usage — every page and hook uses it; don't call `handleSingleLogin` directly except to test a credential:

```typescript
const { ensureBearerToken } = useAuth();

const bearer = await ensureBearerToken(facility);
if (!bearer) throw new Error("Authentication failed");
```

---

## OpenTech API

### Helpers (`@hooks/opentech`) — use these for every API call

| Helper | Purpose |
|---|---|
| `buildAuthUrl(facility)` | Auth token URL (`https://auth.…/auth/token`) |
| `buildApiUrl(facility, path, service?)` | API URL. Only needs `environment`. `service` defaults to `"accesscontrol"`; pass `"accessevent"` for `/combinedevents/…`. `path` keeps its leading `/`. |
| `authHeaders(facility, contentType?, apiVersion?)` | Bearer headers. Only needs `token`. `contentType` defaults to `"application/json"` (pass `"application/json-patch+json"` for write endpoints that require it); `apiVersion` defaults to `"2.0"` (pass `"3.0"` for the `accessevent` calls). |
| `handleSingleLogin(facility)` | Authenticate; returns `{ message, token }` or `{ error }` (never throws) |
| `handleMultiLogin(facility)` | Same, but rethrows on failure (for `Promise.allSettled`/`toast.promise`) |
| `getEnvironmentName(facility)` | Human-readable environment string |

`Facility` is the exported credential/facility type. Auth POSTs use `application/x-www-form-urlencoded` with a `qs.stringify()` body — keep them out of `authHeaders`. Portal (`portal.…`) deep-links are not API calls and don't use these helpers.

### Environments

| `environment` | Label | Auth host |
|---|---|---|
| `""` | Production | `auth.insomniaccia.com` |
| `"staging"` | Staging | `auth.cia-stg-1.aws.insomniaccia.com` |
| `"-dev"` | Development | `auth.insomniaccia-dev.com` |
| `"-qa"` | QA | `auth.insomniaccia-qa.com` |

### Endpoints

All under `/facilities/{id}` on `accesscontrol` unless noted. To find how an endpoint is called today, grep `src/` for its path.

- **Facility:** `GET /facilities/statuslist` (all facilities for account), `GET /facilities/{id}`, `/status`, `/devices`, `/lockdown`, `/emergency`
- **Units:** `GET|POST /units`, `/units/{unitId}/vacate`, `/enable` (with `?suppressCommands=true`), `/disable`, `/units/{unitId}/visitors`, `/units/{unitId}/delete/vacant`
- **Visitors:** `GET|POST /visitors`, `/visitors/{visitorId}/update`, `/remove`
- **Devices:** `/smartlockstatus`, `/smartlockstatussummary`, `/smartmotionstatus`, `/edgerouterstatus`, `/edgerouterplatformdevicesstatus`
- **Config:** `/accessprofiles`, `/timegroups`, `/actiongroups/manual`, `/actiongroups/{id}/open|hold|close`
- **Events (`accessevent`, api-version 3.0):** `/combinedevents/facilities/{id}`, `/combinedevents/types`

---

## Data Fetching

Two styles coexist:

- **React Query** (use this) — `main.tsx` provides a `QueryClient` (defaults: `staleTime` 5m, `gcTime` 30m, `retry: 1`, `refetchOnWindowFocus: false`).
  - **Current-facility lists** — `useFacilityResource(currentFacility, "/units", { transform?, retry? })` from `@hooks/facilityResource` returns `{ data, setData, isPending, isError, refetch }`, cached per facility and refreshed every 5 minutes. `setData` behaves like a `useState` setter but writes into the cache — use it for optimistic edits (Units/Visitors pass it to their modals as `setUnits`/`setVisitors`).
  - **All saved credentials** — `useFacilityStatusLists()` from `@hooks/statuslist` (both All Facilities pages): one `/facilities/statuslist` query per credential, rows stream in, failures reported in one toast. Pair with `filterFacilities(facilities, query)`.
  - **SmartSpace dashboard** — `useFacilityStatusQueries(selectedTokens, ensureBearerToken)` from `@hooks/smartspace`: one query per facility, at most 6 concurrent fetches, 15s timeout, 5-minute `refetchInterval`, returning `{ loaded, pending, errored, lastUpdatedAt, refreshingKeys }`. Refresh by `queryClient.invalidateQueries({ queryKey: [FACILITY_QUERY_KEY] })`.
  - Give every OpenTech request a `timeout` (15s is used throughout) — a hung host otherwise blocks until the browser gives up.
- **Sorting** — derive the table rows with `useTableSort(rows)` (`@hooks/tableSort`) → `{ sortedRows, sortedColumn, sortDirection, onSort }` rather than sorting a copy into state, so the sort survives refreshes and search changes. Keep the search filter in a `useMemo` and call `setCurrentPage(1)` in the search input's handler.
- **Local state + pulled flag** — older pages still fetch in a `useEffect` guarded by a "pulled" flag with a `setInterval` refresh. Don't copy it for new code.

---

## Supabase

```typescript
import { supabase } from "@lib/supabaseClient"; // anon key; RLS applies to every call
```

There is no service-role client in the frontend. Admin powers come from the database (`supabase/migrations/20261026000000_admin_rls.sql`):

- `public.is_admin()` — true when the caller's `user_data.role = 'admin'`; used by the RLS policies.
- **RLS** — everyone reads/writes their own `user_data` row and logs/reads their own `user_events`; all signed-in users read `roles`; admins read/update/delete all `user_data`, write `roles`, and read all `user_events`.
- **`guard_user_data_role` trigger** — only admins can change `user_data.role` (non-admins may insert with `role` `'user'` or null).
- **`supabase.rpc("admin_delete_user", { target_user_id })`** — deletes a user's `user_data` row and auth account; admin-only, can't delete yourself.

New admin capability = new policy or `SECURITY DEFINER` function in a new migration, never a privileged key in the frontend. After DDL changes, run `supabase/verify_admin_rls.sql`.

Log user actions with `import { addEvent } from "@hooks/supabase"` → `addEvent(name, description, completed)`.

### Tables

- **`user_data`** — `user_id` (uuid PK), `user_email`, `role`, `tokens` (jsonb[] credentials), `favorite_tokens` (jsonb[]), `selected_tokens` (jsonb[]), `current_facility` (jsonb, or `{}`), `last_update_at`
  - **Facility references** — `favorite_tokens`, `selected_tokens` and `current_facility` store `{id, name, environment, propertyNumber, api}`; the secrets live only in `tokens` (matched on `api` + `environment`). AuthProvider's `setFavoriteTokens`/`setSelectedTokens`/`setCurrentFacility` re-attach them (`hydrateFacility`), so state always holds complete facilities. **Every write must go through `toFacilityRef(s)(value, tokens)`** from `@hooks/facilityRefs` — it drops the bearer token, and keeps inline secrets only when the owning user has no matching credential (deleted credentials, data copied by an admin). The `smartlock-overview` Edge Function hydrates the same way.
- **`user_events`** — `id`, `user_id`, `event_name` (e.g. `"Token Added"`), `event_description`, `completed` (bool), `created_at`
- **`roles`** — `id`, `role_name`, `role_description`, `permissions` (jsonb)

### Permissions object

Source of truth for the key list: `admin/roles/CreateRole.tsx`. Adding a permission means updating `CreateRole.tsx` and `EditRole.tsx`.

```typescript
{
  pmsPlatform, pmsPlatformAdmin,
  pmsPlatformUnitCreate, pmsPlatformUnitEdit, pmsPlatformUnitDelete,
  pmsPlatformVisitorCreate, pmsPlatformVisitorEdit, pmsPlatformVisitorDelete,
  smartlockPlatform,
  authenticationPlatform,
  authenticationPlatformCreate, authenticationPlatformDelete,
  authenticationPlatformImport, authenticationPlatformExport,
  authenticationPlatformEnvironmentProduction, authenticationPlatformEnvironmentDevelopment,
  authenticationPlatformEnvironmentStaging, authenticationPlatformEnvironmentQA,
}  // all boolean
```

---

## Shared Components

### `<LoadingSpinner loadingText="..." />`

Full-page overlay spinner. The parent must be `relative` and `overflow-hidden`:

```tsx
<div className={`relative ${isLoading ? "overflow-hidden min-h-full" : "overflow-auto"} h-full dark:text-white dark:bg-zinc-900`}>
  {isLoading && <LoadingSpinner loadingText="Loading..." />}
  ...
</div>
```

### `<DataTable columns={} data={} ... />`

Props: `columns`, `data` (full dataset, paginated internally), `currentPage`, `rowsPerPage`, `sortDirection` (`"asc" | "desc" | null`), `sortedColumn`, `onSort(columnKey, accessor?)`, and optional `hoveredRow`, `setHoveredRow`, `onRowClick`. Right-clicking a cell opens a built-in Copy Cell / Copy Row menu.

```typescript
{
  key: string,
  label: string,
  accessor?: (row) => any,             // sort/display value; defaults to row[key]
  render?: (row, index) => ReactNode,  // custom cell
  sortable?: boolean,                  // default true
}
```

Sorting is owned by the page: copy `handleColumnSort` from an existing list page (e.g. `Units.tsx`).

### `<PaginationFooter rowsPerPage setRowsPerPage currentPage setCurrentPage items />`

Call `setCurrentPage(1)` whenever the search query or a filter changes, or filtered results can land on an empty page.

### `<ModalContainer title icon mainContent responseContent onClose />`

Standard modal shell. Use `ModalButton` for buttons inside `responseContent`. Modals that build their own header should use `<ModalCloseButton onclick />` (`@components/ui/ModalCloseButton`) rather than a hand-rolled "x".

### UI components (note the lowercase `onchange`/`onclick` props)

```tsx
<InputBox value={} onchange={} placeholder="" type="text" />
<SelectOption value={} onChange={} options={[{id, name}]} placeholder="" />
<TableButton onclick={} text="" className="" />   // table row action
<ModalButton onclick={} text="" className="" />   // modal action
<GeneralButton onclick={} text="" className="" /> // general use
<SliderButton onclick={} value={bool} />          // toggle switch
```

### `<SidebarFooter onLogout />`

The three `*DashboardLayout.tsx` sidebars end with `<SidebarFooter onLogout={handleLogout} />` (Settings / Help / Logout).

### `<PageHeader icon title subtitle? meta? />` (top of every page)

```tsx
import PageHeader from "@components/shared/PageHeader";
<PageHeader icon={RiDoorLockFill} title="Units" subtitle={currentFacilityName} meta={pullDate} />
```

`subtitle` renders after a `|` separator; `meta` is right-aligned (e.g. a "last pulled" timestamp). Don't hand-roll the header bar.

---

## Routing

Top-level routes are in `src/app/App.tsx`; each platform layout (`PMSDashboardLayout`, `SmartSpaceDashboardLayout`, `AdminDashboardLayout`) owns a nested `<Routes>` for its sub-pages. Read those files for the current route list.

- `/` redirects to `/pms/all-facilities`; the catch-all `/*` renders Login. Each layout redirects its index and unknown sub-paths to its first page.
- **Permission gating happens in the `*Dashboard.tsx` wrappers** (`pmsPlatform`, `smartlockPlatform`, `role === "admin"`), which render `NotFound` on failure; leaf pages check finer-grained permissions (e.g. `pmsPlatformUnitCreate`) inline. `/pms/scripts` additionally requires `pmsPlatformAdmin` at both the sidebar link and the route.
- Nested routes use **relative** paths (`path="units"`) under the parent wildcard (`/pms/*`).
- Navigate with `useNavigate` + absolute paths (`navigate("/pms/units")`), never `Link to="units"` from within a layout.
- Navbar highlights the active platform with `pathname.startsWith("/pms" | "/smartspace" | "/admin")`; layouts highlight sub-sections with `pathname.includes("/pms/units")` etc.

---

## UI State

- **Dark mode** — `document.documentElement.classList` toggles `dark`; persisted in `localStorage.darkMode` (`"true"`/`"false"`); passed as `darkMode`/`toggleDarkMode` props from `App.tsx` through the layouts. Style with Tailwind `dark:` variants.
- **Other localStorage keys** — `bearerTokens`, `smartSpaceListView`, `smartSpaceToggledSections`, `smartSpaceExplicit`, `visitorAutofill`.
- **Toasts** — `react-hot-toast`, `<Toaster position="bottom-right" reverseOrder />` in `App.tsx`, default duration 2000ms. `toast.promise` takes a **Promise**: pass `fn()`, not `fn` (passing the reference silently does nothing).

```typescript
toast.promise(save(), { loading: "Saving...", success: <b>Saved!</b>, error: <b>Failed.</b> });
```

---

## Common Gotchas

1. **`currentFacility.token`** is only populated after a facility is selected. Guard API calls with `if (!currentFacility.token) return;`.
2. **`isPulled`** (AuthProvider) is set after the first Supabase fetch and prevents re-fetching. Only reset it to force a full reload.
3. **RLS fails silently** — an update/delete blocked by a policy doesn't error; it matches zero rows and returns success. When an admin write "succeeds" but nothing changes, check the policies (and that the caller's `role` really is `admin`).
4. **OAuth bodies use `qs.stringify()`** with `application/x-www-form-urlencoded`, not `JSON.stringify`.
5. **Windows case-only renames** (e.g. `UI` → `ui`) need a two-step rename through a temp name; the filesystem is case-insensitive.
