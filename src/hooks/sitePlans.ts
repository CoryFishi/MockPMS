import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@lib/supabaseClient";
import { addEvent } from "@hooks/supabase";
import { emptyLayout, type PlanLayout, type PlanSummary } from "@views/smartspace/mapping/model/types";

// Site plans (SmartSpace → Mapping): the site_plans table plus background
// images in the site-plan-backgrounds bucket. See
// supabase/migrations/20261026220000_site_plans.sql.

export const SITE_PLANS_QUERY_KEY = "sitePlans";
export const SITE_PLAN_QUERY_KEY = "sitePlan";
export const BACKGROUND_BUCKET = "site-plan-backgrounds";

export interface SitePlanDetails {
  name: string;
  customer: string;
  address: string;
  notes: string;
}

export interface SitePlanListRow extends SitePlanDetails {
  id: string;
  summary: Partial<PlanSummary>;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_by: string | null;
  updated_by_email: string | null;
  updated_at: string;
}

export interface SitePlanRow extends SitePlanListRow {
  layout: PlanLayout;
}

const LIST_COLUMNS =
  "id, name, customer, address, notes, summary, created_by, created_by_email, created_at, updated_by, updated_by_email, updated_at";

/** Fills missing fields of a stored layout; throws on a version this build can't read. */
export function normalizeLayout(raw: unknown): PlanLayout {
  const value = (raw ?? {}) as Partial<PlanLayout>;
  if (value.version !== undefined && value.version !== 1) {
    throw new Error(`This plan was saved by a newer version (layout v${value.version}). Reload the app.`);
  }
  const base = emptyLayout();
  return {
    version: 1,
    background: value.background ?? base.background,
    scale: value.scale ?? base.scale,
    nodes: Array.isArray(value.nodes) ? value.nodes : [],
    links: Array.isArray(value.links) ? value.links : [],
    shapes: Array.isArray(value.shapes) ? value.shapes : [],
  };
}

function toRow(data: any): SitePlanRow {
  return { ...data, layout: normalizeLayout(data.layout) };
}

export function useSitePlans() {
  return useQuery({
    queryKey: [SITE_PLANS_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_plans")
        .select(LIST_COLUMNS)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SitePlanListRow[];
    },
    staleTime: 0,
  });
}

export function useSitePlan(id: string | undefined) {
  return useQuery({
    queryKey: [SITE_PLAN_QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_plans").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toRow(data) : null;
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function invalidateSitePlans(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: [SITE_PLANS_QUERY_KEY] });
}

export async function createPlan(details: SitePlanDetails): Promise<string> {
  const { data, error } = await supabase.from("site_plans").insert(details).select("id").single();
  if (error) throw error;
  addEvent("Site Plan Created", details.name, true);
  return data.id as string;
}

export async function updatePlanDetails(id: string, details: SitePlanDetails): Promise<SitePlanRow> {
  const { data, error } = await supabase.from("site_plans").update(details).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The plan was not found or you can't edit it.");
  return toRow(data);
}

export type SaveResult =
  | { ok: true; row: SitePlanRow }
  | { ok: false; reason: "conflict"; current: SitePlanListRow }
  | { ok: false; reason: "deleted" };

interface SaveInput {
  id: string;
  /** updated_at of the version being edited; null skips the conflict check. */
  loadedUpdatedAt: string | null;
  layout: PlanLayout;
  summary: PlanSummary;
}

/** Saves the layout unless someone else saved since `loadedUpdatedAt`. */
export async function savePlan({ id, loadedUpdatedAt, layout, summary }: SaveInput): Promise<SaveResult> {
  let query = supabase.from("site_plans").update({ layout, summary }).eq("id", id);
  if (loadedUpdatedAt) query = query.eq("updated_at", loadedUpdatedAt);
  const { data, error } = await query.select("*").maybeSingle();
  if (error) throw error;
  if (data) {
    addEvent("Site Plan Saved", data.name, true);
    return { ok: true, row: toRow(data) };
  }
  const { data: current, error: readError } = await supabase
    .from("site_plans")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;
  if (!current) return { ok: false, reason: "deleted" };
  return { ok: false, reason: "conflict", current: current as SitePlanListRow };
}

async function removeFolder(planId: string) {
  const { data, error } = await supabase.storage.from(BACKGROUND_BUCKET).list(planId);
  if (error) throw error;
  if (data && data.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(BACKGROUND_BUCKET)
      .remove(data.map((f) => `${planId}/${f.name}`));
    if (removeError) throw removeError;
  }
}

/** Deletes the plan, then its background images. Resolves `storageError` if only the images failed. */
export async function deletePlan(plan: SitePlanListRow): Promise<{ storageError: boolean }> {
  const { data, error } = await supabase.from("site_plans").delete().eq("id", plan.id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Only the plan's creator or an admin can delete it.");
  addEvent("Site Plan Deleted", plan.name, true);
  try {
    await removeFolder(plan.id);
    return { storageError: false };
  } catch {
    return { storageError: true };
  }
}

export async function duplicatePlan(plan: SitePlanListRow): Promise<string> {
  const { data: source, error } = await supabase.from("site_plans").select("*").eq("id", plan.id).single();
  if (error) throw error;
  const layout = normalizeLayout(source.layout);
  const { data: inserted, error: insertError } = await supabase
    .from("site_plans")
    .insert({
      name: `Copy of ${source.name}`,
      customer: source.customer,
      address: source.address,
      notes: source.notes,
      layout: { ...layout, background: null },
      summary: source.summary,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;
  const newId = inserted.id as string;

  if (layout.background) {
    const fileName = layout.background.path.split("/").pop();
    const newPath = `${newId}/${fileName}`;
    const { error: copyError } = await supabase.storage.from(BACKGROUND_BUCKET).copy(layout.background.path, newPath);
    if (copyError) throw copyError;
    const { error: updateError } = await supabase
      .from("site_plans")
      .update({ layout: { ...layout, background: { ...layout.background, path: newPath } } })
      .eq("id", newId);
    if (updateError) throw updateError;
  }
  addEvent("Site Plan Duplicated", `${source.name} → Copy of ${source.name}`, true);
  return newId;
}

/** Uploads a background image for a plan and returns its object path. */
export async function uploadBackground(planId: string, blob: Blob): Promise<string> {
  const ext = blob.type === "image/jpeg" ? "jpg" : "png";
  const path = `${planId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BACKGROUND_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) throw error;
  return path;
}

/** Signed URL for a background image, refreshed before its 1-hour expiry. */
export function useBackgroundUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["sitePlanBackground", path],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BACKGROUND_BUCKET).createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    gcTime: 55 * 60 * 1000,
  });
}
