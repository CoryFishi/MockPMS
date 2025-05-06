import axios from "axios";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { IoIosCreate } from "react-icons/io";
import { useAuth } from "../../context/AuthProvider";
import { addEvent } from "../../functions/events";

export default function CreateUnit({ setIsUnitModalOpen, setUnits }) {
  // Store the unit number to be created
  const [newUnitNumber, setNewUnitNumber] = useState("");
  const { user, currentFacility } = useAuth();

  // API call handler to create the new unit
  const handleCreateUnit = async () => {
    if (!newUnitNumber) {
      setIsUnitModalOpen(false);
      return;
    }
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const unitNumbersArray = newUnitNumber.split(",").flatMap((unit) => {
      unit = unit.trim();
      if (unit.includes("-")) {
        const [start, end] = unit.split("-").map((u) => u.trim());

        const prefixStart = start.match(/^[^\d]+/g)?.[0] || "";
        const prefixEnd = end.match(/^[^\d]+/g)?.[0] || "";

        const numStart = parseInt(start.replace(prefixStart, ""));
        const numEnd = parseInt(end.replace(prefixEnd, ""));

        if (
          prefixStart === prefixEnd &&
          !isNaN(numStart) &&
          !isNaN(numEnd) &&
          numStart <= numEnd &&
          numEnd - numStart < 100
        ) {
          return Array.from(
            { length: numEnd - numStart + 1 },
            (_, i) => `${prefixStart}${numStart + i}`
          );
        }

        return [unit]; // fallback if invalid or over limit
      }

      return [unit];
    });

    unitNumbersArray.map(async (unitNumber) => {
      const data = {
        unitNumber: unitNumber,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: false,
      };
      // API call
      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units`,
        headers: {
          Authorization: "Bearer " + currentFacility?.token?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json",
        },
        data: data,
      };
      try {
        toast.promise(
          axios(config)
            .then(function (response) {
              setUnits((prevUnits) => {
                const updatedUnits = [...prevUnits, response.data];
                // Sort unit array by unitNumber before returning
                return updatedUnits.sort((a, b) => {
                  if (a.unitNumber < b.unitNumber) return -1;
                  if (a.unitNumber > b.unitNumber) return 1;
                  return 0;
                });
              });
            })
            .catch(function (error) {
              throw error;
            }),
          {
            loading: `Creating unit ${unitNumber}...`,
            success: <b>Unit {unitNumber} created successfully!</b>,
            error: <b>Failed to create unit {unitNumber}.</b>,
          }
        );
        await addEvent(
          "Create Unit",
          `${user.email} created unit ${unitNumber} at ${currentFacility.name}, facility id ${currentFacility.id}`,
          true
        );
      } catch (error) {
        await addEvent(
          "Create Unit",
          `${user.email} created unit ${unitNumber} at ${currentFacility.name}, facility id ${currentFacility.id}`,
          false
        );
      }
    });
    setIsUnitModalOpen(false);
    setNewUnitNumber("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded-sm shadow-lg dark:bg-darkPrimary">
        {/* Header Container */}
        <div className="pl-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <IoIosCreate />
            <h2 className="ml-2 text-lg font-bold text-center items-center">
              Create Unit(s)
            </h2>
          </div>
        </div>
        {/* Content Container */}
        <div className="px-5 py-3">
          {/* Unit Number Input */}
          <label className="block mb-2">Unit Number(s)</label>
          <input
            type="text"
            className="border border-gray-300 rounded-sm px-3 py-2 w-full dark:bg-darkSecondary dark:border-border"
            value={newUnitNumber}
            onChange={(e) => setNewUnitNumber(e.target.value)}
            placeholder="Enter unit number"
          />
          <p className="text-wrap text-xs text-red-400 mt-1">
            Multiple Units can be created by sperating each unit by a comma
          </p>
          {/* Button Container */}
          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-400 px-4 py-2 rounded-sm mr-2 hover:cursor-pointer hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={() => setIsUnitModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 text-white hover:cursor-pointer px-4 py-2 rounded-sm hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleCreateUnit}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
