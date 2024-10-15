import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import axios from "axios";
import qs from "qs";
import SmartLockAllFacilitiesPage from "./SmartLockAllFacilitiesPage";
import SmartLockSelectedPage from "./SmartLockSelectedPage";
import SmartLockDashboardView from "./SmartLockDashboardView";

export default function SmartLockDashboardLayout({
  dashboardMenu,
  selectedFacilities,
  setSelectedFacilities,
  savedFacilities = [],
}) {
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage2") || "allFacilities"
  );

  const navigate = useNavigate();

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check if savedFacilities is empty and alert the user
  useEffect(() => {
    if (savedFacilities.length === 0) {
      alert("Please authenticate a service, before proceeding...");
      navigate("/settings");
    }
  }, [savedFacilities, navigate]);

  return (
    <div className="flex flex-col w-full h-screen overflow-auto">
      <div className="flex flex-row w-full h-full">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full w-1/6 bg-navPrimary text-white text-xl dark:bg-darkNavPrimary border-r dark:border-border">
            {/* Header Side Bar */}
            <div>
              <h3 className="text-center m-5 text-2xl">OPENTECH IoE</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openPage === "dashboard" || openPage === "units"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                  : "dark:bg-darkNavPrimary"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("currentFacility")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill />
                  <span className="pl-2">Dashboard</span>
                </div>
                {openSections.currentFacility ? (
                  <MdExpandLess />
                ) : (
                  <MdExpandMore />
                )}
              </div>

              {!openSections.currentFacility && (
                <div className="ml-6 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("dashboard") &
                      localStorage.setItem("openPage2", "dashboard")
                    }
                    className="block hover:text-gray-300"
                  >
                    SmartLock
                  </Link>
                </div>
              )}
            </div>

            {/* Facilities Side Bar */}
            <div
              className={`border-t border-b pl-2 pr-2 border-gray-500 pb-8 ${
                openPage === "allFacilities" || openPage === "selected"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                  : "dark:bg-darkNavPrimary"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("facilities")}
              >
                <div className="flex items-center space-x-2">
                  <BsFillBuildingsFill />
                  <span>Other Options</span>
                </div>
                {openSections.facilities ? <MdExpandLess /> : <MdExpandMore />}
              </div>

              {!openSections.facilities && (
                <div className="ml-6 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("allFacilities") &
                      localStorage.setItem("openPage2", "allFacilities")
                    }
                    className="block hover:text-gray-300"
                  >
                    All Facilities
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("selected") &
                      localStorage.setItem("openPage2", "selected")
                    }
                    className="block hover:text-gray-300"
                  >
                    Selected Facilities
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 mb-14">
          {openPage === "dashboard" && (
            <SmartLockDashboardView
              selectedFacilities={selectedFacilities}
              setSelectedFacilities={setSelectedFacilities}
            />
          )}
          {openPage === "allFacilities" && (
            <SmartLockAllFacilitiesPage
              savedFacilities={savedFacilities}
              selectedFacilities={selectedFacilities}
              setSelectedFacilities={setSelectedFacilities}
              setOpenPage={setOpenPage}
            />
          )}
          {openPage === "selected" && (
            <SmartLockSelectedPage
              savedFacilities={savedFacilities}
              selectedFacilities={selectedFacilities}
              setSelectedFacilities={setSelectedFacilities}
              setOpenPage={setOpenPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
