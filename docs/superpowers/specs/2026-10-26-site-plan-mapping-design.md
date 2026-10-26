# Site Plan Mapping — Design

**Date:** 2026-10-26
**Status:** Approved (grilling session, Q1–Q23)
**Scope:** Rebuild SmartSpace → Mapping as a pre-install site planner for OpenNet,
SmartLock S and SmartMotion.

## Problem

`src/components/app/smartspace/mapping/` is a broken prototype: the layout lives
only in `useState` (reload loses it), `facility1.json` is hard-coded sample data,
it models units/doors/walls and a lock-to-lock "cone + crossing penalty" RF
simulation, and has no notion of an Edge Router, Access Point tiers or SmartMotion.

## Purpose

Plan an install **before anything exists in CIA** — no facility, unit or device
records to link to. A plan is authored at a desk (onboarding / sales engineering)
from the customer's site plan; installers receive the exports.

## Goals

- Standalone, shared, persisted **site plans**.
- Place OpenNet, SmartLock and SmartMotion devices on a calibrated site-plan image.
- Check coverage with rules taken from the installation manuals, not RF simulation.
- Produce a bill of materials, a printable map, and the lock install sheet.

## Non-Goals (v1)

- Linking a plan to an OpenTech facility, units or devices; live status overlay.
- Multiple sheets (buildings / floors) — schema leaves room (`version` field).
- Autosave, real-time collaboration, grid snapping, auto-suggested AP positions.
- Per-plan rule overrides.

## Source facts (installation manuals)

| Device | Range | Neighbour rule | Other |
|---|---|---|---|
| Edge Router / Access Point (OpenNet, same hardware) | 656 ft (200 m) line of sight; 328 ft (100 m) without | path to ≥2 OpenNet devices (ER or AP) | ~100 smart devices per AP; ≥2 smart devices with LOS per AP; PoE+ 30 W each |
| SmartLock S | 200 ft (60 m) across, 55 ft (16 m) laterally | ≥2 other sensors or ≥1 AP/ER | one per unit door; install sheet = unit + last 4 of UID |
| SmartMotion PIR-100 / PIR-200 | 100 ft (30 m) | ≥1 other sensor or AP/ER | assigned to an area or a unit; indoor only |

## Decisions

### Rebuild

Delete every file in `mapping/` (incl. `facility1.json`, unit/wall/AP modals,
`applyChange.ts`). Rebuild typed; keep only the react-konva idioms.

### Data model

All coordinates are **background-image pixels**; `scale.pxPerFt` converts.

```ts
type Board = "DR5018S" | "IPQ6018";

type PlanNode =
  | { id: string; type: "edgeRouter";  x: number; y: number; label: string; board: Board; ispHandoff: boolean }
  | { id: string; type: "accessPoint"; x: number; y: number; label: string; board: Board }
  | { id: string; type: "poeSwitch";   x: number; y: number; label: string }
  | { id: string; type: "smartLock";   x: number; y: number; unit: string; facingDeg: number; group: string }
  | { id: string; type: "smartMotion"; x: number; y: number; model: "PIR-100" | "PIR-200"; area: string; unit: string };

interface PlanLink  { id: string; from: string; to: string; kind: "wired" | "tether" }  // explicit only
interface PlanShape { id: string; kind: "building" | "wall"; points: number[] }       // flat [x1,y1,x2,y2,…]

interface PlanLayout {
  version: 1;
  background: { path: string; width: number; height: number } | null;  // Storage object path
  scale: { pxPerFt: number; ref: { x1: number; y1: number; x2: number; y2: number; feet: number } } | null;
  nodes: PlanNode[];
  links: PlanLink[];
  shapes: PlanShape[];
}
```

`building` shapes are closed outlines (visual only). `wall` shapes are polylines
that block line of sight. A future `sheets[]` is a `version: 2` layout upgraded in
code — no DB migration.

### Storage (Supabase)

New migration `supabase/migrations/20261026220000_site_plans.sql`:

- **`public.has_permission(key text) returns boolean`** — `SECURITY DEFINER`;
  true when the caller's `user_data.role` matches a `roles.role_name` whose
  `permissions->>key = 'true'`, or `is_admin()`.
