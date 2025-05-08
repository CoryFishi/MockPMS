import Navbar from "../../components/shared/Navbar";
import NotFound from "../../components/shared/NotFound";
import PMSDashboardLayout from "./PMSDashboardLayout";
import { useAuth } from "../../context/AuthProvider";
import { useState } from "react";

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
          <PMSDashboardLayout dashboardMenu={dashboardMenu} />
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
