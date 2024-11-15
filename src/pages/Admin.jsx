import { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthProvider";
import NotFound from "../components/NotFound";
import AdminDashboardLayout from "../components/AdminDashboardLayout";

export default function Admin({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user } = useAuth();

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
          <div className="flex flex-1">
            <AdminDashboardLayout dashboardMenu={dashboardMenu} />
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
