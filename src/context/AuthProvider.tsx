import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { supabase } from "@lib/supabaseClient";
import toast from "react-hot-toast";
import { IoWarning } from "react-icons/io5";
import { handleSingleLogin } from "@hooks/opentech";

type BearerMap = Record<string, { access_token: string; expires_at: number }>;

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [favoriteTokens, setFavoriteTokens] = useState([]);
  const [currentFacility, setCurrentFacility] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPulled, setIsPulled] = useState(false);
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState({});
  const [noUser, setNoUser] = useState(true);
  const [bearerTokens, setBearerTokens] = useState<BearerMap>({});

  // Keep a ref so the background refresh interval can read latest values
  // without being re-created every render
  const bearerTokensRef = useRef<BearerMap>(bearerTokens);
  const currentFacilityRef = useRef(currentFacility);
  const tokensRef = useRef(tokens);

  useEffect(() => { bearerTokensRef.current = bearerTokens; }, [bearerTokens]);
  useEffect(() => { currentFacilityRef.current = currentFacility; }, [currentFacility]);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);

  // Returns cached access_token for a credential, or null if missing/expired.
  // Stable reference (reads from ref) — safe to use in useCallback deps.
  const getBearerToken = useCallback((credential: any): string | null => {
    const key = `${credential.api}::${credential.environment}`;
    const entry = bearerTokensRef.current[key];
    if (!entry || Date.now() >= entry.expires_at) return null;
    return entry.access_token;
  }, []);

  // Authenticate a list of credentials in parallel and merge results into bearerTokens
  async function authenticateCredentials(creds: any[]) {
    if (!creds.length) return;
    const results = await Promise.allSettled(creds.map((c) => handleSingleLogin(c)));
    setBearerTokens((prev) => {
      const updated = { ...prev };
      results.forEach((result, i) => {
        if (result.status === "fulfilled" && 'token' in result.value) {
          const cred = creds[i];
          updated[`${cred.api}::${cred.environment}`] = {
            access_token: result.value.token.access_token,
            expires_at: Date.now() + result.value.token.expires_in * 1000,
          };
        }
      });
      return updated;
    });
  }

  // Background refresh: every 5 minutes, re-auth tokens expiring within 10 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      const allTokens = tokensRef.current;
      if (!allTokens.length) return;

      const stale = allTokens.filter((cred: any) => {
        const key = `${cred.api}::${cred.environment}`;
        const entry = bearerTokensRef.current[key];
        return !entry || entry.expires_at - Date.now() < 10 * 60 * 1000;
      });

      if (!stale.length) return;

      const results = await Promise.allSettled(stale.map((c: any) => handleSingleLogin(c)));
      setBearerTokens((prev) => {
        const updated = { ...prev };
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && 'token' in r.value) {
            const cred = stale[i];
            const key = `${cred.api}::${cred.environment}`;
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
  }, []);

  useEffect(() => {
    if (role) {
      const getUserPermissions = async () => {
        let { data } = await supabase
          .from("roles")
          .select("*")
          .eq("role_name", role);
        setPermissions(data[0].permissions);
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
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !isPulled) {
      setIsPulled(true);
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
          return null;
        } else {
          setCurrentFacility(data?.current_facility || {});
          setSelectedTokens(data?.selected_tokens || []);
          setFavoriteTokens(data?.favorite_tokens || []);
          setTokens(data?.tokens || []);
          setRole(data?.role || "");

          // Silently authenticate all stored credentials in the background
          if (data?.tokens?.length) {
            authenticateCredentials(data.tokens);
          }
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
  }, [user, isPulled]);

  // When tokens are updated externally (e.g. after adding a new credential),
  // authenticate any credential that doesn't yet have a cached bearer token
  useEffect(() => {
    if (!tokens.length) return;
    const missing = tokens.filter((cred: any) => {
      const key = `${cred.api}::${cred.environment}`;
      return !bearerTokensRef.current[key];
    });
    if (missing.length) {
      authenticateCredentials(missing);
    }
  }, [tokens]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
