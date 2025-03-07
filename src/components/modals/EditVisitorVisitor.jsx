import axios from "axios";
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { MdEdit } from "react-icons/md";
import { useAuth } from "../../context/AuthProvider";
import { addEvent } from "../../functions/events";

export default function EditVisitor({
  setIsEditVisitorModalOpen,
  setVisitors,
  visitor,
}) {
  const [newVisitorData, setNewVisitorData] = useState(visitor);
  const [newVisitorName, setNewVisitorName] = useState({
    firstName: visitor.name.split(" ")[0],
    lastName: visitor.name.split(" ")[1],
  });
  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const { currentFacility, user } = useAuth();

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
  const handleEditVisitor = (e) => {
    e.preventDefault();
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const data = {
      timeGroupId: newVisitorData.timeGroupId,
      accessProfileId: newVisitorData.accessProfileId,
      unitId: newVisitorData.unitId,
      accessCode: newVisitorData.code,
      lastName: newVisitorName.lastName,
      firstName: newVisitorName.firstName,
      email: newVisitorData?.email,
      mobilePhoneNumber: newVisitorData?.mobilePhoneNumber,
      suppressCommands: false,
    };

    const config = {
      method: "post",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors/${visitor.id}/update`,
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
        .then(async function (response) {
          const newVisitorData = response.data;
          if (typeof setVisitors === "function") {
            await addEvent(
              "Edit Visitor",
              `${user.email} edited visitor ${visitor.id} at facility ${currentFacility.name}, ${currentFacility.id}`,
              true
            );
            setVisitors((prevVisitors) => {
              const updatedVisitors = prevVisitors.map((visitor) => {
                if (visitor.id === newVisitorData.id) {
                  return { ...visitor, ...newVisitorData };
                }
                return visitor;
              });
              return updatedVisitors.sort((a, b) => {
                if (a.unitNumber < b.unitNumber) return -1;
                if (a.unitNumber > b.unitNumber) return 1;
                return 0;
              });
            });
          }
        })

        .catch(function (error) {
          console.log(error);
          throw error;
        }),
      {
        loading: `Updating ${visitor.id}...`,
        success: <b> {visitor.id} successfully updated!</b>,
        error: <b>Failed to update {visitor.id}.</b>,
      }
    );

    // Close modal and clear input after submitting
    setIsEditVisitorModalOpen(false);
  };

  useEffect(() => {
    handleTimeProfiles();
    handleAccessProfiles();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-lg w-96 dark:bg-darkPrimary">
        <div className="pl-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <MdEdit />
            <h2 className="ml-2 text-lg font-bold text-center items-center">
              Editing Visitor {visitor.id}
            </h2>
          </div>
        </div>

        <form onSubmit={handleEditVisitor} className="px-5 py-3">
          <label className="block">
            First Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newVisitorName.firstName}
            onChange={(e) =>
              setNewVisitorName((prevState) => ({
                ...prevState,
                firstName: e.target.value,
              }))
            }
            placeholder="Enter first name"
            required
          />
          <label className="block">
            Last Name<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newVisitorName.lastName}
            onChange={(e) =>
              setNewVisitorName((prevState) => ({
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
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newVisitorData.mobilePhoneNumber}
            onChange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                mobilePhoneNumber: e.target.value,
              }))
            }
            placeholder="Enter mobile phone number"
          />
          <label className="block">Email Address</label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newVisitorData.email}
            onChange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                email: e.target.value,
              }))
            }
            placeholder="Enter email address"
          />
          <label className="block">
            Gate Code<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newVisitorData.code}
            onChange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                code: e.target.value,
              }))
            }
            placeholder="Enter gate code"
            required
          />
          <label className="block">
            Time Profile<span className="text-red-500">*</span>
          </label>
          <select
            name="timeProfiles"
            id="timeProfiles"
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newVisitorData.timeGroupId}
            onChange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                timeGroupId: e.target.value,
              }))
            }
            required
          >
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
          <label className="block">
            Access Profile<span className="text-red-500">*</span>
          </label>
          <select
            name="accessProfiles"
            id="accessProfiles"
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newVisitorData.accessProfileId}
            onChange={(e) =>
              setNewVisitorData((prevState) => ({
                ...prevState,
                accessProfileId: e.target.value,
              }))
            }
            required
          >
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
          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-400 px-4 py-2 rounded mr-2 hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={() => setIsEditVisitorModalOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105"
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
