import { useState } from "react";
import Navbar from "../components/Navbar";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthProvider";
import NotFound from "../components/NotFound";

export default function Dashboard({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user, permissions } = useAuth();

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden font-roboto">
      {user && permissions.pmsPlatform ? (
        <div className="flex flex-col flex-1 w-full min-h-full overflow-hidden">
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <DashboardLayout dashboardMenu={dashboardMenu} />
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