- **`public.site_plans`** — `id uuid pk`, `name text not null`, `customer`,
  `address`, `notes` (text, default `''`), `layout jsonb not null`,
  `summary jsonb not null default '{}'` (device counts, written by the client on
  save so the list never loads layouts), `created_by uuid`, `created_by_email`,
  `created_at`, `updated_by uuid`, `updated_by_email`, `updated_at`.
- **Trigger** `site_plans_stamp` (before insert/update) sets
  `updated_at = now()`, `updated_by = auth.uid()`,
  `updated_by_email = auth.jwt()->>'email'`; on insert also the `created_*`
  columns. Clients never send these.
- **RLS** — select/insert/update: `has_permission('smartlockPlatform')`;
  delete: that **and** (`created_by = auth.uid()` or `is_admin()`). All wrapped in
  `(select …)` per `20261026200000_rls_performance.sql`.
- **Bucket** `site-plan-backgrounds` — private, 15 MB limit, PNG/JPEG only.
  Objects at `{planId}/{uuid}.{ext}`. Storage policies: select/insert/update/delete
  for `has_permission('smartlockPlatform')`. Displayed via signed URLs.

Applied manually in the SQL editor like the other migrations.

**Concurrency** — save is
`update … set layout, summary, name, … where id = :id and updated_at = :loadedUpdatedAt`
returning the row. Zero rows → re-read the row: if it exists, show
"{updated_by_email} saved this plan at {updated_at} — Overwrite / Reload";
if not, "This plan was deleted."

### Pages and routes

- `/smartspace/mapping` → **SitePlans** list: `PageHeader`, search, `DataTable`
  (name, customer, address, ER/AP/lock/motion counts from `summary`, updated by,
  updated at), **New plan**, row actions **Duplicate** and **Delete** (delete shown
  only to creator/admin). Duplicate copies the row as "Copy of {name}" and copies
  the background object to the new plan's folder.
- `/smartspace/mapping/:planId` → **SitePlanEditor**.
- New-plan / plan-details modal: name (required), customer, address, notes.
- Gated by the existing `smartlockPlatform` check in the SmartSpace wrapper.

### Editor

Layout: top toolbar · canvas (fills remaining space) · right panel with tabs
**Inspector / Issues / Bill of Materials / Rules**.

**Background** — upload PNG/JPEG or PDF. PDFs are rendered client-side with a
lazy-loaded `pdfjs-dist` (page picker for multi-page PDFs) to a PNG; only the PNG
is uploaded. Any image is downscaled so its longest side is ≤ 6000 px.

