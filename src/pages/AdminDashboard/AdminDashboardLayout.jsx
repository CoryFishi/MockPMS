import Users from "@features/admin/pages/Users";
import UserEvents from "@features/admin/pages/UserEvents";
import Roles from "@features/admin/pages/Roles";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";

export default function AdminDashboardLayout({ dashboardMenu }) {
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage3") || "users"
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
              <h3 className="text-center m-5 text-xl">OpenTech Admin</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openPage === "users" ||
                openPage === "userEvents" ||
                openPage === "roles"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                  : "dark:bg-darkNavPrimary"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("userAdmin")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill
                    className={`${
                      openPage === "users" ||
                      openPage === "userEvents" ||
                      openPage === "roles"
                        ? "text-yellow-500"
                        : ""
                    }`}
                  />
                  <span className="pl-2">User Administrastion</span>
                </div>
                {openSections.userAdmin ? (
                  <MdExpandLess className="flex-shrink-0 text-2xl" />
                ) : (
                  <MdExpandMore className="flex-shrink-0 text-2xl" />
                )}
              </div>

              {!openSections.userAdmin && (
                <div className="mx-4 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("users") &
                      localStorage.setItem("openPage3", "users")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Users
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("userEvents") &
                      localStorage.setItem("openPage3", "userEvents")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    User Events
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("roles") &
                      localStorage.setItem("openPage3", "roles")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Roles
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
                // onClick={() => handleLogout()}
              >
                Logout
              </div>
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 dark:bg-darkPrimary h-full">
          {openPage === "users" && <Users />}
          {openPage === "userEvents" && <UserEvents />}
          {openPage === "roles" && <Roles />}
        </div>
      </div>
    </div>
  );
}
