import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import { useState, useEffect } from "react";

function App() {
  const [currentFacility, setCurrentFacility] = useState(
    JSON.parse(localStorage.getItem("currentFacility")) || {}
  );
  const [savedFacilities, setSavedFacilities] = useState(
    JSON.parse(localStorage.getItem("savedFacilities")) || {}
  );
  const [favoriteFacilities, setFavoriteFacilities] = useState(
    JSON.parse(localStorage.getItem("favoriteFacilities")) || []
  );

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
            <Home
              currentFacility={currentFacility}
              setCurrentFacility={setCurrentFacility}
              savedFacilities={savedFacilities}
              setSavedFacilities={setSavedFacilities}
              favoriteFacilities={favoriteFacilities}
              setFavoriteFacilities={setFavoriteFacilities}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <Settings
              currentFacility={currentFacility}
              setCurrentFacility={setCurrentFacility}
              savedFacilities={savedFacilities}
              setSavedFacilities={setSavedFacilities}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;
