import React, { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [favoriteTokens, setFavoriteTokens] = useState([]);
  const [currentFacility, setCurrentFacility] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPulled, setIsPulled] = useState(false);

  // Get all saved Tokens
  const getUserTokens = async () => {
    if (!user) throw new Error("User not signed in");

    const { data, error } = await supabase
      .from("user_data")
      .select("tokens")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching tokens:", error);
      return null;
    }
    setTokens(data?.tokens || []);
  };

  // Get all favorited tokens
  const getUserFavoriteTokens = async () => {
    if (!user) throw new Error("User not signed in");

    const { data, error } = await supabase
      .from("user_data")
      .select("favorite_tokens")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching tokens:", error);
      return null;
    }
    setFavoriteTokens(data?.favorite_tokens || []);
  };

  // Get all selected tokens
  const getUserSelectedTokens = async () => {
    if (!user) throw new Error("User not signed in");

    const { data, error } = await supabase
      .from("user_data")
      .select("selected_tokens")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching tokens:", error);
      return null;
    }
    setSelectedTokens(data?.selected_tokens || []);
  };

  // Get the current facility selection
  const GetUserCurrentFacility = async () => {
    if (!user) throw new Error("User not signed in");

    const { data, error } = await supabase
      .from("user_data")
      .select("current_facility")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching tokens:", error);
      return null;
    }
    setCurrentFacility(data?.current_facility || {});
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
      getUserTokens();
      getUserFavoriteTokens();
      getUserSelectedTokens();
      GetUserCurrentFacility();
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
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
