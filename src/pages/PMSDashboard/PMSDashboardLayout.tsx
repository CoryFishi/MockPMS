import Visitors from "@features/pms/pages/Visitors";
import Units from "@features/pms/pages/Units";
import AllFacilities from "@features/pms/pages/AllFacilities";
import Favorites from "@features/pms/pages/Favorites";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import axios from "axios";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@app/supabaseClient";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { handleSingleLogin } from "@hooks/opentech";
import Scripts from "@features/pms/pages/Scripts";
import { RiAdminFill } from "react-icons/ri";
import Overview from "@features/pms/pages/Overview";

export default function PMSDashboardLayout({
  dashboardMenu,
  setDashboardMenu,
}) {
  const {
    user,
    currentFacility,
    setCurrentFacility,
    setTokens,
    setFavoriteTokens,
    setSelectedTokens,
    role,
    permissions,
  } = useAuth();
  const [isNameGrabbed, setIsNameGrabbed] = useState(false);
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
    admin: false,
  });
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage") || "allFacilities"
  );
  const navigate = useNavigate();
  const [currentFacilityName, setCurrentFacilityName] =
    useState("Select a Facility");

  const handleCurrentFacilityUpdate = async (updatedInfo) => {
    const { error } = await supabase.from("user_data").upsert(
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

  const handleCurrentFacilityDelete = async () => {
    const { error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        current_facility: {},
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Error saving credentials:", error.message);
    } else {
      setCurrentFacility({});
      setCurrentFacilityName("Select a Facility");
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
      if ('token' in fetchToken) {
        const updatedFacility = {
          ...currentFacility,
          token: fetchToken.token,
        };
        handleCurrentFacilityUpdate(updatedFacility);
      } else {
        console.error("Login failed:", fetchToken.error);
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleFacilityInfo = async () => {
    if (Object.keys(currentFacility).length === 0) return;
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "staging") {
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

  useEffect(() => {
    if (!isNameGrabbed) {
      handleFacilityHandles();
    }

    // Run every 3600 seconds (1 hour) to refresh token
    const interval = setInterval(() => {
      handleFacilityHandles();
    }, 3600 * 1000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [currentFacility, isNameGrabbed, handleFacilityHandles]);

  return (
    <div className="flex flex-col w-full h-screen overflow-y-auto overflow-hidden">
      <div className="flex flex-row w-full h-full shrink-0">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full md:min-w-62.5 min-w-full bg-zinc-950 text-white dark:bg-zinc-950 border-r dark:border-zinc-800 select-none text-lg relative">
            {/* Header Side Bar */}
            <div className="pt-2">
              <h3 className="text-center m-5 text-xl">OpenTech PMS</h3>
            </div>

            {/* Current Facility Side Bar */}
            {currentFacility && currentFacility.id > 0 && (
              <div
                className={`pl-2 pr-2 pb-8 mt-8 ${
                  openPage === "visitors" ||
                  openPage === "units" ||
                  openPage === "dashboard"
                    ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2"
                    : "dark:bg-zinc-950"
                }`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer mt-8"
                  onClick={() => toggleSection("currentFacility")}
                >
                  <div className="flex items-center space-x-2">
                    <BsBuildingFill
                      className={`${
                        openPage === "visitors" ||
                        openPage === "units" ||
                        openPage === "dashboard"
                          ? "text-yellow-500"
                          : ""
                      }`}
                    />
                    <span className="pl-1 truncate max-w-[18ch]">
                      {currentFacilityName}
                    </span>
                  </div>
                  {openSections.currentFacility ? (
                    <MdExpandLess className="shrink-0 text-2xl" />
                  ) : (
                    <MdExpandMore className="shrink-0 text-2xl" />
                  )}
                </div>

                {!openSections.currentFacility && (
                  <div className="mx-4 mt-4 space-y-2">
                    <button
                      onClick={() => {
                        setOpenPage("visitors");
                        localStorage.setItem("openPage", "visitors");
                        if (window.innerWidth < 768) setDashboardMenu(false);
                      }}
                      className={`px-2 block w-full text-left cursor-pointer ${
                        openPage === "visitors"
                          ? "border-b-2 border-yellow-500"
                          : ""
                      } ${
                        openPage === "visitors" ||
                        openPage === "units" ||
                        openPage === "dashboard"
                          ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                          : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                      }`}
                    >
                      Visitors
                    </button>
                    <button
                      onClick={() => {
                        setOpenPage("units");
                        localStorage.setItem("openPage", "units");
                        if (window.innerWidth < 768) setDashboardMenu(false);
                      }}
                      className={`px-2 block w-full text-left cursor-pointer ${
                        openPage === "units"
                          ? "border-b-2 border-yellow-500"
                          : ""
                      } ${
                        openPage === "visitors" ||
                        openPage === "units" ||
                        openPage === "dashboard"
                          ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                          : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                      }`}
                    >
                      Units
                    </button>
                    {currentFacility && currentFacility.id > 0
                      ? (() => {
                          const baseUrl =
                            currentFacility.environment === "staging"
                              ? `https://portal.${currentFacility.environment}insomniaccia.com/facility/${currentFacility.id}/dashboard`
                              : `https://portal.insomniaccia${currentFacility.environment}.com/facility/${currentFacility.id}/dashboard`;

                          return (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(baseUrl, "_blank");
                              }}
                              title={baseUrl}
                              className={`px-2 flex items-center gap-2 ${
                                openPage === "visitors" ||
                                openPage === "units" ||
                                openPage === "dashboard"
                                  ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                                  : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                              }`}
                            >
                              <FaExternalLinkAlt />
                              Control Center
                            </button>
                          );
                        })()
                      : null}
                    <button
                      onClick={() => {
                        setOpenPage("allFacilities");
                        localStorage.setItem("openPage", "allFacilities");
                        handleCurrentFacilityDelete();
                        if (window.innerWidth < 768) setDashboardMenu(false);
                      }}
                      className={`px-2 block w-full text-left cursor-pointer ${
                        openPage === "visitors" ||
                        openPage === "units" ||
                        openPage === "dashboard"
                          ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                          : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                      }`}
                    >
                      Clear Facility
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Facilities Side Bar */}
            <div
              className={`border-t border-b pl-2 pr-2 border-zinc-500 pb-8 ${
                openPage === "allFacilities" || openPage === "favorites"
                  ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2"
                  : "dark:bg-zinc-950"
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
                  <MdExpandLess className="shrink-0 text-2xl" />
                ) : (
                  <MdExpandMore className="shrink-0 text-2xl" />
                )}
              </div>

              {!openSections.facilities && (
                <div className="mx-4 mt-4 space-y-2">
                  <button
                    onClick={() => {
                      setOpenPage("allFacilities");
                      localStorage.setItem("openPage", "allFacilities");
                      if (window.innerWidth < 768) setDashboardMenu(false);
                    }}
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "allFacilities"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    } ${
                      openPage === "allFacilities" || openPage === "favorites"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    All Facilities
                  </button>
                  <button
                    onClick={() => {
                      setOpenPage("favorites");
                      localStorage.setItem("openPage", "favorites");
                      if (window.innerWidth < 768) setDashboardMenu(false);
                    }}
                    className={`px-2 block w-full text-left cursor-pointer ${
                      openPage === "favorites"
                        ? "border-b-2 border-yellow-500"
                        : ""
                    } ${
                      openPage === "allFacilities" || openPage === "favorites"
                        ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                        : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Favorites
                  </button>
                </div>
              )}
            </div>

            {/* Admin Side bar */}
            {permissions.pmsPlatformAdmin && currentFacility.id > 0 && (
              <div
                className={`border-t border-b pl-2 pr-2 border-zinc-500 pb-8 ${
                  openPage === "scripts"
                    ? "bg-zinc-900 dark:bg-zinc-900 border-l-yellow-500 border-l-2"
                    : "dark:bg-zinc-950"
                }`}
              >
                <div
                  className="flex justify-between items-center cursor-pointer mt-8"
                  onClick={() => toggleSection("admin")}
                >
                  <div className="flex items-center space-x-2">
                    <RiAdminFill
                      className={`${
                        openPage === "scripts" ? "text-yellow-500" : ""
                      }`}
                    />
                    <span className="pl-1 truncate max-w-[18ch]">
                      Admin Functions
                    </span>
                  </div>
                  {openSections.admin ? (
                    <MdExpandLess className="shrink-0 text-2xl" />
                  ) : (
                    <MdExpandMore className="shrink-0 text-2xl" />
                  )}
                </div>

                {!openSections.admin && (
                  <div className="mx-4 mt-4 space-y-2">
                    <button
                      onClick={() => {
                        setOpenPage("scripts");
                        localStorage.setItem("openPage", "scripts");
                        if (window.innerWidth < 768) setDashboardMenu(false);
                      }}
                      className={`px-2 block w-full text-left cursor-pointer ${
                        openPage === "scripts"
                          ? "border-b-2 border-yellow-500"
                          : ""
                      } ${
                        openPage === "scripts"
                          ? "hover:bg-zinc-800 dark:hover:bg-zinc-800"
                          : "hover:bg-zinc-900 dark:hover:bg-zinc-900"
                      }`}
                    >
                      Scripts
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="absolute bottom-0 w-full hidden md:flex justify-between text-sm cursor-pointer text-center">
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
                className="hover:dark:bg-zinc-900 w-full p-2 curs"
                onClick={() => handleLogout()}
              >
                Logout
              </div>
            </div>
          </div>
        )}
        <div className="w-full flex flex-col h-full">
          {openPage === "dashboard" && (
            <Overview currentFacilityName={currentFacilityName} />
          )}
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
          {openPage === "scripts" && <Scripts />}
        </div>
      </div>
    </div>
  );
}
