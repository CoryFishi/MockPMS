import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import VisitorPage from "./VisitorPage";
import UnitPage from "./UnitPage";
import AllFacilitiesPage from "./AllFacilitiesPage";
import FavoritesPage from "./FavoritesPage";
import axios from "axios";
import qs from "qs";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";

export default function DashboardLayout({ dashboardMenu }) {
  const { user, currentFacility, setCurrentFacility } = useAuth();
  const [isNameGrabbed, setIsNameGrabbed] = useState(false);
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage") || "allFacilities"
  );
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
      setIsNameGrabbed(true);
    }
  };

  const handleFacilityHandles = async () => {
    await handleLogin();
    await handleFacilityInfo();
  };

  const handleLogin = async () => {
    if (Object.keys(currentFacility).length === 0) return;

    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const data = qs.stringify({
      grant_type: "password",
      username: currentFacility.api,
      password: currentFacility.apiSecret,
      client_id: currentFacility.client,
      client_secret: currentFacility.clientSecret,
    });
    const config = {
      method: "post",
      url: `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        const tokenData = response.data;
        let facility = currentFacility;
        const updatedFacility = {
          ...facility,
          token: tokenData,
        };
        handleCurrentFacilityUpdate(updatedFacility);

        setTimeout(() => {
          handleLogin();
        }, (tokenData.expires_in - 60) * 1000);
      })
      .catch(function (error) {
        console.error("Error during login:", error);
      });
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
                  <span className="pl-2">{currentFacilityName}</span>
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
                      setOpenPage("visitors") &
                      localStorage.setItem("openPage", "visitors")
                    }
                    className="px-2 block rounded hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Visitors
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("units") &
                      localStorage.setItem("openPage", "units")
                    }
                    className="px-2 block rounded hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Units
                  </Link>
                </div>
              )}
            </div>

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
                  <span>Other Options</span>
                </div>
                {openSections.facilities ? <MdExpandLess /> : <MdExpandMore />}
              </div>

              {!openSections.facilities && (
                <div className="mx-4 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("allFacilities") &
                      localStorage.setItem("openPage", "allFacilities")
                    }
                    className="px-2 block rounded hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    All Facilities
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("favorites") &
                      localStorage.setItem("openPage", "favorites")
                    }
                    className="px-2 block rounded hover:bg-darkNavSecondary dark:hover:bg-darkPrimary"
                  >
                    Favorites
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="w-full flex flex-col bg-background-50 dark:bg-darkPrimary h-full">
          {openPage === "visitors" && (
            <VisitorPage currentFacilityName={currentFacilityName} />
          )}
          {openPage === "units" && (
            <UnitPage currentFacilityName={currentFacilityName} />
          )}
          {openPage === "allFacilities" && (
            <AllFacilitiesPage
              setCurrentFacilityName={setCurrentFacilityName}
              setOpenPage={setOpenPage}
            />
          )}
          {openPage === "favorites" && (
            <FavoritesPage
              setCurrentFacilityName={setCurrentFacilityName}
              setOpenPage={setOpenPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