**Calibration** — "Set scale" tool: click two points, enter the length in feet.
Until calibrated, range overlays, inferred links and rule checks are off and a
banner says "Set the scale to enable coverage checks". Re-calibrating keeps node
positions (they're in image pixels).

**Tools** — Select (default) · Pan (also space-drag / middle-drag) · Edge Router ·
Access Point · PoE Switch · SmartLock · SmartMotion · Row of doors · Building
outline · Wall · Wired link · Tether link · Set scale. `Esc` returns to Select.

**Row of doors** — click start, click end, then a modal: count N, first unit
number, step (default 1), group, "flip side". Places N locks at the centres of N
equal segments, facing perpendicular to the line. Unit numbers increment the
trailing digits (`A101` → `A102`, keeping zero padding).

**Editing** — click / shift-click / box-select; drag moves the selection;
Delete removes it (and any links touching removed nodes); Ctrl+C / Ctrl+V pastes
with a 20 px offset and new ids; Ctrl+Z / Ctrl+Shift+Z (and Ctrl+Y) undo/redo, up
to 100 steps, drags commit one step on drag end. Wheel zooms around the cursor.

**Inspector** — edits the selected node's fields; multi-selection shows the count
and, for locks only, bulk-edits group and facing.

**Save** — explicit Save button (and Ctrl+S); dirty indicator; `beforeunload`
warning when dirty; the editor's own Back button confirms when dirty. Sidebar /
navbar links are not intercepted (`BrowserRouter` has no `useBlocker`) — known
limitation.

### Coverage analysis (`analyzePlan`, pure)

Runs only when calibrated, memoized on the layout (not during a drag). Constants
live in one `rules.ts` and are shown read-only in the Rules tab.

1. **Line of sight** — a pair is LOS unless the segment between them crosses any
   `wall` polyline segment.
2. **OpenNet ↔ OpenNet wireless link** (ER/AP pairs): distance ≤ 656 ft with LOS,
   ≤ 328 ft without.
3. **Sensor reach** — SmartMotion: circle radius 100 ft. SmartLock: ellipse
   centred on the lock, semi-axis 200 ft along `facingDeg`, 55 ft perpendicular.
   If the segment crosses a wall, the reach is multiplied by `WALL_FACTOR = 0.5`
   (once, however many walls).
4. **Sensor ↔ sensor link** — each lies within the other's (wall-reduced) reach.
   **Sensor ↔ ER/AP link** — the sensor's reach contains the ER/AP.
5. **Explicit links** — wired/tether links always connect, regardless of
   distance; a PoE switch only participates through explicit links.
6. **Assignment** — multi-source BFS from every ER/AP over sensor links; each
   sensor gets the ER/AP with the fewest hops, ties by straight-line distance.
   Sensors are coloured by their ER/AP.
7. **Issues** (`error` / `warning`, each with the node ids involved):
   - error: no Edge Router; warning: no Edge Router has `ispHandoff`.
   - error: ER/AP with fewer than 2 OpenNet neighbours (wireless or explicit).
   - error: ER/AP not connected to an Edge Router through OpenNet links.
   - error: SmartLock with fewer than 2 sensor neighbours and no ER/AP neighbour.
   - error: SmartMotion with no sensor or ER/AP neighbour.
   - error: sensor with no mesh path to an ER/AP that reaches an Edge Router.
   - warning: ER/AP with more than 100 assigned sensors.
   - warning: ER/AP with fewer than 2 LOS sensor links.
   - warning: duplicate SmartLock unit number.
   - warning: SmartMotion with neither area nor unit.
8. **Overlays** — toggle "Ranges: off / selected / all" (default selected);
   toggle "Links" for inferred wireless links (default on). Explicit links always
   drawn (wired solid, tether dashed). Nodes with errors get a red ring, warnings
   amber. Clicking an issue selects and centres its nodes.

Performance target: 1,000 nodes / 200 wall segments analysed in < 200 ms.

### Outputs

- **Bill of materials** tab: Edge Routers, Access Points (by board), PoE switches,
  SmartLocks, SmartMotion PIR-100 / PIR-200, PoE budget = 30 W × (ER + AP).
- **Export PNG** — the whole background at its native resolution with nodes,
  explicit links and a legend + BOM box; overlays as currently toggled.
- **Export lock install sheet (CSV)** — columns `Group, Unit, UID Last 4`
  (blank), sorted by group then natural unit order; filename
  `{plan name} - lock install sheet.csv`.

## Files

```
supabase/migrations/20261026220000_site_plans.sql
src/hooks/sitePlans.ts                       # React Query hooks + Storage helpers
src/components/app/smartspace/mapping/
  SitePlans.tsx                              # list page
  PlanDetailsModal.tsx                       # new / edit details
  SitePlanEditor.tsx                         # load, history, save, layout
  EditorToolbar.tsx
  PlanCanvas.tsx                             # Konva stage, tools, selection
  NodeGlyph.tsx                              # per-type node rendering
  panels/{Inspector,IssuesPanel,BomPanel,RulesPanel}.tsx
  modals/{BackgroundModal,CalibrateModal,RowOfDoorsModal,ConflictModal}.tsx
  model/types.ts  model/rules.ts  model/geometry.ts
  model/analyze.ts  model/history.ts  model/unitNumbers.ts  model/exports.ts
```

## Risks

- Manuals give no RSSI data; rule checks are a planning aid, not a guarantee.
  The Rules tab says so.
- "Across" / "laterally" for SmartLock is interpreted as along / perpendicular to
  the door's facing. Confirm with the field team.
- Treating the Edge Router as a sensor sink (Q13) is an assumption to confirm.
