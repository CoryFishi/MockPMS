# Site Plan Mapping Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Do the tasks in order; each ends green (`npm run check`) and with a commit.

**Goal:** Replace the broken `smartspace/mapping/` prototype with a persisted, shared pre-install site planner: OpenNet, SmartLock and SmartMotion devices on a calibrated site-plan image, checked against the installation-manual rules, with BOM / PNG / CSV outputs.

**Spec:** `docs/superpowers/specs/2026-10-26-site-plan-mapping-design.md`. Read it first; this plan doesn't repeat its decisions.

**Tech Stack:** React 19, TypeScript, react-konva, TanStack React Query, Supabase (table + Storage), `pdfjs-dist` (new, lazy-loaded).

## Global Constraints

- `npm run check` stays at 0 errors after every task. Type everything new; no `any` in `model/`.
- Path aliases only (`@views/smartspace/mapping/...`, `@hooks/sitePlans`).
- `model/` is pure TypeScript — no React, no Konva — so it can be checked by a throwaway Node script.
- Pure-logic checks: write a throwaway script in the session scratchpad (not committed) and run it with `node --experimental-strip-types` (Node 24). Path aliases don't resolve there; import `model/` files by relative path from the scratch script.
- UI is verified by running the app (`npm run dev`); it needs real Supabase credentials. If you can't, say so — don't claim UI behaviour works.
- The migration is applied manually in the Supabase SQL editor. Don't apply it to the remote project without the user's go-ahead.
- Keep the user-facing route `/smartspace/mapping` and its sidebar label "Mapping".

---

### Task 1: Migration — `site_plans`, `has_permission`, bucket

**Files:** Create `supabase/migrations/20261026220000_site_plans.sql`; extend `supabase/verify_admin_rls.sql` with site-plan checks.

- [ ] `has_permission(key text)` — `language sql stable security definer set search_path = ''`:
  ```sql
  select public.is_admin() or coalesce((
    select (r.permissions ->> key)::boolean
    from public.user_data u join public.roles r on r.role_name = u.role
    where u.user_id = auth.uid()
  ), false);
  ```
  `revoke all … from public, anon; grant execute … to authenticated;`
- [ ] `site_plans` table per the spec; `layout jsonb not null default '{"version":1,"background":null,"scale":null,"nodes":[],"links":[],"shapes":[]}'`; `created_by` / `updated_by` reference `auth.users(id) on delete set null`; index on `updated_at desc`.
- [ ] `site_plans_stamp()` trigger function (`security definer`, `search_path = ''`): on insert set `created_by/created_by_email/created_at`; always set `updated_by/updated_by_email/updated_at`; on update, force `created_*` to `old.created_*`.
- [ ] RLS enabled; four policies (select/insert/update/delete) with `(select public.has_permission('smartlockPlatform'))`, delete additionally `created_by = (select auth.uid()) or (select public.is_admin())`.
- [ ] Bucket: `insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('site-plan-backgrounds', 'site-plan-backgrounds', false, 15728640, array['image/png','image/jpeg']) on conflict (id) do nothing;` plus four `storage.objects` policies scoped to `bucket_id = 'site-plan-backgrounds'` and `has_permission('smartlockPlatform')`.
- [ ] Whole file in `begin; … commit;`, idempotent (`drop … if exists` before create), header comment like the other migrations.
- [ ] Verify: `npm run check` (unchanged). Ask the user before applying; after applying, run the verify script.
- [ ] Commit `feat(mapping): site_plans table, has_permission and background bucket`.

### Task 2: Pure model — types, rules, geometry, unit numbers

**Files:** Create `mapping/model/types.ts`, `rules.ts`, `geometry.ts`, `unitNumbers.ts`.

