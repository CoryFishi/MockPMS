// favorite_tokens, selected_tokens and current_facility store facility
// *references* — no bearer token, and no secrets when the user has the matching
// credential in user_data.tokens. Secrets are re-attached in memory by
// hydrateFacility. (Entries without a matching credential keep inline secrets,
// and hydration falls back to those.)

export interface FacilityRef {
  id: string | number;
  name?: string;
  environment: string;
  propertyNumber?: string | number;
  api: string; // credential username — with environment, identifies the credential
}

const findCredential = (ref: any, credentials: any[]) =>
  (credentials || []).find(
    (c: any) => c.api === ref.api && (c.environment ?? "") === (ref.environment ?? "")
  );

// What gets stored for a facility: a reference, plus inline secrets only when
// `credentials` (the owning user's saved tokens) has no matching credential —
// e.g. a credential since deleted, or data copied to a user without it — so
// such entries keep working. The bearer token is never stored.
export function toFacilityRef(facility: any, credentials: any[]): FacilityRef {
  const ref: any = {
    id: facility.id,
    name: facility.name,
    environment: facility.environment ?? "",
    propertyNumber: facility.propertyNumber,
    api: facility.api,
  };
  if (!findCredential(ref, credentials)) {
    ref.apiSecret = facility.apiSecret;
    ref.client = facility.client;
    ref.clientSecret = facility.clientSecret;
  }
  Object.keys(ref).forEach((k) => ref[k] === undefined && delete ref[k]);
  return ref;
}

export const toFacilityRefs = (facilities: any[] | null | undefined, credentials: any[]) =>
  (facilities || []).map((f) => toFacilityRef(f, credentials));

// Re-attach the credential secrets from the user's saved tokens
export function hydrateFacility<T extends Record<string, any>>(ref: T, credentials: any[]): T {
  if (!ref || !ref.api) return ref;
  const credential = findCredential(ref, credentials);
  if (!credential) return ref;
  return {
    ...ref,
    apiSecret: credential.apiSecret,
    client: credential.client,
    clientSecret: credential.clientSecret,
  };
}

export const hydrateFacilities = (refs: any[] | null | undefined, credentials: any[]) =>
  (refs || []).map((ref) => hydrateFacility(ref, credentials));

/**
 * Re-store a user's favorite/selected/current facilities after their
 * credentials change (`oldCredentials` → `newCredentials`). Stored references
 * get their secrets from the old credentials, so an entry whose credential was
 * removed keeps working with inline secrets instead of becoming unusable.
 * Include this in the same write as the new `tokens`.
 */
export function restoreFacilities(row: any, oldCredentials: any[], newCredentials: any[]) {
  const restore = (f: any) => toFacilityRef(hydrateFacility(f, oldCredentials), newCredentials);
  return {
    favorite_tokens: (row?.favorite_tokens || []).map(restore),
    selected_tokens: (row?.selected_tokens || []).map(restore),
    current_facility: row?.current_facility?.api
      ? restore(row.current_facility)
      : row?.current_facility || {},
  };
}
