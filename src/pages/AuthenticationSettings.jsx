import { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { FaCircleCheck } from "react-icons/fa6";
import { MdOutlineError } from "react-icons/md";
import axios from "axios";
import qs from "qs";
import toast from "react-hot-toast";
import { CiExport, CiImport } from "react-icons/ci";
import { useAuth } from "../context/AuthProvider";
import NotFound from "../components/NotFound";
import { supabase } from "../supabaseClient";

export default function AuthenticationSettings({ darkMode, toggleDarkMode }) {
  const [api, setApi] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [client, setClient] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [environment, setEnvironment] = useState("-");
  const [settingsSavedFacilities, setSettingsSavedFacilities] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortDirection, setSortDirection] = useState("asc");
  const fileInputRef = useRef(null);
  const { user, tokens, setTokens, role, permissions } = useAuth();

  async function addEvent(eventName, eventDescription, completed) {
    const { data, error } = await supabase.from("user_events").insert([
      {
        event_name: eventName,
        event_description: eventDescription,
        completed: completed,
      },
    ]);

    if (error) {
      console.error("Error inserting event:", error);
    }
  }
  const handleFetchTokens = async () => {
    try {
      // Now fetch the tokens after the delay
      const fetchedTokens = await fetchTokens();

      if (!Array.isArray(fetchedTokens)) {
        return;
      }

      setSettingsSavedFacilities(fetchedTokens);
      setTokens(fetchedTokens);

      fetchedTokens.forEach((facility, index) => {
        handleOldLogin(facility, index);
      });
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };
  const fetchTokens = async () => {
    if (!user) {
      return;
    }

    // Attempt to fetch existing tokens for the user
    const { data: currentData, error: fetchError } = await supabase
      .from("user_data")
      .select("tokens")
      .eq("user_id", user.id)
      .single();

    // Handle the case where no data is found
    let updatedTokens;
    if (fetchError && fetchError.code === "PGRST116") {
      return [];
    } else if (fetchError) {
      console.error("Error fetching current tokens:", fetchError.message);
      toast.error("Failed to retrieve current credentials.");
      return;
    } else {
      updatedTokens = currentData?.tokens || [];
      return updatedTokens;
    }
  };
  const submitCredentials = async () => {
    let updatedTokens = (await fetchTokens()) || [];
    // Add the new set of credentials to the array
    updatedTokens.push({
      api,
      apiSecret,
      client,
      clientSecret,
      environment,
    });

    // Upsert with the updated tokens array
    const { data, error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        tokens: updatedTokens,
        last_update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      await addEvent(
        "Create Authentication",
        `${user.email} created an authentication connection`,
        false
      );
      console.error("Error saving credentials:", error.message);
    } else {
      await addEvent(
        "Create Authentication",
        `${user.email} created an authentication connection`,
        true
      );
      setApi("");
      setApiSecret("");
      setClient("");
      setClientSecret("");
      setIsAuthenticated(false);
      handleFetchTokens();
    }
  };
  const removeToken = async (apiToRemove) => {
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

    // Fetch existing tokens for the user
    const { data: currentData, error: fetchError } = await supabase
      .from("user_data")
      .select("tokens")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching current tokens:", fetchError.message);
      toast.error("Failed to retrieve current credentials.");
      return;
    }

    // Filter out the token to remove
    const updatedTokens = (currentData?.tokens || []).filter(
      (token) => token.api !== apiToRemove
    );

    // Upsert the updated tokens array back to the database
    const { data, error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        tokens: updatedTokens,
        last_update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      await addEvent(
        "Delete Authentication",
        `${user.email} deleted an authentication connection`,
        false
      );
      console.error("Error removing token:", error.message);
    } else {
      await addEvent(
        "Delete Authentication",
        `${user.email} deleted an authentication connection`,
        true
      );
      await handleFetchTokens();
    }
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
  const exportFacilities = () => {
    const userResponse = confirm("Are you sure you want to export the tokens?");
    if (!userResponse) {
      console.log("User denied export.");
      return;
    }
    // Convert the data to CSV format
    const headers = [
      "api",
      "apiSecret",
      "client",
      "clientSecret",
      "environment",
    ];
    // Create rows
    const csvRows = [
      headers.join(","), // Add headers to rows
      ...settingsSavedFacilities.map((facility) =>
        [
          facility.api,
          facility.apiSecret,
          facility.client,
          facility.clientSecret,
          facility.environment === ""
            ? "Production"
            : facility.environment === "-dev"
            ? "Development"
            : facility.environment === "-qa"
            ? "QA"
            : facility.environment === "cia-stg-1.aws."
            ? "Staging"
            : "N/A",
        ].join(",")
      ),
    ];

    // Create a blob from the CSV rows
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create a link to download the file
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Authentication-Settings.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addEvent(
      "Export Authentication",
      `${user.email} exported their authentication connections`,
      true
    );
  };
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        parseCSV(csvData);
      };
      reader.readAsText(file);
    }
  };
  const parseCSV = (csvData) => {
    const lines = csvData.split("\n").filter((line) => line.trim() !== "");
    const headers = lines[0].split(",").map((header) => header.trim());

    const data = lines.slice(1).map((line) => {
      const values = line.split(",");
      const entry = headers.reduce((obj, header, index) => {
        obj[header] = values[index] ? values[index].trim() : "";
        return obj;
      }, {});
      return entry;
    });

    importFacilities(data);
    console.log("Imported Data:", data);
  };
  const importFacilities = async (facilities) => {
    const updatedFacilities = facilities.map(
      ({ api, apiSecret, client, clientSecret, environment }) => ({
        api,
        apiSecret,
        client,
        clientSecret,
        environment:
          environment == "Development"
            ? "-dev"
            : environment == "QA"
            ? "-qa"
            : environment == "Staging"
            ? "cia-stg-1.aws."
            : environment == "Production"
            ? ""
            : "UNRESOLVED",
      })
    );
    const allTokens = [...(tokens || []), ...updatedFacilities];
    const { data, error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        tokens: allTokens,
        last_update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) {
      alert("Failed to import!");
      await addEvent(
        "Create Authentication",
        `${user.email} imported an authentication connection`,
        false
      );
      return;
    }
    await addEvent(
      "Create Authentication",
      `${user.email} imported an authentication connection`,
      true
    );
    window.location.reload();
  };
  // Simulate a click on the hidden file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Run login for all saved facilities when settingsSavedFacilities changes
  useEffect(() => {
    if (!user) {
      return;
    }
    handleFetchTokens();
    tokens.forEach((facility, index) => {
      handleOldLogin(facility, index);
    });
  }, [user]);

  return (
    <div className="dark:text-white dark:bg-darkPrimary h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      {user && permissions.authenticationPlatform ? (
        <div>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <div className="w-full h-full px-5 flex flex-col rounded-lg">
            <div className="flex justify-between mt-2">
              <div></div>
              <div className="flex">
                <button
                  className={`flex m-1 rounded p-3 text-black dark:text-white transition duration-300 ease-in-out ${
                    permissions.authenticationPlatformExport
                      ? "bg-gray-100 dark:bg-darkSecondary hover:text-slate-400 hover:dark:text-slate-400 hover:cursor-pointer"
                      : "bg-gray-200 dark:bg-darkTertiary text-gray-400 cursor-not-allowed"
                  }`}
                  title="Export Tokens"
                  onClick={() => {
                    if (permissions.authenticationPlatformExport) {
                      exportFacilities();
                    }
                  }}
                  disabled={!permissions.authenticationPlatformExport}
                >
                  <CiExport className="text-2xl" /> Export
                </button>
                <button
                  className={`flex m-1 rounded p-3 text-black dark:text-white transition duration-300 ease-in-out ${
                    permissions.authenticationPlatformImport
                      ? "bg-gray-100 dark:bg-darkSecondary hover:text-slate-400 hover:dark:text-slate-400 hover:cursor-pointer"
                      : "bg-gray-200 dark:bg-darkTertiary text-gray-400 cursor-not-allowed"
                  }`}
                  title="Import Tokens"
                  onClick={() => {
                    if (permissions.authenticationPlatformImport) {
                      triggerFileInput();
                    }
                  }}
                  disabled={!permissions.authenticationPlatformImport}
                >
                  <CiImport className="text-2xl" />
                  Import
                </button>
                {/* Hidden File Input */}
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                  disabled={!permissions.authenticationPlatformImport}
                />
              </div>
            </div>
            <div className="mt-3 overflow-y-auto max-h-[80vh]">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-200 dark:bg-darkNavSecondary">
                    <th
                      className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                      onClick={() => {
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
                        setSortDirection(newDirection);
                        setSettingsSavedFacilities(
                          [...settingsSavedFacilities].sort((a, b) => {
                            if (a.api < b.api)
                              return newDirection === "asc" ? -1 : 1;
                            if (a.api > b.api)
                              return newDirection === "asc" ? 1 : -1;
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
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
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
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
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
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
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
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
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
                            className={`m-1 px-4 py-1 rounded-md text-white transition duration-300 ease-in-out ${
                              permissions.authenticationPlatformDelete
                                ? "bg-red-500 hover:bg-red-600 cursor-pointer"
                                : "bg-red-300 cursor-not-allowed"
                            }`}
                            onClick={() => {
                              if (permissions.authenticationPlatformDelete) {
                                toast.promise(removeToken(facility.api), {
                                  loading: "Deleting Credentials...",
                                  success: <b>Successfully deleted!</b>,
                                  error: <b>Failed deletion!</b>,
                                });
                              }
                            }}
                            disabled={!permissions.authenticationPlatformDelete}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {permissions.authenticationPlatformCreate && (
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
                          {permissions.authenticationPlatformEnvironmentProduction && (
                            <option value="">Production</option>
                          )}
                          {permissions.authenticationPlatformEnvironmentDevelopment && (
                            <option value="-dev">Development</option>
                          )}
                          {permissions.authenticationPlatformEnvironmentQA && (
                            <option value="-qa">QA</option>
                          )}
                          {permissions.authenticationPlatformEnvironmentStaging && (
                            <option value="cia-stg-1.aws.">Staging</option>
                          )}
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
                              toast.promise(submitCredentials(), {
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
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <NotFound />
        </div>
      )}
    </div>
  );
}
