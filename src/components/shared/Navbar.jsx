import { Link } from "react-router-dom";
import { RiMenuFold3Fill, RiMenuFold4Fill } from "react-icons/ri";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@app/supabaseClient";
import { useState, useEffect, useRef } from "react";
import { MdExpandLess, MdExpandMore } from "react-icons/md";
import { useNavigate } from "react-router-dom";

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
    location.pathname === "/admin" ||
    location.pathname === "/sensor";

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
    <nav className="bg-white dark:bg-zinc-900 p-2 w-fullselect-none relative">
      <div className="flex items-center justify-between text-black dark:text-white relative">
        <div className="flex">
          {showSideToggle && (
            <button
              onClick={toggleSideMenu}
              className="flex items-center shrink-0 p-2"
            >
              {(dashboardMenu === true && (
                <RiMenuFold3Fill className="text-2xl ml-1 hover:cursor-pointer" />
              )) || (
                <RiMenuFold4Fill className="text-2xl ml-1 hover:cursor-pointer" />
              )}
            </button>
          )}
        </div>
        <div className="flex space-x-4 items-center mr-5">
          {user && permissions.smartlockPlatform && (
            <Link
              to="/smartlock"
              className={`hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md font-medium ${
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
              className={`hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md font-medium ${
                location.pathname === "/" ? "border-b-2 border-yellow-400" : ""
              }`}
            >
              Property Manager
            </Link>
          )}
          {user && role === "admin" && (
            <Link
              to="/admin"
              className={`hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md font-medium ${
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
                className="cursor-pointer bg-zinc-100 dark:bg-zinc-800 rounded-md p-2 px-4 flex items-center text-center"
              >
                {user.email}{" "}
                {isDropdownOpen ? <MdExpandLess /> : <MdExpandMore />}
              </h2>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 flex flex-col">
                  <button
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md font-medium text-center hover:cursor-pointer rounded-t"
                    onClick={() =>
                      toggleDarkMode() & setIsDropdownOpen(!isDropdownOpen)
                    }
                  >
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                  <Link
                    to="/user-settings"
                    className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md font-medium text-center"
                  >
                    User Settings
                  </Link>
                  {permissions.authenticationPlatform && (
                    <Link
                      to="/authentication-settings"
                      className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md font-medium text-center"
                    >
                      Authentication
                    </Link>
                  )}
                  <button
                    className="hover:bg-zinc-100 hover:cursor-pointer dark:hover:bg-zinc-700 px-3 py-2 text-md font-medium rounded-b"
                    onClick={() => handleLogout()}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {" "}
              <Link
                to="/login"
                className={`hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 rounded-md text-md font-medium ${
                  location.pathname === "/" ? "underline" : ""
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 rounded-md text-md font-medium ${
                  location.pathname === "/" ? "underline" : ""
                }`}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
