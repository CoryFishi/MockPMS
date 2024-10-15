import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import qs from "qs";
import {
  RiCheckboxCircleFill,
  RiCheckboxBlankCircleLine,
} from "react-icons/ri";

export default function SmartLockSelectedPage({
  savedFacilities,
  selectedFacilities,
  setSelectedFacilities,
  setOpenPage,
}) {
  const [facilities, setFacilities] = useState([]);

  const handleFacilities = async (saved) => {
    // Run the toast notification for each facility
    try {
      setFacilities(selectedFacilities);
      toast.success(<b>Favorites loaded successfully!</b>);
    } catch {
      alert("It broke");
    }
  };

  const addToFavorite = async (facility) => {
    const isSelected = isFacilitySelected(facility.id);
    if (isSelected) {
      setSelectedFacilities((prevFavoriteFacilities) => {
        const updatedFavorites = prevFavoriteFacilities.filter(
          (favFacility) => favFacility.id !== facility.id
        );

        localStorage.setItem(
          "selectedFacilities",
          JSON.stringify(updatedFavorites)
        );
        return updatedFavorites;
      });
    } else {
      setSelectedFacilities((prevFavoriteFacilities) => {
        const updatedFavorites = [...prevFavoriteFacilities, facility];
        localStorage.setItem(
          "selectedFacilities",
          JSON.stringify(updatedFavorites)
        );
        return updatedFavorites;
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
          <RiCheckboxCircleFill className="text-lg" />
          &ensp; Selected
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
                  className="hover:cursor-pointer border border-gray-300 dark:border-border px-4 py-2"
                  onClick={() => addToFavorite(facility)}
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
