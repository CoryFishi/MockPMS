import SmartSpaceAllFacilitiesPage from "@features/smartspace/pages/SmartSpaceAllFacilities";
import SmartSpaceSelectedPage from "@features/smartspace/pages/SmartSpaceSelected";
import SmartSpaceDashboardView from "@features/smartspace/pages/SmartSpaceDashboard";
import SmartSpaceReports from "@features/smartspace/pages/SmartSpaceReports";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import SmartSpaceMapping from "@features/smartspace/pages/SmartSpaceMapping";
import { useAuth } from "@context/AuthProvider";
import SmartSpaceTester from "../../features/smartspace/pages/SmartSpaceTester";

export default function SmartSpaceDashboardLayout({ dashboardMenu }) {
  const { handleLogout } = useAuth();
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
          <div className="flex flex-col h-full md:min-w-62.5 min-w-full bg-zinc-950 text-white dark:bg-zinc-950 border-r dark:border-zinc-800 select-none text-lg relative">
            {/* Header Side Bar */}
            <div className="pt-2">
              <h3 className="text-center m-5 text-xl">OpenTech SmartSpace</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openPage === "dashboard" ||
                openPage === "reports" ||
                openPage === "mapping" ||
                openPage === "tester"
                  ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2"
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
                      openPage === "mapping" ||
                      openPage === "tester"
                        ? "text-yellow-500"
                        : ""
                    }`}
                  />
                  <span className="pl-1 truncate max-w-[18ch]">Dashboard</span>
                </div>
                {openSections.currentFacility ? (
                  <MdExpandLess className="shrink-0 text-2xl" />
                ) : (
                  <MdExpandMore className="shrink-0 text-2xl" />
                )}
              </div>

              {!openSections.currentFacility && (
                <div className="mx-4 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("dashboard") &
                      localStorage.setItem("openPage2", "dashboard")
                    }
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "dashboard"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    } ${
                      openPage === "mapping" ||
                      openPage === "reports" ||
                      openPage === "dashboard" ||
                      openPage === "tester"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    SmartSpace
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("reports") &
                      localStorage.setItem("openPage2", "reports")
                    }
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "reports"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    } ${
                      openPage === "mapping" ||
                      openPage === "reports" ||
                      openPage === "dashboard" ||
                      openPage === "tester"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Reports
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("mapping") &
                      localStorage.setItem("openPage2", "mapping")
                    }
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "mapping"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    } ${
                      openPage === "mapping" ||
                      openPage === "reports" ||
                      openPage === "dashboard" ||
                      openPage === "tester"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Mapping
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("tester") &
                      localStorage.setItem("openPage2", "tester")
                    }
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "tester"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    } ${
                      openPage === "mapping" ||
                      openPage === "reports" ||
                      openPage === "dashboard" ||
                      openPage === "tester"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Tester
                  </Link>
                </div>
              )}
            </div>

            {/* Other Options */}
            <div
              className={`border-t border-b pl-2 pr-2 border-zinc-500 pb-8 ${
                openPage === "allFacilities" || openPage === "selected"
                  ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2"
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
                  <MdExpandLess className="shrink-0 text-2xl" />
                ) : (
                  <MdExpandMore className="shrink-0 text-2xl" />
                )}
              </div>

              {!openSections.facilities && (
                <div className="mx-4 mt-4 space-y-2">
                  <button
                    onClick={() =>
                      setOpenPage("allFacilities") &
                      localStorage.setItem("openPage2", "allFacilities")
                    }
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "allFacilities"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    }  ${
                      openPage === "selected" || openPage === "allFacilities"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    All Facilities
                  </button>
                  <button
                    onClick={() =>
                      setOpenPage("selected") &
                      localStorage.setItem("openPage2", "selected")
                    }
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "selected"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    }  ${
                      openPage === "selected" || openPage === "allFacilities"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Selected Facilities
                  </button>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 w-full hidden md:flex justify-between text-sm hover:cursor-pointer text-center">
              <Link
                to="/user-settings"
                className="hover:dark:bg-zinc-900 w-full p-2"
              >
                Settings
              </Link>
              <div className="hover:dark:bg-zinc-900 w-full p-2">
                <a
                  href="https://opentechalliancesupport.zendesk.com/hc/en-us/categories/115001966887-OpenTech-IoE"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Help
                </a>
              </div>
              <div
                className="hover:dark:bg-zinc-900 w-full p-2"
                onClick={() => handleLogout()}
              >
                Logout
              </div>
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 h-full">
          {openPage === "dashboard" && <SmartSpaceDashboardView />}
          {openPage === "reports" && <SmartSpaceReports />}
          {openPage === "allFacilities" && <SmartSpaceAllFacilitiesPage />}
          {openPage === "selected" && <SmartSpaceSelectedPage />}
          {openPage === "mapping" && <SmartSpaceMapping />}
          {openPage === "tester" && <SmartSpaceTester />}
        </div>
      </div>
    </div>
  );
}
