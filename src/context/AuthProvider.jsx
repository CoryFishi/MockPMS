import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@app/supabaseClient";
import toast from "react-hot-toast";
import { IoWarning } from "react-icons/io5";

const AuthContext = createContext();

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
      setUser(sessionData?.user ?? null);
      if (sessionData) {
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
      listener?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !isPulled) {
      // Call all gets
      setIsPulled(true);
      // Get the current facility selection
      const getUserData = async () => {
        if (!user) throw new Error("User not signed in");

        const { data, error } = await supabase
          .from("user_data")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Insert a new row for the user
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

            // Set default state after successful insertion
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
                        <p className="text-sm font-medium text-gray-900">
                          Management Dashboard
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Looks like you have yet to authenticate any
                          facilities. Click{" "}
                          <span className="text-blue-500">here</span> to
                          authenticate a facility.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-200">
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
                      <p className="text-sm font-medium text-gray-900">
                        Management Dashboard
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Looks like you have yet to authenticate any facilities.
                        Click <span className="text-blue-500">here</span> to
                        authenticate a facility.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
