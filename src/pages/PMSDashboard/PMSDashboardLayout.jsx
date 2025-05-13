import Visitors from "@features/pms/pages/Visitors";
import Units from "@features/pms/pages/Units";
import AllFacilities from "@features/pms/pages/AllFacilities";
import Favorites from "@features/pms/pages/Favorites";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import axios from "axios";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "../../app/supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { handleSingleLogin } from "@hooks/opentech";

export default function PMSDashboardLayout({ dashboardMenu }) {
  const {
    user,
    currentFacility,
    setCurrentFacility,
    setTokens,
    setFavoriteTokens,
    setSelectedTokens,
  } = useAuth();
  const [isNameGrabbed, setIsNameGrabbed] = useState(false);
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage") || "allFacilities"
  );
  const navigate = useNavigate();
  const [currentFacilityName, setCurrentFacilityName] =
    useState("Select a Facility");

  const handleCurrentFacilityUpdate = async (updatedInfo) => {
    const { data, error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        current_facility: updatedInfo,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving credentials:", error.message);
    } else {
      setCurrentFacility(updatedInfo);
      setCurrentFacilityName(updatedInfo.name);
      setIsNameGrabbed(true);
    }
  };

  const handleFacilityHandles = async () => {
    await handleLogin();
    await handleFacilityInfo();
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

  const handleLogin = async () => {
    if (!currentFacility || Object.keys(currentFacility).length === 0) return;

    try {
      const fetchToken = await handleSingleLogin(currentFacility);
      const updatedFacility = {
        ...currentFacility,
        token: fetchToken.token,
      };
      handleCurrentFacilityUpdate(updatedFacility);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleFacilityInfo = async () => {
    if (Object.keys(currentFacility).length === 0) return;
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + currentFacility.token.access_token,
        "api-version": "2.0",
      },
    };

    axios(config)
      .then(function (response) {
        const facilityInfo = response.data;
        let facility = currentFacility;
        const updatedFacility = {
          ...facility,
          facilityInfo,
        };
        handleCurrentFacilityUpdate(updatedFacility);
        setCurrentFacilityName(response.data.name);
      })
      .catch(function (error) {
        console.error("Error during login:", error);
      });
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Run handleLogin once when the component loads
  useEffect(() => {
    if (!isNameGrabbed) {
      handleFacilityHandles();
    }
  }, [currentFacility]);

  return (
    <div className="flex flex-col w-full h-screen overflow-y-auto overflow-hidden">
      <div className="flex flex-row w-full h-full shrink-0">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full md:min-w-[250px] min-w-full bg-navPrimary text-white dark:bg-darkNavPrimary border-r dark:border-border select-none text-lg relative">
            {/* Header Side Bar */}
            <div className="pt-2">
              <h3 className="text-center m-5 text-xl">OpenTech PMS</h3>
            </div>

            {/* Current Facility Side Bar */}
            {currentFacility && currentFacility.id > 0 && (
              <div
                className={`pl-2 pr-2 pb-8 mt-8 ${
                  openPage === "visitors" || openPage === "units"
                    ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                    : "dark:bg-darkNavPrimary"
                }`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer mt-8"
                  onClick={() => toggleSection("currentFacility")}
                >
                  <div className="flex items-center space-x-2">
                    <BsBuildingFill
                      className={`${
                        openPage === "visitors" || openPage === "units"
                          ? "text-yellow-500"
                          : ""
                      }`}
                    />
                    <span className="pl-1 truncate max-w-[18ch]">
                      {currentFacilityName}
                    </span>
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
                        setOpenPage("visitors") &
                        localStorage.setItem("openPage", "visitors")
                      }
                      className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                    >
                      Visitors
                    </Link>
                    <Link
                      onClick={() =>
                        setOpenPage("units") &
                        localStorage.setItem("openPage", "units")
                      }
                      className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                    >
                      Units
                    </Link>
                    {currentFacility && currentFacility.id > 0
                      ? (() => {
                          const baseUrl =
                            currentFacility.environment === "cia-stg-1.aws."
                              ? `https://portal.${currentFacility.environment}insomniaccia.com/facility/${currentFacility.id}/dashboard`
                              : `https://portal.insomniaccia${currentFacility.environment}.com/facility/${currentFacility.id}/dashboard`;

                          return (
                            <Link
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(baseUrl, "_blank");
                              }}
                              title={baseUrl}
                              className="px-2 rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary flex items-center gap-2"
                            >
                              <FaExternalLinkAlt />
                              Control Center
                            </Link>
                          );
                        })()
                      : null}
                  </div>
                )}
              </div>
            )}

            {/* Facilities Side Bar */}
            <div
              className={`border-t border-b pl-2 pr-2 border-gray-500 pb-8 ${
                openPage === "allFacilities" || openPage === "favorites"
                  ? "bg-navSecondary dark:bg-darkNavSecondary border-l-yellow-500 border-l-2"
                  : "dark:bg-darkNavPrimary"
              }`}
            >
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("facilities")}
              >
                <div className="flex items-center space-x-2">
                  <BsFillBuildingsFill
                    className={`${
                      openPage === "allFacilities" || openPage === "favorites"
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
                  <Link
                    onClick={() =>
                      setOpenPage("allFacilities") &
                      localStorage.setItem("openPage", "allFacilities")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    All Facilities
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("favorites") &
                      localStorage.setItem("openPage", "favorites")
                    }
                    className="px-2 block rounded-sm hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Favorites
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
          {openPage === "visitors" && (
            <Visitors currentFacilityName={currentFacilityName} />
          )}
          {openPage === "units" && (
            <Units currentFacilityName={currentFacilityName} />
          )}
          {openPage === "allFacilities" && (
            <AllFacilities
              setCurrentFacilityName={setCurrentFacilityName}
              setOpenPage={setOpenPage}
            />
          )}
          {openPage === "favorites" && (
            <Favorites
              setCurrentFacilityName={setCurrentFacilityName}
              setOpenPage={setOpenPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
