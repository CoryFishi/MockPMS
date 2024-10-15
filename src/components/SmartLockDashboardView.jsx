import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import SmartLockFacilityCard from "./SmartLockFacilityCard";

export default function SmartLockDashboardView({
  selectedFacilities,
  setSelectedFacilities,
}) {
  const [facilitiesWithBearers, setFacilitiesWithBearers] = useState([]);

  // Function to get a bearer token for each facility
  const fetchBearerToken = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }
      const data = {
        grant_type: "password",
        username: facility.api,
        password: facility.apiSecret,
        client_id: facility.client,
        client_secret: facility.clientSecret,
      };

      const response = await axios.post(
        `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
        data,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error(`Error fetching token for ${facility.name}:`, error);
      toast.error(`Failed to fetch token for ${facility.name}`);
      return null;
    }
  };

  useEffect(() => {
    const fetchFacilitiesWithBearers = async () => {
      const updatedFacilities = await Promise.all(
        selectedFacilities.map(async (facility) => {
          const bearer = await fetchBearerToken(facility);
          return { ...facility, bearer };
        })
      );
      setFacilitiesWithBearers(updatedFacilities);
    };

    fetchFacilitiesWithBearers();
  }, [selectedFacilities]);

  return (
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaLock className="text-lg" />
          &ensp; SmartLock Dashboard
        </div>
      </div>
      <p className="text-sm dark:text-white">{Date()}</p>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 p-5 pt-1">
        {facilitiesWithBearers.map((facility, index) => (
          <div key={index}>
            <SmartLockFacilityCard facility={facility} />
          </div>
        ))}
      </div>
    </div>
  );
}
