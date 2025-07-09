import Navbar from "@components/shared/Navbar";
import NotFound from "@components/shared/NotFound";
import PMSDashboardLayout from "./PMSDashboardLayout";
import { useAuth } from "@context/AuthProvider";
import { useState } from "react";
import PropTypes from "prop-types";

Dashboard.propTypes = {
  darkMode: PropTypes.bool.isRequired, // Boolean to determine if dark mode is enabled
  toggleDarkMode: PropTypes.func.isRequired, // Function to toggle dark mode
};

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
          <PMSDashboardLayout
            dashboardMenu={dashboardMenu}
            setDashboardMenu={setDashboardMenu}
          />
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
