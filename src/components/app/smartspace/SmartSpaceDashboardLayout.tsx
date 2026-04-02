import SmartSpaceAllFacilitiesPage from "@views/smartspace/all-facilities/SmartSpaceAllFacilities";
import SmartSpaceSelectedPage from "@views/smartspace/selected/SmartSpaceSelected";
import SmartSpaceDashboardView from "@views/smartspace/dashboard/SmartSpaceDashboard";
import SmartSpaceReports from "@views/smartspace/reports/SmartSpaceReports";
import SmartSpaceMapping from "@views/smartspace/mapping/SmartSpaceMapping";
import SmartSpaceTester from "@views/smartspace/tester/SmartSpaceTester";
import { Link, useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@lib/supabaseClient";

export default function SmartSpaceDashboardLayout({ dashboardMenu }: { dashboardMenu: boolean }) {
  const { setTokens, setCurrentFacility, setFavoriteTokens, setSelectedTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });

  const isDashboardSection = ["/smartspace/dashboard", "/smartspace/reports", "/smartspace/mapping", "/smartspace/tester"].some(p => path.includes(p));
  const isFacilitiesSection = path.includes("/smartspace/all-facilities") || path.includes("/smartspace/selected");

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      setTokens([]);
      setCurrentFacility({});
      setFavoriteTokens([]);
      setSelectedTokens([]);
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-y-auto overflow-hidden">
      <div className="flex flex-row w-full h-full shrink-0">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full md:min-w-62.5 min-w-full bg-zinc-950 text-white dark:bg-zinc-950 border-r dark:border-zinc-800 select-none text-lg relative">
            {/* Header */}
            <div className="pt-2">
              <h3 className="text-center m-5 text-xl">OpenTech SmartSpace</h3>
            </div>

            {/* Dashboard Section */}
            <div className={`pl-2 pr-2 pb-8 mt-8 ${isDashboardSection ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2" : ""}`}>
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("currentFacility")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill className={`${isDashboardSection ? "text-yellow-500" : ""}`} />
                  <span className="pl-1 truncate max-w-[18ch]">Dashboard</span>
                </div>
                {openSections.currentFacility ? <MdExpandLess className="shrink-0 text-2xl" /> : <MdExpandMore className="shrink-0 text-2xl" />}
              </div>

              {!openSections.currentFacility && (
                <div className="mx-4 mt-4 space-y-2">
                  {[
                    { label: "SmartSpace", to: "/smartspace/dashboard" },
                    { label: "Reports",    to: "/smartspace/reports" },
                    { label: "Mapping",    to: "/smartspace/mapping" },
                    { label: "Tester",     to: "/smartspace/tester" },
                  ].map(({ label, to }) => (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className={`px-2 block w-full text-left cursor-pointer ${path === to ? "border-b-2 border-yellow-500" : ""} hover:bg-zinc-800 dark:hover:bg-zinc-800`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Facilities Section */}
            <div className={`border-t border-b pl-2 pr-2 border-zinc-500 pb-8 ${isFacilitiesSection ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2" : ""}`}>
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("facilities")}
              >
                <div className="flex items-center space-x-2">
                  <BsFillBuildingsFill className={`${isFacilitiesSection ? "text-yellow-500" : ""}`} />
                  <span className="pl-1 truncate max-w-[18ch]">Other Options</span>
                </div>
                {openSections.facilities ? <MdExpandLess className="shrink-0 text-2xl" /> : <MdExpandMore className="shrink-0 text-2xl" />}
              </div>

              {!openSections.facilities && (
                <div className="mx-4 mt-4 space-y-2">
                  {[
                    { label: "All Facilities",      to: "/smartspace/all-facilities" },
                    { label: "Selected Facilities",  to: "/smartspace/selected" },
                  ].map(({ label, to }) => (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className={`px-2 block w-full text-left cursor-pointer ${path === to ? "border-b-2 border-yellow-500" : ""} hover:bg-zinc-800 dark:hover:bg-zinc-800`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="absolute bottom-0 w-full hidden md:flex justify-between text-sm hover:cursor-pointer text-center">
              <Link to="/user-settings" className="hover:dark:bg-zinc-900 w-full p-2">Settings</Link>
              <div className="hover:dark:bg-zinc-900 w-full p-2">
                <a href="https://opentechalliancesupport.zendesk.com/hc/en-us/categories/115001966887-OpenTech-IoE" target="_blank" rel="noopener noreferrer">Help</a>
              </div>
              <div className="hover:dark:bg-zinc-900 w-full p-2" onClick={handleLogout}>Logout</div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="w-full flex flex-col h-full">
          <Routes>
            <Route index element={<Navigate to="all-facilities" replace />} />
            <Route path="all-facilities" element={<SmartSpaceAllFacilitiesPage />} />
            <Route path="selected"       element={<SmartSpaceSelectedPage />} />
            <Route path="dashboard"      element={<SmartSpaceDashboardView />} />
            <Route path="reports"        element={<SmartSpaceReports />} />
            <Route path="mapping"        element={<SmartSpaceMapping />} />
            <Route path="tester"         element={<SmartSpaceTester />} />
            <Route path="*"              element={<Navigate to="all-facilities" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