- [ ] `types.ts` — exactly the spec's `PlanNode`, `PlanLink`, `PlanShape`, `PlanLayout`, plus `NodeType = PlanNode["type"]`, `SensorNode`, `OpenNetNode`, type guards `isSensor`, `isOpenNet`, `emptyLayout()`, and `PlanSummary = { edgeRouters, accessPoints, poeSwitches, smartLocks, smartMotion100, smartMotion200 }`.
- [ ] `rules.ts` — exported `RULES` const object: `OPENNET_LOS_FT: 656`, `OPENNET_NLOS_FT: 328`, `LOCK_ACROSS_FT: 200`, `LOCK_LATERAL_FT: 55`, `MOTION_FT: 100`, `WALL_FACTOR: 0.5`, `AP_CAPACITY: 100`, `AP_MIN_OPENNET_NEIGHBOURS: 2`, `AP_MIN_LOS_SENSORS: 2`, `LOCK_MIN_SENSOR_NEIGHBOURS: 2`, `MOTION_MIN_NEIGHBOURS: 1`, `POE_WATTS: 30`; plus `RULE_DESCRIPTIONS` (label, value, manual source) for the Rules tab.
- [ ] `geometry.ts` — `dist`, `segmentsIntersect(a,b,c,d)` (proper + collinear-overlap), `crossesAnyWall(p, q, wallSegments)`, `wallSegments(shapes)` (flatten wall polylines to segments), `inLockEllipse(lock, p, pxPerFt, factor)`, `inCircle(c, p, radiusPx)`, `pointsAlong(a, b, n)` (segment centres), `perpendicularDeg(a, b, flip)`.
- [ ] `unitNumbers.ts` — `nextUnit("A101", step) → "A102"`, `"A009" → "A010"`, `"B" → "B1"`; `unitSequence(first, n, step)`; `naturalCompare(a, b)`.
- [ ] Scratch check: unit sequences, ellipse membership at 0°/90°/45°, wall crossing true/false/touching.
- [ ] `npm run check`; commit `feat(mapping): typed plan model, rules and geometry`.

### Task 3: Pure model — `analyzePlan`, exports, history

**Files:** Create `mapping/model/analyze.ts`, `exports.ts`, `history.ts`.

- [ ] `analyzePlan(layout): Analysis` where
  ```ts
  interface Issue { id: string; severity: "error" | "warning"; message: string; nodeIds: string[] }
  interface Analysis {
    calibrated: boolean;
    wirelessLinks: { from: string; to: string; los: boolean }[];   // inferred only
    assignment: Record<string, string>;      // sensorId → ER/AP id
    hops: Record<string, number>;
    load: Record<string, number>;            // ER/AP id → assigned sensor count
    issues: Issue[];
    nodeSeverity: Record<string, "error" | "warning">;
  }
  ```
  Implement spec §Coverage analysis 1–7 exactly. Not calibrated → only the scale-independent issues (no ER, no ISP handoff, duplicate unit, motion with no area/unit) and empty links.
  Performance: bucket nodes into a uniform grid with cell = longest reach in px, and only test pairs in neighbouring cells; precompute wall segments once.
- [ ] `summarize(layout): PlanSummary`; `bom(summary)` rows incl. PoE watts; `lockInstallCsv(layout): string` (RFC 4180 quoting, header `Group,Unit,UID Last 4`, sorted group then `naturalCompare`).
- [ ] `history.ts` — `useHistory(initial)` hook (the one React file in `model/` — or put it at `mapping/useHistory.ts`): `{ present, set(next, {commit?: boolean}), undo, redo, canUndo, canRedo, reset(layout), markSaved(), dirty }`, capped at 100 past states. `set` with `commit: false` replaces present without pushing (used during live edits); `dirty` compares against the saved reference.
- [ ] Scratch check: a 2-AP + ER line at 500 ft with LOS → all linked; add a wall → ER–AP link drops (> 328 ft); a row of 10 locks 10 ft apart facing south next to an AP → no errors; move the AP 1,000 ft away → lock reachability errors; 1,000 random nodes analysed < 200 ms; CSV quoting of `"A,1"`.
- [ ] `npm run check`; commit `feat(mapping): coverage analysis, BOM/CSV and undo history`.

### Task 4: Data hooks — `@hooks/sitePlans`

**Files:** Create `src/hooks/sitePlans.ts`.

