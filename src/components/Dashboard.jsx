import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsFillBuildingsFill, BsBuildingFill } from "react-icons/bs";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import VisitorPage from "./VisitorPage";
import UnitPage from "./UnitPage";
import AllFacilitiesPage from "./AllFacilitiesPage";
import FavoritesPage from "./FavoritesPage";
import axios from "axios";
import qs from "qs";

export default function Dashboard({
  dashboardMenu,
  currentFacility,
  setCurrentFacility,
  savedFacilities = [],
  favoriteFacilities,
  setFavoriteFacilities,
}) {
  const [openSections, setOpenSections] = useState({
    facilities: false,
    currentFacility: false,
  });
  const [openPage, setOpenPage] = useState(
    localStorage.getItem("openPage") || "allFacilities"
  );
  const [currentFacilityName, setCurrentFacilityName] = useState(
    localStorage.getItem("selectedFacilityName") || "Select a Facility"
  );
  const existingLocalStorageFacility =
    JSON.parse(localStorage.getItem("currentFacility")) || {};

  const navigate = useNavigate();

  const handleLogin = () => {
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
        localStorage.setItem(
          "currentFacility",
          JSON.stringify({
            ...existingLocalStorageFacility,
            bearer: response.data,
          })
        );
        setCurrentFacility((prevState) => ({
          ...prevState,
          bearer: response.data,
        }));
        setCurrentFacilityName(currentFacility.name);
      })
      .catch(function (error) {
        console.error("Error during login:", error);
      });
  };

  const handleFacilityInfo = () => {
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
        Authorization: "Bearer " + currentFacility.bearer.access_token,
        "api-version": "2.0",
      },
    };

    axios(config)
      .then(function (response) {
        setCurrentFacility((prevState) => ({
          ...prevState,
          facilityInfo: response.data,
        }));
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

  // Check if savedFacilities is empty and alert the user
  useEffect(() => {
    if (savedFacilities.length === 0) {
      alert("Please authenticate a service, before proceeding...");
      navigate("/settings");
    }
  }, [savedFacilities, navigate]);

  // Run handleLogin once when the component loads
  useEffect(() => {
    const initialize = async () => {
      try {
        await handleLogin();
        await handleFacilityInfo();
      } catch (error) {
        console.error("Error during initialization:", error);
      }
    };

    initialize();
  }, []);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-row w-full h-full">
        {dashboardMenu === true && (
          <div className="flex flex-col h-full w-1/6 bg-gray-800 text-white space-y-4 text-xl">
            {/* Header Side Bar */}
            <div>
              <h3 className="text-center m-5 text-2xl">OPENTECH IoE</h3>
            </div>

            {/* Current Facility Side Bar */}
            <div className="pl-2 pr-2 pb-4">
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("currentFacility")}
              >
                <div className="flex items-center space-x-2">
                  <BsBuildingFill />
                  <span className="pl-2">{currentFacilityName}</span>
                </div>
                {openSections.currentFacility ? (
                  <MdExpandLess />
                ) : (
                  <MdExpandMore />
                )}
              </div>

              {!openSections.currentFacility && (
                <div className="ml-6 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("visitors") &
                      localStorage.setItem("openPage", "visitors")
                    }
                    className="block hover:text-gray-300"
                  >
                    Visitors
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("units") &
                      localStorage.setItem("openPage", "units")
                    }
                    className="block hover:text-gray-300"
                  >
                    Units
                  </Link>
                </div>
              )}
            </div>

            {/* Facilities Side Bar */}
            <div className="border-t border-b pl-2 pr-2 border-gray-500 pb-8">
              <div
                className="flex justify-between items-center cursor-pointer mt-8"
                onClick={() => toggleSection("facilities")}
              >
                <div className="flex items-center space-x-2">
                  <BsFillBuildingsFill />
                  <span>Other Options</span>
                </div>
                {openSections.facilities ? <MdExpandLess /> : <MdExpandMore />}
              </div>

              {!openSections.facilities && (
                <div className="ml-6 mt-4 space-y-2">
                  <Link
                    onClick={() =>
                      setOpenPage("allFacilities") &
                      localStorage.setItem("openPage", "allFacilities")
                    }
                    className="block hover:text-gray-300"
                  >
                    All Facilities
                  </Link>
                  <Link
                    onClick={() =>
                      setOpenPage("favorites") &
                      localStorage.setItem("openPage", "favorites")
                    }
                    className="block hover:text-gray-300"
                  >
                    Favorites
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="w-full h-screen flex flex-col bg-background-50 overflow-hidden">
          {openPage === "visitors" && (
            <VisitorPage currentFacility={currentFacility} />
          )}
          {openPage === "units" && (
            <UnitPage currentFacility={currentFacility} />
          )}
          {openPage === "allFacilities" && (
            <AllFacilitiesPage
              setCurrentFacility={setCurrentFacility}
              setCurrentFacilityName={setCurrentFacilityName}
              savedFacilities={savedFacilities}
              favoriteFacilities={favoriteFacilities}
              setFavoriteFacilities={setFavoriteFacilities}
              setOpenPage={setOpenPage}
            />
          )}
          {openPage === "favorites" && (
            <FavoritesPage
              setCurrentFacility={setCurrentFacility}
              setCurrentFacilityName={setCurrentFacilityName}
              savedFacilities={savedFacilities}
              favoriteFacilities={favoriteFacilities}
              setFavoriteFacilities={setFavoriteFacilities}
              setOpenPage={setOpenPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
