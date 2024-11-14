import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import { IoWarning } from "react-icons/io5";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [favoriteTokens, setFavoriteTokens] = useState([]);
  const [currentFacility, setCurrentFacility] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPulled, setIsPulled] = useState(false);
  const [role, setRole] = useState("");

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
        setCurrentFacility({});
        setSelectedTokens([]);
        setFavoriteTokens([]);
        setTokens([]);
        setRole("");
        return;
      }
      console.error("Error fetching user data:", error);
      return null;
    }
    setCurrentFacility(data?.current_facility || {});
    setSelectedTokens(data?.selected_tokens || []);
    setFavoriteTokens(data?.favorite_tokens || []);
    setTokens(data?.tokens || []);
    setRole(data?.role || "");
    if (data?.tokens < 1 && window.location.pathname !== "/settings") {
      toast.custom(
        (t) => (
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
            <div className="flex-1 w-0 p-4">
              <div
                className="flex items-center hover:cursor-pointer"
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.href =
                    "https://propertymanager-dev.netlify.app/settings";
                }}
              >
                <div className="flex-shrink-0 flex items-center justify-center">
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
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setUser(sessionData?.user ?? null);
      setIsLoading(false);
    };

    fetchSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
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
      getUserData();
    }
  }, [user]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
