import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { GoStar, GoStarFill } from "react-icons/go";
import qs from "qs";
import { FaWarehouse } from "react-icons/fa6";

export default function AllFacilitiesPage({
  currentFacility,
  setCurrentFacility,
  setCurrentFacilityName,
  savedFacilities,
  favoriteFacilities,
  setFavoriteFacilities,
  setOpenPage,
}) {
  const [facilities, setFacilities] = useState([]);

  const handleLogin = async (facility) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (facility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = facility.environment;
    }

    const data = qs.stringify({
      grant_type: "password",
      username: facility.api,
      password: facility.apiSecret,
      client_id: facility.client,
      client_secret: facility.clientSecret,
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

    return axios(config)
      .then(function (response) {
        return response.data;
      })
      .catch(function (error) {
        console.error("Error during login:", error);
        throw error;
      });
  };

  const handleSelectLogin = async (facility) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (facility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = facility.environment;
    }
    const data = qs.stringify({
      grant_type: "password",
      username: facility.api,
      password: facility.apiSecret,
      client_id: facility.client,
      client_secret: facility.clientSecret,
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

    return axios(config)
      .then(function (response) {
        localStorage.setItem(
          "currentFacility",
          JSON.stringify({
            ...facility,
            bearer: response.data,
          })
        );
        setCurrentFacility((prevState) => ({
          ...prevState,
          bearer: response.data,
        }));
        setCurrentFacilityName(facility.name);
        return response;
      })
      .catch(function (error) {
        console.error("Error during login:", error);
        throw error;
      });
  };

  const handleFacilities = async (saved) => {
    const handleAccount = async (facility) => {
      const bearer = await handleLogin(facility);
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }
      const config = {
        method: "get",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities`,
        headers: {
          Authorization: "Bearer " + bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
        },
      };

      return axios(config)
        .then(function (response) {
          const newFacilities = response.data.map((item) => ({
            ...item,
            environment: facility.environment,
            api: facility.api,
            apiSecret: facility.apiSecret,
            client: facility.client,
            clientSecret: facility.clientSecret,
          }));

          setFacilities((prevFacilities) => {
            const combinedFacilities = [...prevFacilities, ...newFacilities];

            return combinedFacilities.sort((a, b) => {
              if (a.environment < b.environment) return -1;
              if (a.environment > b.environment) return 1;
              if (a.id < b.id) return -1;
              if (a.id > b.id) return 1;
              return 0;
            });
          });

          return response;
        })
        .catch(function (error) {
          console.error("Error during facility fetching:", error);
          throw error;
        });
    };
    for (let i = 0; i < saved.length; i++) {
      const facility = saved[i];
      // Run the toast notification for each facility
      toast.promise(handleAccount(facility), {
        loading: "Loading facilities...",
        success: <b>Facilities loaded successfully!</b>,
        error: <b>Could not load facilities.</b>,
      });
    }
  };

  const handleSelect = async (facility) => {
    setCurrentFacility(facility);
    localStorage.setItem("currentFacility", JSON.stringify(facility));
    await toast.promise(handleSelectLogin(facility), {
      loading: "Selecting facility...",
      success: <b>Facility selected!</b>,
      error: <b>Could not select facility.</b>,
    });
    localStorage.setItem("openPage", "units");
    setOpenPage("units");
  };

  const addToFavorite = async (facility) => {
    const isFavorite = isFacilityFavorite(facility.id);
    if (isFavorite) {
      setFavoriteFacilities((prevFavoriteFacilities) => {
        const updatedFavorites = prevFavoriteFacilities.filter(
          (favFacility) => favFacility.id !== facility.id
        );

        localStorage.setItem(
          "favoriteFacilities",
          JSON.stringify(updatedFavorites)
        );
        return updatedFavorites;
      });
    } else {
      setFavoriteFacilities((prevFavoriteFacilities) => {
        const updatedFavorites = [...prevFavoriteFacilities, facility];
        localStorage.setItem(
          "favoriteFacilities",
          JSON.stringify(updatedFavorites)
        );
        return updatedFavorites;
      });
    }
  };

  useEffect(() => {
    handleFacilities(savedFacilities);
  }, []);

  const isFacilityFavorite = (facilityId) => {
    return favoriteFacilities.some((facility) => facility.id === facilityId);
  };

  const [searchQuery, setSearchQuery] = useState("");

  // Filter facilities based on the search query
  const filteredFacilities = facilities.filter(
    (facility) =>
      (facility.id || "").toString().includes(searchQuery) ||
      (facility.propertyNumber || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (facility.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (facility.environment || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="overflow-auto">
      <div className="flex h-12 bg-gray-200 items-center">
        <div className="ml-5 flex items-center text-sm">
          <FaWarehouse className="text-lg" />
          &ensp; All Facilities
        </div>
      </div>
      <div className="w-full h-full p-5 flex flex-col rounded-lg pb-10">
        <input
          type="text"
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value) & console.log(facilities)
          }
          className="border p-2 w-full mb-2"
        />
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2"></th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Environment
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Facility Id
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Facility Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Property Number
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFacilities.map((facility, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td
                  className="border border-gray-300 px-4 py-2 hover:cursor-pointer"
                  onClick={() => addToFavorite(facility)}
                >
                  <div className="flex justify-center text-yellow-500">
                    {isFacilityFavorite(facility.id) ? (
                      <GoStarFill />
                    ) : (
                      <GoStar />
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {facility.environment == "-dev"
                    ? "Development"
                    : facility.environment == ""
                    ? "Production"
                    : facility.environment == "-qa"
                    ? "QA"
                    : facility.environment == "cia-stg-1.aws."
                    ? "Staging"
                    : "N?A"}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {facility.id}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {facility.name}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {facility.propertyNumber}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {currentFacility.id == facility.id &&
                  currentFacility.environment == facility.environment ? (
                    <button
                      className="bg-gray-200 text-white px-2 py-1 rounded hover:bg-gray-300"
                      onClick={() =>
                        localStorage.setItem("openPage", "units") &
                        setOpenPage("units")
                      }
                    >
                      Selected
                    </button>
                  ) : (
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      onClick={() => handleSelect(facility)}
                    >
                      Select
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
