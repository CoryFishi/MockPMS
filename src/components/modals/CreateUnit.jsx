import axios from "axios";
import toast from "react-hot-toast";
import React, { useState } from "react";

export default function CreateUnit({
  setIsUnitModalOpen,
  currentFacility,
  setUnits,
}) {
  const [newUnitNumber, setNewUnitNumber] = useState("");

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
    const unitNumbersArray = newUnitNumber
      .split(",")
      .map((unit) => unit.trim());

    unitNumbersArray.map((unitNumber) => {
      const data = {
        unitNumber: unitNumber,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: true,
      };
      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units`,
        headers: {
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json",
        },
        data: data,
      };
      toast.promise(
        axios(config)
          .then(function (response) {
            setUnits((prevUnits) => {
              const updatedUnits = [...prevUnits, response.data];
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
    });

    // Close modal and clear input after submitting
    setIsUnitModalOpen(false);
    setNewUnitNumber("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-5 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-4">Create a New Unit</h2>
        <label className="block mb-2">Unit Number</label>
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full"
          value={newUnitNumber}
          onChange={(e) => setNewUnitNumber(e.target.value)}
          placeholder="Enter unit number"
        />{" "}
        <p className="text-wrap text-xs text-red-400">
          Multiple Units can be created by sperating each unit by a comma
        </p>
        <div className="mt-4 flex justify-end">
          <button
            className="bg-gray-300 px-4 py-2 rounded mr-2"
            onClick={() => setIsUnitModalOpen(false)}
          >
            Cancel
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={handleCreateUnit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
