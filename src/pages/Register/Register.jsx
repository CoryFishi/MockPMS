import Navbar from "@components/shared/Navbar";
import RegisterComp from "@features/auth/pages/RegisterComp";
import { useState, useEffect } from "react";
import { useAuth } from "@context/AuthProvider";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

Register.propTypes = {
  darkMode: PropTypes.bool.isRequired, // Boolean to determine if dark mode is enabled
  toggleDarkMode: PropTypes.func.isRequired, // Function to toggle dark mode
};

export default function Register({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading && user) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      <Navbar
        setDashboardMenu={setDashboardMenu}
        dashboardMenu={dashboardMenu}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <RegisterComp />
    </div>
  );
}
