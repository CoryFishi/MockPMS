import Dashboard from "@views/pms/PMSDashboard";
import AuthenticationSettings from "@views/authentication-settings/AuthenticationSettings";
import SmartLockDashboard from "@views/smartspace/SmartSpaceDashboard";
import Login from "@views/auth/login/Login";
import Register from "@views/auth/register/Register";
import Admin from "@views/admin/AdminDashboard";
import UserSettings from "@views/user-settings/UserSettings";
import ResetPassword from "@views/auth/reset-password/ResetPassword";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedPreference = localStorage.getItem("darkMode");
    if (storedPreference === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

  return (
    <>
      <Toaster
        position="bottom-right"
        reverseOrder={true}
        toastOptions={{ duration: 2000 }}
      />
      <Routes>
        {/* Redirect root to PMS */}
        <Route path="/" element={<Navigate to="/pms/all-facilities" replace />} />

        {/* PMS */}
        <Route
          path="/pms/*"
          element={<Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* SmartSpace */}
        <Route
          path="/smartspace/*"
          element={<SmartLockDashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={<Admin darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />

        {/* Other pages */}
        <Route
          path="/authentication-settings"
          element={<AuthenticationSettings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/user-settings"
          element={<UserSettings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/login"
          element={<Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route
          path="/register"
          element={<Register darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Catch-all */}
        <Route
          path="/*"
          element={<Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        />
      </Routes>
    </>
  );
}

export default App;
