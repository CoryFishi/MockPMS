import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaEdit } from "react-icons/fa";
import qs from "qs";

export default function AddFavoriteFacility({
  setIsAddFavoriteFacilityModalOpen,
  setNewUserData,
}) {
  const [id, setId] = useState("");
  const [api, setApi] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [client, setClient] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bearer, setBearer] = useState({});
  const [facilityName, setFacilityName] = useState("No facility Authenticated");
  const [propertyNumber, setPropertyNumber] = useState(null);

  const handleLogin = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = environment;
    }

    const data = qs.stringify({
      grant_type: "password",
      username: api,
      password: apiSecret,
      client_id: client,
      client_secret: clientSecret,
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
      .then(async function (response) {
        setIsAuthenticated(true);
        toast.success("Successfully Authenticated!");
        setBearer(response.data);
        await handleFacilityInfo(response.data);
        return response.data;
      })
      .catch(function (error) {
        setIsAuthenticated(false);
        toast.error("Failed to Authenticated...");
        console.error("Error during login:", error);
        throw error;
      });
  };

  const handleFacilityInfo = async (bearerToken) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = environment;
    }
    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${id}`,
      headers: {
        accept: "application/json",
        Authorization: "Bearer " + bearerToken.access_token,
        "api-version": "2.0",
      },
    };

    axios(config)
      .then(function (response) {
        setFacilityName(response.data.name);
        setPropertyNumber(response.data.propertyNumber);
        return response.data;
      })
      .catch(function (error) {
        console.error("Error during login:", error);
      });
  };

  return (
    // Background Filter
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded shadow-lg dark:bg-darkPrimary min-w-96">
        {/* Header Container */}
        <div className="px-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <h2 className="mx-2 text-lg font-bold text-center items-center flex justify-center gap-2">
              <FaEdit /> Adding Favorite Facility
            </h2>
          </div>
        </div>
        {/* Content Container */}
        <div className="px-5 py-3">
          {/* Facility Name */}
          <label className="block mb-1 font-bold">Facility Name:</label>
          <h2 className="pb-1">{facilityName}</h2>
          {/* Facility Id */}
          <label className="block mb-1 font-bold">Facility Id:</label>
          <input
            type="text"
            className="border border-slate-100 shadow-md rounded dark:text-black w-full p-1"
            value={id}
            onChange={(e) => setId(e.target.value) & setIsAuthenticated(false)}
          />
          {/* API */}
          <label className="block my-1 font-bold">API:</label>
          <input
            type="text"
            className="border border-slate-100 shadow-md rounded dark:text-black w-full p-1"
            value={api}
            onChange={(e) => setApi(e.target.value) & setIsAuthenticated(false)}
          />
          {/* API Secret */}
          <label className="block my-1 font-bold">API Secret:</label>
          <input
            type="text"
            className="border border-slate-100 shadow-md rounded dark:text-black w-full p-1"
            value={apiSecret}
            onChange={(e) =>
              setApiSecret(e.target.value) & setIsAuthenticated(false)
            }
          />
          {/* Client */}
          <label className="block my-1 font-bold">Client:</label>
          <input
            type="text"
            className="border border-slate-100 shadow-md rounded dark:text-black w-full p-1"
            value={client}
            onChange={(e) =>
              setClient(e.target.value) & setIsAuthenticated(false)
            }
          />
          {/* Client Secret */}
          <label className="block my-1 font-bold">Client Secret:</label>
          <input
            type="text"
            className="border border-slate-100 shadow-md rounded dark:text-black w-full p-1"
            value={clientSecret}
            onChange={(e) =>
              setClientSecret(e.target.value) & setIsAuthenticated(false)
            }
          />
          {/* Environment */}
          <label className="block my-1 font-bold">Environment:</label>
          <select
            className="border border-slate-100 shadow-md rounded dark:text-black w-full p-2"
            value={environment}
            onChange={(e) =>
              setEnvironment(e.target.value) & setIsAuthenticated(false)
            }
          >
            <option value="">Production</option>
            <option value="-dev">Development</option>
            <option value="-qa">QA</option>
            <option value="cia-stg-1.aws.">Staging</option>
          </select>
          {/* Button Container */}
          <div className="mt-4 flex justify-between">
            <button
              className={`${
                isAuthenticated
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-yellow-600 hover:bg-yellow-700"
              } text-white px-4 py-2 rounded font-bold transition duration-300 ease-in-out transform hover:scale-105`}
              onClick={() => handleLogin()}
            >
              Authenticate
            </button>
            <div>
              <button
                className="bg-gray-400 px-4 py-2 rounded mr-2 hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
                onClick={() => setIsAddFavoriteFacilityModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`${
                  isAuthenticated
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                } text-white px-4 py-2 rounded font-bold transition duration-300 ease-in-out transform hover:scale-105`}
                onClick={() => {
                  if (isAuthenticated) {
                    setNewUserData((prevState) => ({
                      ...prevState,
                      favorite_tokens: [
                        ...(prevState.favorite_tokens || []),
                        {
                          name: facilityName,
                          id: id,
                          api: api,
                          apiSecret: apiSecret,
                          client: client,
                          clientSecret: clientSecret,
                          environment: environment,
                          propertyNumber: propertyNumber,
                        },
                      ],
                    }));
                    setIsAddFavoriteFacilityModalOpen(false);
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
