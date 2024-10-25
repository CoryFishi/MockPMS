import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { FaCircleCheck } from "react-icons/fa6";
import { MdOutlineError } from "react-icons/md";
import axios from "axios";
import qs from "qs";
import toast from "react-hot-toast";

export default function Settings({
  savedFacilities = [],
  setSavedFacilities,
  darkMode,
  toggleDarkMode,
}) {
  // Create state for each input field
  const [api, setApi] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [client, setClient] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState("-");
  const [settingsSavedFacilities, setSettingsSavedFacilities] = useState(
    Array.isArray(savedFacilities) ? savedFacilities : []
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortDirection, setSortDirection] = useState("asc");

  const submitNewFacility = () => {
    return new Promise((resolve, reject) => {
      try {
        if (environment === "-" || !isAuthenticated) {
          reject("Invalid environment or authentication status.");
          return;
        }

        // Update the saved facilities state
        const updatedFacilities = [
          ...(settingsSavedFacilities || []),
          {
            api: api,
            apiSecret: apiSecret,
            client: client,
            clientSecret: clientSecret,
            environment: environment,
          },
        ];

        const updatedSettingsFacilities = [
          ...(settingsSavedFacilities || []),
          {
            api: api,
            apiSecret: apiSecret,
            client: client,
            clientSecret: clientSecret,
            environment: environment,
            isAuthenticated: true,
          },
        ];

        localStorage.setItem(
          "savedFacilities",
          JSON.stringify(updatedFacilities)
        );

        setSavedFacilities(updatedFacilities);
        setSettingsSavedFacilities(updatedSettingsFacilities);

        // Clear the form inputs
        setApi("");
        setApiSecret("");
        setClient("");
        setClientSecret("");
        setEnvironment("-");
        setIsAuthenticated(false);

        resolve("Facility added successfully!");
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleOldLogin = (facility, index) => {
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
    axios(config)
      .then(function (response) {
        setSettingsSavedFacilities((prevFacilities) =>
          prevFacilities.map((f, i) =>
            i === index ? { ...f, isAuthenticated: true } : f
          )
        );
        return response;
      })
      .catch(function (error) {
        setSettingsSavedFacilities((prevFacilities) =>
          prevFacilities.map((f, i) =>
            i === index ? { ...f, isAuthenticated: false } : f
          )
        );
        console.error(error.message);
      });
  };

  const handleNewLogin = async (env) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (env === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = env;
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
      .then(function (response) {
        setIsAuthenticated(true);
        return response;
      })
      .catch(function (error) {
        setIsAuthenticated(false);
        console.error(error.message);
        throw error;
      });
  };

  // Delete facility handler
  const deleteFacility = (index) => {
    return new Promise((resolve, reject) => {
      try {
        const updatedFacilities = settingsSavedFacilities.filter(
          (_, i) => i !== index
        );

        setSavedFacilities(updatedFacilities);
        setSettingsSavedFacilities(updatedFacilities);
        localStorage.setItem(
          "savedFacilities",
          JSON.stringify(updatedFacilities)
        );
        resolve(true); // Resolve the promise if successful
      } catch (error) {
        reject(error); // Reject the promise if there is an error
      }
    });
  };

  useEffect(() => {
    const storedFacilities = JSON.parse(
      localStorage.getItem("savedFacilities")
    );
    if (Array.isArray(storedFacilities)) {
      setSavedFacilities(storedFacilities);
      setSettingsSavedFacilities(storedFacilities);
    } else {
      setSavedFacilities([]);
      setSettingsSavedFacilities([]);
    }
  }, [setSavedFacilities]);

  // Run login for all saved facilities when settingsSavedFacilities changes
  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      settingsSavedFacilities.forEach((facility, index) => {
        handleOldLogin(facility, index);
      });
      isMounted = false;
    }
  }, []);

  return (
    <div className="dark:text-white dark:bg-darkPrimary h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <div className="w-full h-full p-5 flex flex-col rounded-lg pb-5 overflow-y-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-200 dark:bg-darkNavSecondary">
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setSettingsSavedFacilities(
                    [...settingsSavedFacilities].sort((a, b) => {
                      if (a.api < b.api) return newDirection === "asc" ? -1 : 1;
                      if (a.api > b.api) return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                API Key
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setSettingsSavedFacilities(
                    [...settingsSavedFacilities].sort((a, b) => {
                      if (a.apiSecret < b.apiSecret)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.apiSecret > b.apiSecret)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                API Secret
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setSettingsSavedFacilities(
                    [...settingsSavedFacilities].sort((a, b) => {
                      if (a.client < b.client)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.client > b.client)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Client
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setSettingsSavedFacilities(
                    [...settingsSavedFacilities].sort((a, b) => {
                      if (a.clientSecret < b.clientSecret)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.clientSecret > b.clientSecret)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Client Secret
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setSettingsSavedFacilities(
                    [...settingsSavedFacilities].sort((a, b) => {
                      if (a.environment < b.environment)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.environment > b.environment)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Environment
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Authenticated
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {settingsSavedFacilities.map((facility, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
              >
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {facility.api
                    ? "•".repeat(facility.api.length - 5) +
                      facility.api.slice(-5)
                    : ""}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {facility.apiSecret
                    ? "•".repeat(facility.apiSecret.length - 5) +
                      facility.apiSecret.slice(-5)
                    : ""}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {facility.client}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {facility.clientSecret
                    ? "•".repeat(facility.clientSecret.length - 5) +
                      facility.clientSecret.slice(-5)
                    : ""}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {facility.environment === ""
                    ? "Production"
                    : facility.environment === "-dev"
                    ? "Development"
                    : facility.environment === "-qa"
                    ? "QA"
                    : facility.environment === "cia-stg-1.aws."
                    ? "Staging"
                    : facility.environment}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  <div className="flex justify-center text-lg">
                    {facility.isAuthenticated ? (
                      <FaCircleCheck className="text-green-500" />
                    ) : (
                      <MdOutlineError className="text-red-500" />
                    )}
                  </div>
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  <div className="text-center">
                    <button
                      className="m-1 px-4 py-1 bg-red-500 rounded-md hover:bg-red-600 text-white"
                      onClick={() =>
                        toast.promise(deleteFacility(index), {
                          loading: "Deleting Credentials...",
                          success: <b>Successfully deleted!</b>,
                          error: <b>Failed deletion!</b>,
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary">
              <td className="text-black text-center border-y border-gray-300 dark:border-border px-4 py-2">
                <input
                  type="text"
                  className="border border-slate-100 shadow-md rounded"
                  value={api}
                  onChange={(e) => setApi(e.target.value)}
                />
              </td>
              <td className="text-black text-center border-y border-gray-300 dark:border-border px-4 py-2">
                <input
                  type="text"
                  className="border border-slate-100 shadow-md rounded"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />
              </td>
              <td className="text-black text-center border-y border-gray-300 dark:border-border px-4 py-2">
                <input
                  type="text"
                  className="border border-slate-100 shadow-md rounded"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                />
              </td>
              <td className="text-black text-center border-y border-gray-300 dark:border-border px-4 py-2">
                <input
                  type="text"
                  className="border border-slate-100 shadow-md rounded"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </td>
              <td className="text-black text-center border-y border-gray-300 dark:border-border px-4 py-2">
                <select
                  value={environment}
                  onChange={(e) =>
                    setEnvironment(e.target.value) &
                    handleNewLogin(e.target.value)
                  }
                  className="p-0.5 shadow-md border-y border-slate-100 rounded"
                >
                  <option value="-">--Select an Option--</option>
                  <option value="">Production</option>
                  <option value="-dev">Development</option>
                  <option value="-qa">QA</option>
                  <option value="cia-stg-1.aws.">Staging</option>
                </select>
              </td>
              <td className="text-center border-y border-gray-300 dark:border-border px-4 py-2">
                <div className="flex justify-center text-lg">
                  {isAuthenticated ? (
                    <FaCircleCheck className="text-green-500" />
                  ) : (
                    <MdOutlineError className="text-red-500" />
                  )}
                </div>
              </td>
              <td className="text-center border-y border-gray-300 dark:border-border px-4 py-2">
                {isAuthenticated ? (
                  <button
                    className="m-1 px-4 py-1 bg-green-400 rounded-md hover:bg-green-500 text-white"
                    onClick={() =>
                      toast.promise(submitNewFacility(), {
                        loading: "Creating Credentials...",
                        success: <b>Successfully created!</b>,
                        error: <b>Failed to create!</b>,
                      })
                    }
                  >
                    Submit
                  </button>
                ) : (
                  <button
                    className="m-1 px-4 py-1 bg-green-400 rounded-md hover:bg-green-500 text-white"
                    onClick={() =>
                      toast.promise(handleNewLogin(environment), {
                        loading: "Authenticating Credentials...",
                        success: <b>Successfully authenticated!</b>,
                        error: <b>Failed to authenticate!</b>,
                      })
                    }
                  >
                    Authenticate
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
