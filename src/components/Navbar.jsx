import { Link } from "react-router-dom";
import { RiMenuFold3Fill, RiMenuFold4Fill } from "react-icons/ri";

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

  return (
    <nav className="bg-white dark:bg-darkPrimary p-2 w-full border-slate-200 dark:border-gray-700 border-b select-none">
      <div className="flex items-center justify-between text-black dark:text-white">
        <div className="flex">
          {location.pathname !== "/settings" && (
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
        <div className="flex items-center flex-shrink-0 text-2xl font-medium lg:">
          PMS
        </div>
        <div className="flex space-x-4 items-center mr-5">
          <div
            onClick={toggleDarkMode}
            className={`w-7 h-4 flex items-center rounded-full p-1 cursor-pointer ${
              darkMode ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-500 ease-out ${
                darkMode ? "translate-x-2" : ""
              }`}
            ></div>
          </div>
          <Link
            to="/smartlock-dashboard"
            className={`hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-md font-medium ${
              location.pathname === "/smartlock-dashboard" ? "underline" : ""
            }`}
          >
            SmartLock
          </Link>
          <Link
            to="/"
            className={`hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-md font-medium ${
              location.pathname === "/" ? "underline" : ""
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/settings"
            className={`hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-md font-medium ${
              location.pathname === "/settings" ? "underline" : ""
            }`}
          >
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
