import { useRef, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { FaCircleCheck, FaSpinner } from "react-icons/fa6";
import { MdOutlineError } from "react-icons/md";
import axios from "axios";
import qs from "qs";
import toast from "react-hot-toast";
import { CiExport, CiImport } from "react-icons/ci";
import { useAuth } from "../context/AuthProvider";
import NotFound from "../components/NotFound";
import { supabase } from "../supabaseClient";
import DataTable from "../components/modules/DataTable";
import AddAuthenticationModal from "../components/modals/AddAuthenticationModal";
import PaginationFooter from "../components/PaginationFooter";

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
  const { user, tokens, setTokens, permissions } = useAuth();
  const [sortedColumn, setSortedColumn] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginatedFacilities = settingsSavedFacilities.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
    if (!user) return;

    const { data: currentData, error } = await supabase
      .from("user_data")
      .select("tokens")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching tokens:", error.message);
      toast.error("Failed to retrieve user tokens.");
      return [];
    }

    if (!currentData) {
      const { error: insertError } = await supabase.from("user_data").insert([
        {
          user_id: user.id,
          tokens: [],
          last_update_at: new Date().toISOString(),
        },
      ]);
      if (insertError) {
        console.error("Error initializing user_data:", insertError.message);
      }
      return [];
    }

    return currentData.tokens || [];
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
  const handleNewLogin = async (env, creds = null) => {
    const { api: a, apiSecret: s, client: c, clientSecret: cs } = creds || {};
    const apiVal = a || api;
    const apiSecretVal = s || apiSecret;
    const clientVal = c || client;
    const clientSecretVal = cs || clientSecret;

    const data = qs.stringify({
      grant_type: "password",
      username: apiVal,
      password: apiSecretVal,
      client_id: clientVal,
      client_secret: clientSecretVal,
    });

    const url = `https://auth.${
      env === "cia-stg-1.aws." ? env : ""
    }insomniaccia${env === "" ? "" : env}.com/auth/token`;

    return axios.post(url, data, {
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
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
      headers.join(","),
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

  const columns = [
    {
      key: "api",
      label: "API Key",
      accessor: (f) =>
        f.api
          ? "•".repeat(Math.max(0, f.api.length - 5)) + f.api.slice(-5)
          : "",
    },
    {
      key: "apiSecret",
      label: "API Secret",
      accessor: (f) =>
        f.apiSecret
          ? "•".repeat(Math.max(0, f.apiSecret.length - 5)) +
            f.apiSecret.slice(-5)
          : "",
    },
    {
      key: "client",
      label: "Client",
      accessor: (f) => f.client || "",
    },
    {
      key: "clientSecret",
      label: "Client Secret",
      accessor: (f) =>
        f.clientSecret
          ? "•".repeat(Math.max(0, f.clientSecret.length - 5)) +
            f.clientSecret.slice(-5)
          : "",
    },
    {
      key: "environment",
      label: "Environment",
      accessor: (f) => {
        switch (f.environment) {
          case "":
            return "Production";
          case "-dev":
            return "Development";
          case "-qa":
            return "QA";
          case "cia-stg-1.aws.":
            return "Staging";
          default:
            return f.environment;
        }
      },
    },
    {
      key: "isAuthenticated",
      label: "Authenticated",
      sortable: false,
      render: (f) => (
        <div className="flex justify-center text-lg">
          {f.isAuthenticated === true ? (
            <FaCircleCheck className="text-green-500" />
          ) : f.isAuthenticated === false ? (
            <MdOutlineError className="text-red-500" />
          ) : (
            <FaSpinner className="animate-spin text-gray-500" />
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (f) => (
        <button
          className={`m-1 px-4 py-1 rounded-md text-white transition duration-300 ease-in-out ${
            permissions.authenticationPlatformDelete
              ? "bg-red-500 hover:bg-red-600 cursor-pointer"
              : "bg-red-300 cursor-not-allowed"
          }`}
          onClick={() => {
            if (permissions.authenticationPlatformDelete) {
              toast.promise(removeToken(f.api), {
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
      ),
    },
  ];
  const handleColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    const newDirection =
      sortedColumn !== columnKey
        ? "asc"
        : sortDirection === "asc"
        ? "desc"
        : null;

    setSortedColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);

    if (!newDirection) {
      setSettingsSavedFacilities([...settingsSavedFacilities]);
      return;
    }

    const sorted = [...settingsSavedFacilities].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setSettingsSavedFacilities(sorted);
  };

  return (
    <div className="dark:text-white dark:bg-darkPrimary h-screen w-screen flex flex-col overflow-hidden font-roboto">
      {isAddModalOpen && (
        <AddAuthenticationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={submitCredentials}
          handleNewLogin={handleNewLogin}
        />
      )}
      {user && permissions.authenticationPlatform ? (
        <div>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <div className="w-full h-full px-5 flex flex-col rounded-lg overflow-y-auto">
            <div className="flex justify-between mt-2">
              <div></div>
              <div className="flex flex-wrap gap-2 p-3">
                {permissions.authenticationPlatformCreate && (
                  <button
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold cursor-pointer transition duration-300 ease-in-out"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    Add Authentication
                  </button>
                )}
                {permissions.authenticationPlatformExport && (
                  <button
                    className="cursor-pointer rounded px-4 py-2 bg-gray-100 dark:bg-darkSecondary text-black dark:text-white hover:text-slate-400 dark:hover:text-slate-400 transition duration-300 ease-in-out"
                    title="Export Tokens"
                    onClick={exportFacilities}
                  >
                    Export
                  </button>
                )}
                {permissions.authenticationPlatformImport && (
                  <>
                    <button
                      className="cursor-pointer rounded px-4 py-2 bg-gray-100 dark:bg-darkSecondary text-black dark:text-white hover:text-slate-400 dark:hover:text-slate-400 transition duration-300 ease-in-out"
                      title="Import Tokens"
                      onClick={triggerFileInput}
                    >
                      Import
                    </button>
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                  </>
                )}
              </div>
            </div>
            <div className="mt-3 overflow-y-auto max-h-[75vh]">
              <DataTable
                columns={columns}
                data={paginatedFacilities}
                sortedColumn={sortedColumn}
                sortDirection={sortDirection}
                onSort={handleColumnSort}
              />
            </div>
            <div className="px-2 py-5 mx-1">
              <PaginationFooter
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                items={settingsSavedFacilities}
              />
            </div>
          </div>
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
