import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import SignIn from "../components/SignIn";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

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
      <SignIn />
    </div>
  );
}
