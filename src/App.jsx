import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import { useState, useEffect } from "react";
import SmartLockDashboard from "./pages/SmartLockDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Check localStorage for dark mode preference on initial render
  useEffect(() => {
    const storedPreference = localStorage.getItem("darkMode");
    if (storedPreference === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark mode and save preference to localStorage
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
      <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/smartlock"
          element={
            <SmartLockDashboard
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <Settings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/login"
          element={
            <Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/register"
          element={
            <Register darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/admin"
          element={
            <Admin darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
        <Route
          path="/*"
          element={
            <Login darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          }
        />
      </Routes>
    </>
  );
}

export default App;
