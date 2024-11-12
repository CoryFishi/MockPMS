import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";
import NotFound from "../components/NotFound";

export default function Admin({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const [userData, setUserData] = useState([]);
  const { user } = useAuth();
  const getUserData = async () => {
    if (!user) return;

    const { data, error } = await supabase.from("user_data").select("*"); // Admins can access all rows with this policy

    if (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
    console.log(data);
    console.log(user);
    return data;
  };
  useEffect(() => {
    getUserData();
  }, [user]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      {user ? (
        <div className="h-screen">
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <div className="flex flex-1 bg-darkSecondary h-full text-white">
            {userData}
          </div>
        </div>
      ) : (
        <div>
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <NotFound />
        </div>
      )}
    </div>
  );
}
