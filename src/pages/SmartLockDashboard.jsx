import { useState } from "react";
import Navbar from "../components/Navbar";
import SmartLockDashboardLayout from "../components/SmartLockDashboardLayout";

export default function SmartLockDashboard({
  currentFacility,
  setCurrentFacility,
  savedFacilities,
  setSavedFacilities,
  selectedFacilities,
  setSelectedFacilities,
  darkMode,
  toggleDarkMode,
}) {
  const [dashboardMenu, setDashboardMenu] = useState(true);

  return (
    <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      <Navbar
        setDashboardMenu={setDashboardMenu}
        dashboardMenu={dashboardMenu}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <div className="flex flex-1">
        <SmartLockDashboardLayout
          dashboardMenu={dashboardMenu}
          currentFacility={currentFacility}
          setCurrentFacility={setCurrentFacility}
          savedFacilities={
            Array.isArray(savedFacilities) ? savedFacilities : []
          }
          setSavedFacilities={setSavedFacilities}
          selectedFacilities={selectedFacilities}
          setSelectedFacilities={setSelectedFacilities}
        />
      </div>
    </div>
  );
}