- [ ] Types `SitePlanRow` (all columns) and `SitePlanListRow` (all but `layout`).
- [ ] `useSitePlans()` — query `["sitePlans"]`, selects list columns ordered by `updated_at desc`.
- [ ] `useSitePlan(id)` — query `["sitePlan", id]`, full row; `layout` passed through `normalizeLayout` (fills missing arrays, rejects unknown `version`).
- [ ] Mutations (invalidate `["sitePlans"]`): `createPlan(details) → id`, `updatePlanDetails(id, details)`, `deletePlan(row)` (delete row, then remove the plan's Storage folder; ignore storage errors with a toast warning), `duplicatePlan(row)` (fetch layout, insert copy, `storage.copy` background to `{newId}/…`, patch `layout.background.path`).
- [ ] `savePlan({ id, loadedUpdatedAt, layout, summary, details })` → `{ ok: true, row } | { ok: false, reason: "conflict", current: SitePlanListRow } | { ok: false, reason: "deleted" }` using the conditional update in the spec. `forceSavePlan` drops the `updated_at` condition.
- [ ] `uploadBackground(planId, blob, ext)` → path; `useBackgroundUrl(path)` — signed URL (1 h) via React Query, `staleTime` 50 min.
- [ ] Log `addEvent("Site Plan Created" | "Site Plan Saved" | "Site Plan Deleted", name, true)`.
- [ ] `npm run check`; commit `feat(mapping): site plan data hooks`.

### Task 5: Plans list page, routes, remove the prototype

**Files:** Delete everything currently in `mapping/` (`applyChange.ts`, `CreateUnitModal.tsx`, `CreateWallModal.tsx`, `EditAccessPointModal.tsx`, `EditUnitModal.tsx`, `EditWallModal.tsx`, `facility1.json`, `FacilityMap.tsx`, `Sidebar.tsx`, `SmartSpaceMapping.tsx`). Create `SitePlans.tsx`, `PlanDetailsModal.tsx`, a placeholder `SitePlanEditor.tsx`. Modify `SmartSpaceDashboardLayout.tsx`.

- [ ] Routes: `<Route path="mapping" element={<SitePlans />} />` and `<Route path="mapping/:planId" element={<SitePlanEditor />} />`, both lazy.
- [ ] `SitePlans` — `PageHeader` (icon `RiMapPin2Line` or similar, title "Site Plans"), search (`useMemo` filter + `setCurrentPage(1)`), `DataTable` + `PaginationFooter` + `useTableSort`; columns from the spec; row click → `navigate("/smartspace/mapping/" + id)`; **New plan** opens `PlanDetailsModal` then navigates to the new plan; Duplicate / Delete as `TableButton`s, Delete only when `created_by === user.id || role === "admin"`, with a confirm modal. `LoadingSpinner` while pending.
- [ ] `PlanDetailsModal` — `ModalContainer`, `InputBox` fields, name required.
- [ ] Verify the old files are not referenced anywhere (`grep -rn "smartspace/mapping" src`). `npm run check`; run the app if possible.
- [ ] Commit `feat(mapping): site plans list page; remove mapping prototype`.

### Task 6: Editor shell — load, history, save, conflict

**Files:** `SitePlanEditor.tsx`, `EditorToolbar.tsx`, `modals/ConflictModal.tsx`, `panels/RulesPanel.tsx`.

- [ ] Load with `useSitePlan(planId)`; loading spinner; not-found state with Back.
- [ ] Hold `useHistory(layout)`; keep `loadedUpdatedAt` in state; `analysis = useMemo(() => analyzePlan(present), [present])`.
- [ ] Layout: toolbar row (Back, plan name + edit-details pencil, tool buttons, undo/redo, overlay toggles, Export menu, Save with dirty dot), canvas area (`flex-1 min-h-0`), right panel (w-80) with tabs Inspector / Issues (count badge) / Bill of Materials / Rules.
- [ ] Save + Ctrl+S → `savePlan`; on success `markSaved()` and update `loadedUpdatedAt`; on conflict open `ConflictModal` (Overwrite → `forceSavePlan`; Reload → refetch and `reset`); toast via `toast.promise(save(), …)`.
- [ ] `beforeunload` when dirty; Back confirms when dirty.
- [ ] Keyboard map registered once on `window` (ignored when focus is in an input): Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+S, Ctrl+C, Ctrl+V, Delete/Backspace, Esc, tool hotkeys (V select, H pan, E router, A access point, L lock, M motion, R row, W wall, B building).
- [ ] Rules tab renders `RULE_DESCRIPTIONS` plus the "planning aid, not a guarantee" note.
- [ ] `npm run check`; commit `feat(mapping): editor shell with save, conflict handling and undo`.

### Task 7: Canvas — background, pan/zoom, nodes, selection

**Files:** `PlanCanvas.tsx`, `NodeGlyph.tsx`.

- [ ] `Stage` sized to its container with `ResizeObserver`; view state `{ x, y, scale }`; wheel zoom around pointer (clamped 0.05–8); pan with Pan tool, space-drag or middle-drag; "Fit" button fits the background.
- [ ] Layers: background image (`useBackgroundUrl` → `HTMLImageElement`), shapes, explicit links, overlays (Task 9), nodes, interaction (selection box, tool previews).
- [ ] `NodeGlyph` per type, constant on-screen size (divide by view scale): ER = filled square + "ER", AP = filled circle + "AP", PoE = small rect, lock = small rounded rect rotated to `facingDeg` with a tick on the facing side and the unit number label, motion = triangle + label. Fill = assigned ER/AP colour (palette by AP index), ring = `nodeSeverity`.
- [ ] Selection: click, shift-click toggle, drag on empty canvas = box select (Select tool); dragging a selected node moves the whole selection (`set(..., {commit:false})` on move, commit on end).
- [ ] Copy/paste and delete wired to the editor's keyboard map through callbacks.
- [ ] Empty state when no background: centered "Upload a site plan" button (opens Task 8's modal); placing nodes still allowed on a blank 4000×3000 canvas.
- [ ] `npm run check`; run the app; commit `feat(mapping): canvas with pan/zoom, nodes and selection`.

### Task 8: Background upload, calibration, placement tools

**Files:** `modals/BackgroundModal.tsx`, `modals/CalibrateModal.tsx`, `modals/RowOfDoorsModal.tsx`, tool handling in `PlanCanvas.tsx`, `panels/Inspector.tsx`.

- [ ] `npm install pdfjs-dist`. `BackgroundModal`: file input (PNG/JPEG/PDF). PDF → `await import("pdfjs-dist")`, set `GlobalWorkerOptions.workerSrc` via `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`, page picker, render to canvas at a scale giving longest side ≤ 6000 px. Images downscaled the same way. Upload PNG (or original JPEG) via `uploadBackground`; set `layout.background` as one history step. Replacing a background warns that nodes keep their pixel positions.
- [ ] Set-scale tool: two clicks draw a reference line → `CalibrateModal` (feet, > 0) → `layout.scale`. Show the reference line dimmed with its length while the tool is active.
- [ ] Single-node tools: click places a node with defaults (labels `ER 1`, `AP 3`, lock unit = `nextUnit` of the last placed lock, facing 90°, motion PIR-100), selects it, stays in the tool.
- [ ] Row-of-doors tool: two clicks → `RowOfDoorsModal` (count, first unit, step, group, flip) → `pointsAlong` + `unitSequence` + `perpendicularDeg` → one history step.
- [ ] Wall / Building tools: click to add vertices, double-click or Enter to finish (building closes), Esc cancels.
- [ ] Wired / Tether link tools: click node A then node B (OpenNet nodes or PoE switch only), reject duplicates.
- [ ] Inspector: per-type fields (`InputBox`, `SelectOption`, `SliderButton` for ISP handoff, facing as degrees + rotate ±90 buttons); multi-lock bulk group/facing; selected link or shape shows kind + Delete.
- [ ] `npm run check`; run the app; commit `feat(mapping): background upload, calibration and placement tools`.

### Task 9: Coverage overlays and Issues panel

**Files:** `PlanCanvas.tsx` overlay layer, `panels/IssuesPanel.tsx`.

- [ ] Uncalibrated banner over the canvas with a "Set scale" button.
- [ ] Inferred wireless links: thin lines (OpenNet–OpenNet blue, sensor links grey), dashed when not LOS; `listening={false}`; toggle in the toolbar.
- [ ] Ranges: off / selected / all. ER/AP → two circles (LOS solid, NLOS dashed); lock → rotated `Ellipse`; motion → circle; translucent, `listening={false}`; use `perfectDrawEnabled={false}`.
- [ ] Issues panel: errors then warnings; click → select `nodeIds` and centre the view on their bounds; header shows counts and "All checks pass" when empty.
- [ ] Check with a 1,000-lock plan that dragging stays smooth (analysis is not recomputed during `commit:false` moves — memoize on the committed layout, or debounce).
- [ ] `npm run check`; run the app; commit `feat(mapping): coverage overlays and issues panel`.

### Task 10: Outputs — BOM, PNG, CSV

**Files:** `panels/BomPanel.tsx`, export actions in `SitePlanEditor.tsx`.

- [ ] BOM tab from `bom(summarize(present))`.
- [ ] Export PNG: temporarily set the stage view to identity (scale 1, origin 0) and size to the background, add a legend + BOM group in the corner, `stage.toDataURL({ pixelRatio: 1 })`, restore view; download `{name}.png`. Must not push a history step.
- [ ] Export lock install sheet: `lockInstallCsv` → Blob download.
- [ ] `summary` written on every save (already wired in Task 6 — verify list counts update).
- [ ] `npm run check`; commit `feat(mapping): BOM, PNG export and lock install sheet`.

### Task 11: Docs

- [ ] Update `CLAUDE.md`: Code Map line for `smartspace/mapping/` (site planner; `model/` is pure; `analyze.ts` holds the rules), Supabase section (`site_plans`, `has_permission`, `site-plan-backgrounds` bucket), localStorage keys unchanged.
- [ ] Set the spec's status to "Implemented".
- [ ] Commit `docs: site plan mapping`.
