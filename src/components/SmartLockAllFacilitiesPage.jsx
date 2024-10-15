import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import qs from "qs";
import { FaWarehouse } from "react-icons/fa6";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";

export default function SmartLockAllFacilitiesPage({
  savedFacilities,
  selectedFacilities,
  setSelectedFacilities,
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

  const addToSelected = async (facility) => {
    const isSelected = isFacilitySelected(facility.id);
    if (isSelected) {
      setSelectedFacilities((prevSelectedFacilities) => {
        const updatedSelected = prevSelectedFacilities.filter(
          (favFacility) => favFacility.id !== facility.id
        );

        localStorage.setItem(
          "selectedFacilities",
          JSON.stringify(updatedSelected)
        );
        return updatedSelected;
      });
    } else {
      setSelectedFacilities((prevSelectedFacilities) => {
        const updatedSelected = [...prevSelectedFacilities, facility];
        localStorage.setItem(
          "selectedFacilities",
          JSON.stringify(updatedSelected)
        );
        return updatedSelected;
      });
    }
  };

  useEffect(() => {
    handleFacilities(savedFacilities);
  }, []);

  const isFacilitySelected = (facilityId) => {
    return selectedFacilities.some((facility) => facility.id === facilityId);
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
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
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
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2 border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <table className="w-full table-auto border-collapse border border-gray-300 pb-96 dark:border-border">
          <thead>
            <tr className="bg-gray-200 dark:bg-darkNavSecondary">
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left"></th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left">
                Environment
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left">
                Facility Id
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left">
                Facility Name
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left">
                Property Number
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFacilities.map((facility, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
              >
                <td
                  className="border border-gray-300 dark:border-border px-4 py-2"
                  onClick={() => addToSelected(facility)}
                >
                  <div className="flex justify-center text-yellow-500">
                    {isFacilitySelected(facility.id) ? (
                      <RiCheckboxCircleFill className="text-lg" />
                    ) : (
                      <RiCheckboxBlankCircleLine className="text-lg" />
                    )}
                  </div>
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
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
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {facility.id}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {facility.name}
                </td>
                <td className="border border-gray-300 dark:border-border px-4 py-2">
                  {facility.propertyNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
