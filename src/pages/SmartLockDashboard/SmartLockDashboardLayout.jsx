import SmartLockAllFacilitiesPage from "@features/smartlock/pages/SmartLockAllFacilities";
import SmartLockSelectedPage from "@features/smartlock/pages/SmartLockSelected";
import SmartLockDashboardView from "@features/smartlock/pages/SmartLockDashboard";
import SmartLockReports from "@features/smartlock/pages/SmartLockReports";
import SmartLockDocumentationPage from "@features/smartlock/pages/SmartLockDocumentation";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import PropTypes from "prop-types";
import SmartLockMapping from "@features/smartlock/pages/SmartLockMapping";

SmartLockDashboardLayout.propTypes = {
  dashboardMenu: PropTypes.bool, // Boolean to determine if the dashboard menu should be displayed
};

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
    <div className="flex flex-col w-full h-screen overflow-y-auto overflow-hidden">
      <div className="flex flex-row w-full h-full shrink-0">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full md:min-w-[250px] min-w-full bg-navPrimary text-white dark:bg-darkNavPrimary border-r dark:border-border select-none text-lg relative">
            {/* Header Side Bar */}
            <div className="pt-2">
              <h3 className="text-center m-5 text-xl">OpenTech Smarts</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openPage === "dashboard" ||
                openPage === "reports" ||
                openPage === "mapping"
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
                      openPage === "dashboard" ||
                      openPage === "reports" ||
                      openPage === "mapping"
                        ? "text-yellow-500"
                        : ""
                    }`}
                  />
                  <span className="pl-1 truncate max-w-[18ch]">Dashboard</span>
                </div>
                {openSections.currentFacility ? (
                  <MdExpandLess className="flex-shrink-0 text-2xl" />
                ) : (
                  <MdExpandMore className="flex-shrink-0 text-2xl" />
                )}
              </div>

              {!openSections.currentFacility && (
                <div className="mx-4 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("dashboard") &
                      localStorage.setItem("openPage2", "dashboard")
                    }
                    className={`px-2 block hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left cursor-pointer ${
                      openPage === "dashboard"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    }`}
                  >
                    SmartLock
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("reports") &
                      localStorage.setItem("openPage2", "reports")
                    }
                    className={`px-2 block hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left cursor-pointer ${
                      openPage === "reports"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    }`}
                  >
                    Reports
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("mapping") &
                      localStorage.setItem("openPage2", "mapping")
                    }
                    className={`px-2 block hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left cursor-pointer ${
                      openPage === "mapping"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    }`}
                  >
                    Mapping
                  </Link>
                </div>
              )}
            </div>

            {/* Other Options */}
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
                  <span className="pl-1 truncate max-w-[18ch]">
                    Other Options
                  </span>
                </div>
                {openSections.facilities ? (
                  <MdExpandLess className="flex-shrink-0 text-2xl" />
                ) : (
                  <MdExpandMore className="flex-shrink-0 text-2xl" />
                )}
              </div>

              {!openSections.facilities && (
                <div className="mx-4 mt-4 space-y-2">
                  <button
                    onClick={() =>
                      setOpenPage("allFacilities") &
                      localStorage.setItem("openPage2", "allFacilities")
                    }
                    className={`px-2 block hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left cursor-pointer ${
                      openPage === "allFacilities"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    }`}
                  >
                    All Facilities
                  </button>
                  <button
                    onClick={() =>
                      setOpenPage("selected") &
                      localStorage.setItem("openPage2", "selected")
                    }
                    className={`px-2 block hover:bg-darkNavSecondary dark:hover:bg-darkPrimary w-full text-left cursor-pointer ${
                      openPage === "selected"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    }`}
                  >
                    Selected Facilities
                  </button>
                  {/* <button
                    onClick={() =>
                      setOpenPage("documentation") &
                      localStorage.setItem("openPage2", "documentation")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary text-left w-full hover:cursor-pointer"
                  >
                    Documentation
                  </button> */}
                </div>
              )}
            </div>

            <div className="absolute bottom-0 w-full hidden md:flex justify-between text-sm hover:cursor-pointer text-center">
              <Link
                to="/user-settings"
                className="hover:dark:bg-darkNavSecondary w-full p-2"
              >
                Settings
              </Link>
              <div className="hover:dark:bg-darkNavSecondary w-full p-2">
                <a
                  href="https://opentechalliancesupport.zendesk.com/hc/en-us/categories/115001966887-OpenTech-IoE"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Help
                </a>
              </div>
              <div
                className="hover:dark:bg-darkNavSecondary w-full p-2"
                // onClick={() => handleLogout()}
              >
                Logout
              </div>
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 h-full">
          {openPage === "dashboard" && <SmartLockDashboardView />}
          {openPage === "reports" && <SmartLockReports />}
          {openPage === "allFacilities" && <SmartLockAllFacilitiesPage />}
          {openPage === "selected" && <SmartLockSelectedPage />}
          {openPage === "documentation" && <SmartLockDocumentationPage />}
          {openPage === "mapping" && <SmartLockMapping />}
        </div>
      </div>
    </div>
  );
}
