import { useState } from "react";
import Navbar from "@components/shared/Navbar";
import SmartSpaceDashboardLayout from "@pages/SmartSpaceDashboard/SmartSpaceDashboardLayout";
import { useAuth } from "@context/AuthProvider";
import NotFound from "@components/shared/NotFound";

export default function SmartSpaceDashboard({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user, permissions } = useAuth();

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
          <SmartSpaceDashboardLayout dashboardMenu={dashboardMenu} />
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
