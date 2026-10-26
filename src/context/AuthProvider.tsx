import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { supabase } from "@lib/supabaseClient";
import toast from "react-hot-toast";
import { IoWarning } from "react-icons/io5";
import { handleSingleLogin } from "@hooks/opentech";
import { hydrateFacility, hydrateFacilities } from "@hooks/facilityRefs";

type BearerMap = Record<string, { access_token: string; expires_at: number }>;

// Bearer cache survives reloads so a fresh page load doesn't re-authenticate
// every saved credential. Cleared on sign-out.
const BEARER_STORAGE_KEY = "bearerTokens";

const bearerKey = (credential: any) => `${credential.api}::${credential.environment}`;

function loadStoredBearers(): BearerMap {
  try {
    const stored: BearerMap = JSON.parse(localStorage.getItem(BEARER_STORAGE_KEY) || "{}");
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(stored).filter(([, entry]) => entry?.expires_at > now)
    );
  } catch {
    return {};
  }
}

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokensState] = useState([]);
  const [favoriteTokens, setFavoriteTokensState] = useState([]);
  const [currentFacility, setCurrentFacilityState] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPulled, setIsPulled] = useState(false);
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState({});
  const [noUser, setNoUser] = useState(true);
  const [bearerTokens, setBearerTokens] = useState<BearerMap>(loadStoredBearers);

  // Keep a ref so the background refresh interval can read latest values
  // without being re-created every render
  const bearerTokensRef = useRef<BearerMap>(bearerTokens);
  const currentFacilityRef = useRef(currentFacility);
  const tokensRef = useRef(tokens);

  // In-flight logins keyed by credential, so concurrent callers share one request
  const pendingLoginsRef = useRef<Map<string, Promise<string | null>>>(new Map());

  useEffect(() => {
    bearerTokensRef.current = bearerTokens;
    localStorage.setItem(BEARER_STORAGE_KEY, JSON.stringify(bearerTokens));
  }, [bearerTokens]);
  useEffect(() => { currentFacilityRef.current = currentFacility; }, [currentFacility]);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);

  // Stored favorite/selected/current facilities are references without secrets
  // (see @hooks/facilityRefs); these setters re-attach the secrets from the
  // saved credentials so consumers always get complete facilities.
  const setFavoriteTokens = useCallback((update: any) => {
    setFavoriteTokensState((prev) =>
      hydrateFacilities(typeof update === "function" ? update(prev) : update, tokensRef.current)
    );
  }, []);
  const setSelectedTokens = useCallback((update: any) => {
    setSelectedTokensState((prev) =>
      hydrateFacilities(typeof update === "function" ? update(prev) : update, tokensRef.current)
    );
  }, []);
  const setCurrentFacility = useCallback((update: any) => {
    setCurrentFacilityState((prev) =>
      hydrateFacility(typeof update === "function" ? update(prev) : update, tokensRef.current)
    );
  }, []);

  // Credentials added, removed or edited: refresh the attached secrets
  useEffect(() => {
    setFavoriteTokensState((prev) => hydrateFacilities(prev, tokens));
    setSelectedTokensState((prev) => hydrateFacilities(prev, tokens));
    setCurrentFacilityState((prev) => hydrateFacility(prev, tokens));
  }, [tokens]);

  // Returns cached access_token for a credential, or null if missing/expired.
  // Stable reference (reads from ref) — safe to use in useCallback deps.
  const getBearerToken = useCallback((credential: any): string | null => {
    const entry = bearerTokensRef.current[bearerKey(credential)];
    if (!entry || Date.now() >= entry.expires_at) return null;
    return entry.access_token;
  }, []);

  // Returns a bearer token for a credential: from cache, from a login already in
  // flight, or by logging in. Resolves null on failure (never throws). Stable.
  const ensureBearerToken = useCallback((credential: any): Promise<string | null> => {
    const cached = getBearerToken(credential);
    if (cached) return Promise.resolve(cached);

    const key = bearerKey(credential);
    const pending = pendingLoginsRef.current.get(key);
    if (pending) return pending;

    const login = handleSingleLogin(credential)
      .then((result) => {
        if (!("token" in result)) return null;
        const entry = {
          access_token: result.token.access_token,
          expires_at: Date.now() + result.token.expires_in * 1000,
        };
        // Update the ref now so callers that resolve before the next render hit the cache
        bearerTokensRef.current = { ...bearerTokensRef.current, [key]: entry };
        setBearerTokens((prev) => ({ ...prev, [key]: entry }));
        return entry.access_token;
      })
      .finally(() => pendingLoginsRef.current.delete(key));

    pendingLoginsRef.current.set(key, login);
    return login;
  }, [getBearerToken]);

  // Background refresh: every 5 minutes, re-auth tokens expiring within 10 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      const allTokens = tokensRef.current;
      if (!allTokens.length) return;

      const stale = allTokens.filter((cred: any) => {
        const entry = bearerTokensRef.current[bearerKey(cred)];
        return !entry || entry.expires_at - Date.now() < 10 * 60 * 1000;
      });

      if (!stale.length) return;

      const results = await Promise.allSettled(stale.map((c: any) => handleSingleLogin(c)));
      setBearerTokens((prev) => {
        const updated = { ...prev };
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && 'token' in r.value) {
            const cred = stale[i];
            const key = bearerKey(cred);
            const freshToken = r.value.token;
            updated[key] = {
              access_token: freshToken.access_token,
              expires_at: Date.now() + freshToken.expires_in * 1000,
            };
            // Patch currentFacility token in-place if this credential matches
            const cf = currentFacilityRef.current as any;
            if (cf?.api === cred.api && cf?.environment === cred.environment) {
              setCurrentFacility((prev: any) => ({ ...prev, token: freshToken }));
            }
          }
        });
        return updated;
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [setCurrentFacility]);

  useEffect(() => {
    if (role) {
      const getUserPermissions = async () => {
        try {
          let { data } = await supabase
            .from("roles")
            .select("*")
            .eq("role_name", role);
          setPermissions(data[0].permissions);
        } finally {
          // Auth is fully resolved once permissions are known (or failed)
          setIsLoading(false);
        }
      };
      getUserPermissions();
    }
  }, [role]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setUser(sessionData?.session?.user ?? null);
      if (sessionData?.session) {
        setNoUser(false);
      } else {
        setNoUser(true);
        setIsLoading(false);
      }
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "SIGNED_OUT") {
          localStorage.removeItem(BEARER_STORAGE_KEY);
          setBearerTokens({});
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !isPulled) {
      setIsPulled(true);
      // Re-enter loading while user data + permissions resolve (covers login
      // transitions, where isLoading was already set false by the no-session path)
      setIsLoading(true);
      const getUserData = async () => {
        if (!user) throw new Error("User not signed in");

        const { data, error } = await supabase
          .from("user_data")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            const { error: insertError } = await supabase
              .from("user_data")
              .insert({
                user_id: user.id,
                tokens: [],
                favorite_tokens: [],
                selected_tokens: [],
                current_facility: {},
                role: "user",
                user_email: user.email,
              });

            if (insertError) {
              console.error("Error inserting new user data:", insertError);
              setIsLoading(false);
              return null;
            }

            setCurrentFacility({});
            setSelectedTokens([]);
            setFavoriteTokens([]);
            setTokens([]);
            setRole("user");
            toast.custom(
              (t) => (
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
                  <div className="flex-1 w-0 p-4">
                    <div
                      className="flex items-center hover:cursor-pointer"
                      onClick={() => {
                        toast.dismiss(t.id);
                        window.location.href =
                          "https://propertymanager-dev.netlify.app/authentication-settings";
                      }}
                    >
                      <div className="shrink-0 flex items-center justify-center">
                        <IoWarning className="text-4xl" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-zinc-900">
                          Management Dashboard
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Looks like you have yet to authenticate any
                          facilities. Click{" "}
                          <span className="text-blue-500">here</span> to
                          authenticate a facility.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-zinc-200">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ),
              { duration: 30000 }
            );
            return;
          }
          console.error("Error fetching user data:", error);
          setIsLoading(false);
          return null;
        } else {
          const credentials = data?.tokens || [];
          setCurrentFacilityState(hydrateFacility(data?.current_facility || {}, credentials));
          setSelectedTokensState(hydrateFacilities(data?.selected_tokens, credentials));
          setFavoriteTokensState(hydrateFacilities(data?.favorite_tokens, credentials));
          setTokens(credentials);
          setRole(data?.role || "");
          // Empty role means the permissions effect never fires — resolve here
          if (!data?.role) setIsLoading(false);
          // Stored credentials are authenticated by the `tokens` effect below
        }
        if (
          data?.tokens < 1 &&
          data?.favorite_tokens < 1 &&
          data?.current_facility &&
          data?.selected_tokens < 1 &&
          window.location.pathname !== "/authentication-settings"
        ) {
          toast.custom(
            (t) => (
              <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
                <div className="flex-1 w-0 p-4">
                  <div
                    className="flex items-center hover:cursor-pointer"
                    onClick={() => {
                      toast.dismiss(t.id);
                      window.location.href =
                        "https://propertymanager-dev.netlify.app/authentication-settings";
                    }}
                  >
                    <div className="shrink-0 flex items-center justify-center">
                      <IoWarning className="text-4xl" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-zinc-900">
                        Management Dashboard
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Looks like you have yet to authenticate any facilities.
                        Click <span className="text-blue-500">here</span> to
                        authenticate a facility.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-zinc-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ),
            { duration: 30000 }
          );
        }
      };
      getUserData();
    }
  }, [user, isPulled, setCurrentFacility, setFavoriteTokens, setSelectedTokens]);

  // On load and whenever tokens change (e.g. after adding a credential),
  // authenticate any credential without a valid cached bearer token.
  // ensureBearerToken dedupes against logins pages have already started.
  useEffect(() => {
    tokens.forEach((cred: any) => { ensureBearerToken(cred); });
  }, [tokens, ensureBearerToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        role,
        isPulled,
        setIsPulled,
        tokens,
        setTokens,
        favoriteTokens,
        setFavoriteTokens,
        selectedTokens,
        setSelectedTokens,
        currentFacility,
        setCurrentFacility,
        isLoading,
        permissions,
        noUser,
        bearerTokens,
        getBearerToken,
        ensureBearerToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
