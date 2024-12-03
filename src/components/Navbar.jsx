import { Link } from "react-router-dom";
import { RiMenuFold3Fill, RiMenuFold4Fill } from "react-icons/ri";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";
import { useState, useEffect, useRef } from "react";
import { MdExpandLess, MdExpandMore, MdOutlineWbSunny } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { FaMoon } from "react-icons/fa";
import packageJson from "../../package.json";

export default function Navbar({
  setDashboardMenu,
  dashboardMenu,
  darkMode,
  toggleDarkMode,
}) {
  // Toggle dark mode and save preference to localStorage
  const toggleSideMenu = () => {
    setDashboardMenu((prev) => !prev);
  };
  const {
    user,
    setTokens,
    setCurrentFacility,
    setFavoriteTokens,
    setSelectedTokens,
    role,
    permissions,
  } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [version, setVersion] = useState(packageJson.version);
  const userRef = useRef(null);

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

  const showSideToggle =
    location.pathname === "/" ||
    location.pathname === "/smartlock" ||
    location.pathname === "/admin";

  // Close modal if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Close the modal
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <nav className="bg-white dark:bg-darkPrimary p-2 w-full border-slate-200 dark:border-gray-700 border-b select-none relative">
      <div className="flex items-center justify-between text-black dark:text-white relative">
        <div className="flex">
          {showSideToggle && (
            <button
              onClick={toggleSideMenu}
              className="flex items-center flex-shrink-0 p-2"
            >
              {(dashboardMenu === true && (
                <RiMenuFold3Fill className="text-2xl ml-1 hover:cursor-pointer" />
              )) || (
                <RiMenuFold4Fill className="text-2xl ml-1 hover:cursor-pointer" />
              )}
            </button>
          )}
        </div>

        {/* Centered PMS */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-medium">
          PMS
        </div>

        <div className="flex space-x-4 items-center mr-5">
          {/* Rest of your navigation */}
          <div
            onClick={toggleDarkMode}
            className={`w-8 h-4 flex items-center rounded-full p-1 cursor-pointer bg-gray-300 dark:bg-gray-600`}
          >
            <div
              className={`bg-white shadow-md shadow-gray-300 dark:shadow-sm dark:shadow-gray-600 dark:bg-darkSecondary w-4 h-4 rounded-full transform transition-transform duration-500 ease-out flex items-center justify-center ${
                darkMode ? "translate-x-2" : ""
              }`}
            >
              {darkMode ? (
                <FaMoon className="text-[10px] text-gray-500" />
              ) : (
                <MdOutlineWbSunny className="text-[10px] text-gray-500 " />
              )}
            </div>
          </div>
          {user && permissions.smartlockPlatform && (
            <Link
              to="/smartlock"
              className={`hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium ${
                location.pathname === "/smartlock"
                  ? "border-b-2 border-yellow-400"
                  : ""
              }`}
            >
              SmartLock
            </Link>
          )}
          {user && permissions.pmsPlatform && (
            <Link
              to="/"
              className={`hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium ${
                location.pathname === "/" ? "border-b-2 border-yellow-400" : ""
              }`}
            >
              Property Manager
            </Link>
          )}
          {user && role === "admin" && (
            <Link
              to="/admin"
              className={`hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium ${
                location.pathname === "/admin"
                  ? "border-b-2 border-yellow-400"
                  : ""
              }`}
            >
              Admin
            </Link>
          )}
          {user ? (
            <div className="relative" ref={userRef}>
              <h2
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="cursor-pointer bg-gray-100 dark:bg-darkSecondary rounded-md p-2 px-4 flex items-center text-center"
              >
                {user.email}{" "}
                {isDropdownOpen ? <MdExpandLess /> : <MdExpandMore />}
              </h2>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white dark:bg-darkSecondary border border-gray-200 dark:border-border rounded-lg shadow-lg p-2 z-20 flex flex-col">
                  <Link
                    to="/user-settings"
                    className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium text-center"
                  >
                    User Settings
                  </Link>
                  {permissions.authenticationPlatform && (
                    <Link
                      to="/authentication-settings"
                      className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium text-center border-t border-t-gray-100 dark:border-t-border"
                    >
                      Authentication
                    </Link>
                  )}

                  <button
                    className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium border-opacity-50 border-t border-t-gray-100 dark:border-t-border"
                    onClick={() => handleLogout()}
                  >
                    Logout
                  </button>
                  <div className="text-right bottom-0 text-sm">v{version}</div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className={`hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-md font-medium ${
                location.pathname === "/" ? "underline" : ""
              }`}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
