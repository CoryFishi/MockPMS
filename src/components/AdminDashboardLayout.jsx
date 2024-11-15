import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import { useAuth } from "../context/AuthProvider";
import Users from "./UsersPage";
import UserEvents from "./UserEvents";

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
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <div className="flex flex-row w-full h-full">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full w-1/6 bg-navPrimary text-white text-xl dark:bg-darkNavPrimary border-r dark:border-border select-none">
            {/* Header Side Bar */}
            <div>
              <h3 className="text-center m-5 text-2xl">OPENTECH IoE</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div
              className={`pl-2 pr-2 pb-8 mt-8 ${
                openPage === "users" || openPage === "userEvents"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                  : "dark:bg-darkNavPrimary"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("userAdmin")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill />
                  <span className="pl-2">User Administrastion</span>
                </div>
                {openSections.currentFacility ? (
                  <MdExpandLess />
                ) : (
                  <MdExpandMore />
                )}
              </div>

              {!openSections.currentFacility && (
                <div className="mx-4 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("users") &
                      localStorage.setItem("openPage3", "users")
                    }
                    className="px-2 block rounded hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Users
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("userEvents") &
                      localStorage.setItem("openPage3", "userEvents")
                    }
                    className="px-2 block rounded hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    User Events
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 dark:bg-darkPrimary h-full">
          {openPage === "users" && <Users />}
          {openPage === "userEvents" && <UserEvents />}
        </div>
      </div>
    </div>
  );
}
