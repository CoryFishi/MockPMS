import Users from "@views/admin/users/Users";
import UserEvents from "@views/admin/user-events/UserEvents";
import Roles from "@views/admin/roles/Roles";
import { Link, useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@lib/supabaseClient";

export default function AdminDashboardLayout({ dashboardMenu } : { dashboardMenu: boolean }) {
  const { setTokens, setCurrentFacility, setFavoriteTokens, setSelectedTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [openSections, setOpenSections] = useState({
    userAdmin: false,
  });

  const isAdminSection = path.includes("/admin/users") || path.includes("/admin/user-events") || path.includes("/admin/roles");

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
              <h3 className="text-center m-5 text-xl">OpenTech Admin</h3>
            </div>

            {/* User Administration Section */}
            <div className={`pl-2 pr-2 pb-8 mt-8 ${isAdminSection ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2" : ""}`}>
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("userAdmin")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill className={`${isAdminSection ? "text-yellow-500" : ""}`} />
                  <span className="pl-2">User Administration</span>
                </div>
                {openSections.userAdmin ? <MdExpandLess className="shrink-0 text-2xl" /> : <MdExpandMore className="shrink-0 text-2xl" />}
              </div>

              {!openSections.userAdmin && (
                <div className="mx-4 mt-4 space-y-2">
                  {[
                    { label: "Users",       to: "/admin/users" },
                    { label: "User Events", to: "/admin/user-events" },
                    { label: "Roles",       to: "/admin/roles" },
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

            <div className="absolute bottom-0 w-full hidden md:flex justify-between text-sm cursor-pointer text-center">
              <Link to="/user-settings" className="hover:dark:bg-zinc-900 w-full p-2">Settings</Link>
              <div className="hover:dark:bg-zinc-900 w-full p-2">
                <a href="https://opentechalliancesupport.zendesk.com/hc/en-us/categories/115001966887-OpenTech-IoE" target="_blank" rel="noopener noreferrer">Help</a>
              </div>
              <div className="hover:dark:bg-zinc-900 w-full p-2" onClick={handleLogout}>Logout</div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="w-full flex flex-col bg-background-50 dark:bg-zinc-900 h-full">
          <Routes>
            <Route index        element={<Navigate to="users" replace />} />
            <Route path="users"        element={<Users />} />
            <Route path="user-events"  element={<UserEvents />} />
            <Route path="roles"        element={<Roles />} />
            <Route path="*"            element={<Navigate to="users" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
