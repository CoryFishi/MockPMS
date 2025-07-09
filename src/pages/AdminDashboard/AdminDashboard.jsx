import { useState } from "react";
import Navbar from "@components/shared/Navbar";
import { useAuth } from "@context/AuthProvider";
import NotFound from "@components/shared/NotFound";
import AdminDashboardLayout from "./AdminDashboardLayout";
import PropTypes from "prop-types";

Admin.propTypes = {
  darkMode: PropTypes.bool.isRequired, // Boolean to determine if dark mode is enabled
  toggleDarkMode: PropTypes.func.isRequired, // Function to toggle dark mode
};

export default function Admin({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user, role } = useAuth();

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden font-roboto">
      {user && role === "admin" ? (
        <div className="flex flex-col flex-1 w-full min-h-full overflow-hidden">
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />

          <AdminDashboardLayout dashboardMenu={dashboardMenu} />
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
