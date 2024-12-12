import { useState } from "react";
import Navbar from "../components/Navbar";
import SmartLockDashboardLayout from "../components/SmartLockDashboardLayout";
import { useAuth } from "../context/AuthProvider";
import NotFound from "../components/NotFound";

export default function SmartLockDashboard({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user, permissions, isLoading } = useAuth();

  return (
    <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      {user && permissions.smartlockPlatform ? (
        <div>
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <div className="flex flex-1">
            <SmartLockDashboardLayout dashboardMenu={dashboardMenu} />
          </div>
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
