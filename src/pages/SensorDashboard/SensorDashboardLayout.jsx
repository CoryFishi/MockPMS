import { useState } from "react";
import { Link } from "react-router-dom";
import { BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import SensorDashboard from "@features/sensor/pages/SensorDashboard";

export default function SensorDashboardLayout({
  dashboardMenu,
  darkMode,
  toggleDarkMode,
}) {
  // Drop down variables for the left navigation menu
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  // Open page state holder
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage3") || "sensors"
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
              <h3 className="text-center m-5 text-xl">OpenTech Sensors</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openPage === "sensors" || openPage === "reports"
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
                      openPage === "sensors" || openPage === "reports"
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
                      setOpenPage("sensors") &
                      localStorage.setItem("openPage3", "sensors")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Sensors
                  </Link>
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
                onClick={() => handleLogout()}
              >
                Logout
              </div>
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 h-full">
          {openPage === "sensors" && (
            <SensorDashboard
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
