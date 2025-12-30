import Navbar from "@components/shared/Navbar";
import LoginComp from "@features/auth/pages/LoginComp";
import { useAuth } from "@context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Login({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
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
      <LoginComp />
    </div>
  );
}
