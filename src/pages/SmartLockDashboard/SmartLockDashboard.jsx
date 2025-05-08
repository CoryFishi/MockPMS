import { useState } from "react";
import Navbar from "../../components/shared/Navbar";
import SmartLockDashboardLayout from "../../pages/SmartLockDashboard/SmartLockDashboardLayout";
import { useAuth } from "../../context/AuthProvider";
import NotFound from "../../components/shared/NotFound";

export default function SmartLockDashboard({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user, permissions, isLoading } = useAuth();

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden font-roboto">
      {user && permissions.smartlockPlatform ? (
        <div className="flex flex-col flex-1 w-full min-h-full overflow-hidden">
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <SmartLockDashboardLayout dashboardMenu={dashboardMenu} />
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
