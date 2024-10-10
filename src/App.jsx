import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import { useState } from "react";

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
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;
