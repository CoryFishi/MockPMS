import axios from "axios";
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { IoIosCreate } from "react-icons/io";
import { useAuth } from "../../../context/AuthProvider";
import { addEvent } from "../../../hooks/events";

export default function CreateVisitorVisitor({
  setIsCreateVisitorModalOpen,
  setVisitors,
}) {
  const [newVisitor, setNewVisitor] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    gateCode: "",
    timeProfile: "",
    accessProfile: "",
    type: "",
  });

  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const [units, setUnits] = useState({});
  const [selectedUnit, setSelectedUnit] = useState({});
  const { currentFacility } = useAuth();

  const handleUnits = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }

    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
      },
    };

    return axios(config)
      .then(function (response) {
        const sortedUnits = response.data.sort((a, b) => {
          if (a.unitNumber < b.unitNumber) return -1;
          if (a.unitNumber > b.unitNumber) return 1;
          return 0;
        });
        setUnits(sortedUnits);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };
  const handleTimeProfiles = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }

    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/timegroups`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
      },
    };

    axios(config)
      .then(function (response) {
        setTimeProfiles(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  };
  const handleAccessProfiles = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }

    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/accessprofiles`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
      },
    };

    axios(config)
      .then(function (response) {
        setAccessProfiles(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const handleCreateVisitor = (e) => {
    e.preventDefault();
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    let data = {};
    if (newVisitor.type === "Tenant") {
      data = {
        timeGroupId: newVisitor.timeProfile,
        accessProfileId: newVisitor.accessProfile,
        unitId: selectedUnit,
        accessCode: newVisitor.gateCode,
        lastName: newVisitor.lastName,
        firstName: newVisitor.firstName,
        email: newVisitor.email,
        mobilePhoneNumber: newVisitor.phone,
        isTenant: true,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: true,
      };
    } else if (newVisitor.type === "nonTenant") {
      data = {
        timeGroupId: newVisitor.timeProfile,
        accessProfileId: newVisitor.accessProfile,
        unitId: selectedUnit,
        accessCode: newVisitor.gateCode,
        lastName: newVisitor.lastName,
        firstName: newVisitor.firstName,
        email: newVisitor.email,
        mobilePhoneNumber: newVisitor.phone,
        isTenant: false,
        isPortalVisitor: true,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: true,
      };
    } else {
      data = {
        timeGroupId: newVisitor.timeProfile,
        accessProfileId: newVisitor.accessProfile,
        unitId: selectedUnit,
        accessCode: newVisitor.gateCode,
        lastName: newVisitor.lastName,
        firstName: newVisitor.firstName,
        email: newVisitor.email,
        mobilePhoneNumber: newVisitor.phone,
        isTenant: false,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: true,
      };
    }

    const config = {
      method: "post",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json-patch+json",
      },
      data: data,
    };
    toast.promise(
      axios(config)
        .then(function (response) {
          const newVisitorData = [response.data.visitor];
          setVisitors((prevVisitors) => {
            const updatedVisitors = [...prevVisitors, ...newVisitorData];
            updatedVisitors.sort((a, b) => {
              if (a.unitNumber < b.unitNumber) return -1;
              if (a.unitNumber > b.unitNumber) return 1;
              return 0;
            });
            return updatedVisitors;
          });
        })
        .catch(function (error) {
          console.log(error);
          throw error;
        }),
      {
        loading: `Creating ${newVisitor.type}...`,
        success: <b> {newVisitor.type} successfully created!</b>,
        error: <b>Failed to create {newVisitor.type}.</b>,
      }
    );

    // Close modal and clear input after submitting
    setIsCreateVisitorModalOpen(false);
    setNewVisitor("");
  };

  useEffect(() => {
    handleUnits();
    handleTimeProfiles();
    handleAccessProfiles();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-sm shadow-lg w-96 dark:bg-darkPrimary">
        <div className="pl-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <IoIosCreate />
            <h2 className="ml-2 text-lg font-bold text-center items-center">
              Creating New Visitor
            </h2>
          </div>
        </div>
        <form onSubmit={handleCreateVisitor} className="px-5 py-2">
          <label className="block">Visitor Type</label>
          <select
            name="types"
            id="types"
            className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border hover:cursor-pointer"
            onChange={(e) =>
              setNewVisitor((prevState) => ({
                ...prevState,
                type: e.target.value,
              })) & setSelectedUnit("")
            }
            required
          >
            <option value="">Select a visitor type</option>
            <option value="Tenant">Tenant</option>
            <option value="Guest">Guest</option>
            <option value="nonTenant">Non-Tenant Guest</option>
          </select>
          {newVisitor?.type !== "nonTenant" && newVisitor?.type !== "" && (
            <>
              <label className="block">Unit</label>
              <select
                name="units"
                id="units"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border hover:cursor-pointer"
                onChange={(e) => setSelectedUnit(e.target.value)}
                required
              >
                <option value="">Select a unit</option>
                {newVisitor?.type === "Tenant" && units && units.length > 0 ? (
                  units
                    .filter((unit) => unit.status === "Vacant")
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber} - {unit.status}
                      </option>
                    ))
                ) : newVisitor?.type === "Guest" &&
                  units &&
                  units.length > 0 ? (
                  units
                    .filter((unit) => unit.status === "Rented")
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber} - {unit.status}
                      </option>
                    ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
            </>
          )}
          {newVisitor.type && (
            <>
              <label className="block">First Name</label>
              <input
                type="text"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
                value={newVisitor.firstName}
                onChange={(e) =>
                  setNewVisitor((prevState) => ({
                    ...prevState,
                    firstName: e.target.value,
                  }))
                }
                placeholder="Enter first name"
                required
              />
              <label className="block">Last Name</label>
              <input
                type="text"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
                value={newVisitor.lastName}
                onChange={(e) =>
                  setNewVisitor((prevState) => ({
                    ...prevState,
                    lastName: e.target.value,
                  }))
                }
                placeholder="Enter last name"
                required
              />
              <label className="block">Mobile Phone Number</label>
              <input
                type="text"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
                value={newVisitor.phone}
                onChange={(e) =>
                  setNewVisitor((prevState) => ({
                    ...prevState,
                    phone: e.target.value,
                  }))
                }
                placeholder="Enter mobile phone number"
                required
              />
              <label className="block">Email Address</label>
              <input
                type="text"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
                value={newVisitor.email}
                onChange={(e) =>
                  setNewVisitor((prevState) => ({
                    ...prevState,
                    email: e.target.value,
                  }))
                }
                placeholder="Enter email address"
                required
              />
              <label className="block">Gate Code</label>
              <input
                type="text"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
                value={newVisitor.gateCode}
                onChange={(e) =>
                  setNewVisitor((prevState) => ({
                    ...prevState,
                    gateCode: e.target.value,
                  }))
                }
                placeholder="Enter gate code"
                required
              />
              <label className="block">Time Profile</label>
              <select
                name="timeProfiles"
                id="timeProfiles"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border hover:cursor-pointer"
                value={newVisitor.timeProfile}
                onChange={(e) =>
                  setNewVisitor((prevState) => ({
                    ...prevState,
                    timeProfile: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select a Time Profile</option>
                {timeProfiles && timeProfiles.length > 0 ? (
                  timeProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
              <label className="block">Access Profile</label>
              <select
                name="accessProfiles"
                id="accessProfiles"
                className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border hover:cursor-pointer"
                onChange={(e) =>
                  setNewVisitor((prevState) => ({
                    ...prevState,
                    accessProfile: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select an Access Profile</option>
                {accessProfiles && accessProfiles.length > 0 ? (
                  accessProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))
                ) : (
                  <option value="">Loading...</option>
                )}
              </select>
            </>
          )}

          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-400 hover:cursor-pointer px-4 py-2 rounded-sm mr-2 hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={() => setIsCreateVisitorModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 hover:cursor-pointer text-white px-4 py-2 rounded-sm hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
