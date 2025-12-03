import Navbar from "@components/shared/Navbar";
import NotFound from "@components/shared/NotFound";
import DataTable from "@components/shared/DataTable";
import AddAuthentication from "@features/facilityAuthentication/modals/AddAuthentication";
import PaginationFooter from "@components/shared/PaginationFooter";
import RenameAuthentication from "@features/facilityAuthentication/modals/RenameAuthentication";
import toast from "react-hot-toast";
import { supabase } from "@app/supabaseClient";
import { FaCircleCheck, FaSpinner } from "react-icons/fa6";
import { MdOutlineError } from "react-icons/md";
import { useAuth } from "@context/AuthProvider";
import { useRef, useState, useEffect } from "react";
import { addEvent } from "@hooks/supabase";
import { handleSingleLogin } from "@hooks/opentech";
import GeneralButton from "@components/UI/GeneralButton";

export default function AuthenticationSettings({ darkMode, toggleDarkMode }) {
  const [settingsSavedFacilities, setSettingsSavedFacilities] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const fileInputRef = useRef(null);
  const { user, tokens, setTokens, permissions } = useAuth();

  const handleRename = (token) => {
    setSelectedToken(token);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = async (updatedToken) => {
    const currentTokens = await fetchTokens();
    const updatedTokens = currentTokens.map((t) =>
      t.api === updatedToken.api ? { ...t, name: updatedToken.name } : t
    );

    const { error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        tokens: updatedTokens,
        last_update_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      toast.error("Failed to rename token");
      console.error(error.message);
    } else {
      setSettingsSavedFacilities(updatedTokens);
      setTokens(updatedTokens);
      toast.success("Token renamed successfully!");
    }
  };
  const paginatedFacilities = settingsSavedFacilities.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const handleFetchTokens = async () => {
    try {
      const fetchedTokens = await fetchTokens();

      if (!Array.isArray(fetchedTokens)) {
        return;
      }

      setSettingsSavedFacilities(fetchedTokens);
      setTokens(fetchedTokens);

      fetchedTokens.forEach((facility, index) => {
        handleReauthentication(facility, index);
      });
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };
  // Fetch tokens from the Supabase database
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
  const submitCredentials = async (facility) => {
    if (!user) return;
    const newToken = {
      name: facility.name || "",
      api: facility.api || "",
      apiSecret: facility.apiSecret || "",
      client: facility.client || "",
      clientSecret: facility.clientSecret || "",
      environment: facility.environment || "",
    };

    const dbTokens = [
      ...settingsSavedFacilities.map(({ ...t }) => t),
      newToken,
    ];

    // Upsert to database
    const { data, error } = await supabase.from("user_data").upsert(
      {
        user_id: user.id,
        tokens: dbTokens,
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
      return error;
    } else {
      setSettingsSavedFacilities((prevFacilities) => [
        ...prevFacilities,
        { ...newToken, isAuthenticated: true },
      ]);
      setTokens(dbTokens);
      await addEvent(
        "Create Authentication",
        `${user.email} created an authentication connection`,
        true
      );
      return data;
    }
  };

  const removeToken = async (facility) => {
    if (!user) {
      toast.error("User not authenticated.");
      return;
    }

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

    const updatedTokens = (currentData?.tokens || []).filter((token) => {
      return token.api !== facility.api;
    });

    const { error } = await supabase.from("user_data").upsert(
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
      // Update local state (settingsSavedFacilities)
      setSettingsSavedFacilities(updatedTokens);
      setTokens(updatedTokens);
    }
  };

  const handleReauthentication = async (facility, index) => {
    const result = await handleSingleLogin({
      api: facility.api,
      apiSecret: facility.apiSecret,
      client: facility.client,
      clientSecret: facility.clientSecret,
      environment: facility.environment,
    });
    if (result.error) {
      setSettingsSavedFacilities((prevFacilities) =>
        prevFacilities.map((f, i) =>
          i === index ? { ...f, isAuthenticated: false } : f
        )
      );
    } else {
      setSettingsSavedFacilities((prevFacilities) =>
        prevFacilities.map((f, i) =>
          i === index ? { ...f, isAuthenticated: true } : f
        )
      );
    }
  };
  const handleNewAuthenitcation = async (env, creds = null) => {
    if (env === "prod") env = "";
    const res = await handleSingleLogin({
      api: creds.api,
      apiSecret: creds.apiSecret,
      client: creds.client,
      clientSecret: creds.clientSecret,
      environment: env,
    });
    return res;
  };

  // Export authentication settings to CSV
  const exportFacilities = () => {
    const userResponse = confirm("Are you sure you want to export the tokens?");
    if (!userResponse) {
      console.log("User denied export.");
      return;
    }
    // Convert the data to CSV format
    const headers = [
      "name",
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
          facility.name || "",
          facility.api || "",
          facility.apiSecret || "",
          facility.client || "",
          facility.clientSecret || "",
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
  };
  const importFacilities = async (facilities) => {
    const updatedFacilities = facilities.map(
      ({ name, api, apiSecret, client, clientSecret, environment }) => ({
        name,
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
    const { error } = await supabase.from("user_data").upsert(
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
      handleReauthentication(facility, index);
    });
  }, [user]);

  // Table and column definitions
  const columns = [
    {
      key: "name",
      label: "Name",
      accessor: (f) => f.name || "",
    },
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
            <FaSpinner className="animate-spin text-zinc-500" />
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (f) => (
        <div className="flex justify-center gap-1">
          {permissions.authenticationPlatformDelete && (
            <button
              className="bg-yellow-500 hover:bg-yellow-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
              onClick={() => handleRename(f)}
            >
              Rename
            </button>
          )}
          {permissions.authenticationPlatformDelete && (
            <button
              className="bg-red-500 hover:bg-red-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
              onClick={() => {
                toast.promise(removeToken(f), {
                  loading: "Deleting Credentials...",
                  success: <b>Successfully deleted!</b>,
                  error: <b>Failed deletion!</b>,
                });
              }}
            >
              Delete
            </button>
          )}
        </div>
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
      {/* Authentication Creation Modal */}
      {isAddModalOpen && (
        <AddAuthentication
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={submitCredentials}
          handleNewLogin={handleNewAuthenitcation}
        />
      )}
      {/* Authentication Rename Modal */}
      {isRenameModalOpen && (
        <RenameAuthentication
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
          onSubmit={handleRenameSubmit}
          token={selectedToken}
        />
      )}
      {/* Main Page, check for permissions */}
      {user && permissions.authenticationPlatform ? (
        <div>
          {/* Navbar */}
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          {/* Body */}
          <div className="w-full h-full px-5 flex flex-col rounded-lg overflow-y-auto">
            <div className="flex justify-between mt-2">
              <div></div>
              <div className="flex flex-wrap gap-2 p-3">
                {/* Create Authenitcation Button, check for permissions */}
                {permissions.authenticationPlatformCreate && (
                  <GeneralButton
                    className="bg-green-500 hover:bg-green-600"
                    onclick={() => setIsAddModalOpen(true)}
                    text={"Add Authentication"}
                  />
                )}
                {/* Export Authenitcation Button, check for permissions */}
                {permissions.authenticationPlatformExport && (
                  <GeneralButton
                    title="Export Tokens"
                    onclick={exportFacilities}
                    text={"Export Tokens"}
                  />
                )}
                {/* Import Authenitcation Button, check for permissions */}
                {permissions.authenticationPlatformImport && (
                  <>
                    <GeneralButton
                      title="Import Tokens"
                      onclick={triggerFileInput}
                      text={"Import Tokens"}
                    />
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
            {/* Table & Pagination */}
            <div className="mt-3 overflow-y-auto max-h-[75vh]">
              <DataTable
                columns={columns}
                data={paginatedFacilities.map((item, index) => ({
                  ...item,
                  index,
                }))}
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
        // If user is not authenticated or doesn't have permission
        // Show Not Found page
        <NotFound />
      )}
    </div>
  );
}
