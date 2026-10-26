import Login from "@views/auth/login/Login";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect, lazy, Suspense } from "react";

// Each platform is its own chunk, so the first load only downloads what's shown
const Dashboard = lazy(() => import("@views/pms/PMSDashboard"));
const SmartLockDashboard = lazy(() => import("@views/smartspace/SmartSpaceDashboard"));
const Admin = lazy(() => import("@views/admin/AdminDashboard"));
const AuthenticationSettings = lazy(() => import("@views/authentication-settings/AuthenticationSettings"));
const UserSettings = lazy(() => import("@views/user-settings/UserSettings"));
const Register = lazy(() => import("@views/auth/register/Register"));
const ResetPassword = lazy(() => import("@views/auth/reset-password/ResetPassword"));

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
      <Suspense
        fallback={
          <div className="relative h-screen overflow-hidden dark:bg-zinc-900">
            <LoadingSpinner loadingText="" />
          </div>
        }
      >
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
      </Suspense>
    </>
  );
}

export default App;
