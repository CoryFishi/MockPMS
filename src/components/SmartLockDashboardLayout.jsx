import React, { useState } from "react";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import SmartLockAllFacilitiesPage from "./SmartLockAllFacilitiesPage";
import SmartLockSelectedPage from "./SmartLockSelectedPage";
import SmartLockDashboardView from "./SmartLockDashboardView";
import SmartLockReports from "./SmartLockReports";

export default function SmartLockDashboardLayout({ dashboardMenu }) {
  // Drop down variables for the left navigation menu
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  // Open page state holder
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage2") || "allFacilities"
  );

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-auto">
      <div className="flex flex-row w-full h-full shrink-0">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full w-1/6 bg-navPrimary text-white text-xl dark:bg-darkNavPrimary border-r dark:border-border select-none">
            {/* Header Side Bar */}
            <div>
              <h3 className="text-center m-5 text-2xl">OPENTECH IoE</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openPage === "dashboard" || openPage === "reports"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                  : ""
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("currentFacility")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill
                    className={`${
                      openPage === "dashboard" || openPage === "reports"
                        ? "text-yellow-500"
                        : ""
                    }`}
                  />
                  <span className="pl-2">Dashboard</span>
                </div>
                {openSections.currentFacility ? (
                  <MdExpandLess />
                ) : (
                  <MdExpandMore />
                )}
              </div>

              {!openSections.currentFacility && (
                <div className="mx-4 mt-4 space-y-2">
                  <button
                    onClick={() =>
                      setOpenPage("dashboard") &
                      localStorage.setItem("openPage2", "dashboard")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left hover:cursor-pointer"
                  >
                    SmartLock
                  </button>
                  <button
                    onClick={() =>
                      setOpenPage("reports") &
                      localStorage.setItem("openPage2", "reports")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left hover:cursor-pointer"
                  >
                    Reports
                  </button>
                </div>
              )}
            </div>

            {/* Facilities Side Bar */}
            <div
              className={`border-t border-b pl-2 pr-2 border-gray-500 pb-8 ${
                openPage === "allFacilities" || openPage === "selected"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                  : ""
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("facilities")}
              >
                <div className="flex items-center space-x-2">
                  <BsFillBuildingsFill
                    className={`${
                      openPage === "allFacilities" || openPage === "selected"
                        ? "text-yellow-500"
                        : ""
                    }`}
                  />
                  <span>Other Options</span>
                </div>
                {openSections.facilities ? <MdExpandLess /> : <MdExpandMore />}
              </div>

              {!openSections.facilities && (
                <div className="mx-4 mt-4 space-y-2">
                  <button
                    onClick={() =>
                      setOpenPage("allFacilities") &
                      localStorage.setItem("openPage2", "allFacilities")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left hover:cursor-pointer"
                  >
                    All Facilities
                  </button>
                  <button
                    onClick={() =>
                      setOpenPage("selected") &
                      localStorage.setItem("openPage2", "selected")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary text-left w-full hover:cursor-pointer"
                  >
                    Selected Facilities
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 h-full">
          {openPage === "dashboard" && <SmartLockDashboardView />}
          {openPage === "reports" && <SmartLockReports />}
          {openPage === "allFacilities" && <SmartLockAllFacilitiesPage />}
          {openPage === "selected" && <SmartLockSelectedPage />}
        </div>
      </div>
    </div>
  );
}
