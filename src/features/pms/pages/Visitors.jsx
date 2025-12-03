import CreateVisitorVisitor from "@features/pms/modals/CreateVisitorVisitorPage";
import EditVisitorVisitorPage from "@features/pms/modals/EditVisitorVisitorPage";
import PaginationFooter from "@components/shared/PaginationFooter";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import DataTable from "@components/shared/DataTable";
import { useAuth } from "@context/AuthProvider";
import { FaPerson } from "react-icons/fa6";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import DeleteModal from "@features/pms/modals/DeleteModal";
import InputBox from "@components/UI/InputBox";
import GeneralButton from "@components/UI/GeneralButton";
import TableButton from "@components/UI/TableButton";
import { addEvent } from "@hooks/supabase";

export default function Visitors({ currentFacilityName }) {
  const [visitors, setVisitors] = useState([]);
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState("");
  const [isEditVisitorModalOpen, setIsEditVisitorModalOpen] = useState("");
  const [filteredVisitors, setFilteredVisitors] = useState(visitors);
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [visitorsPulled, setVisitorsPulled] = useState(false);
  const { currentFacility, permissions } = useAuth();
  const [smartLocks, setSmartLocks] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentLoadingText] = useState("Loading Visitors...");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [continousDelete, setContinousDelete] = useState(false);
  const { user } = useAuth();
  const tenantCount = filteredVisitors.filter(
    (visitor) => visitor.isTenant === true
  ).length;
  const nonTenantCount = filteredVisitors.filter(
    (visitor) => visitor.isPortalVisitor === true
  ).length;
  const guestCount = filteredVisitors.filter(
    (visitor) => visitor.isTenant === false && visitor.isPortalVisitor === false
  ).length;

  const handleColumnSort = (columnKey, accessor = (a) => a[columnKey]) => {
    let newDirection;

    if (sortedColumn !== columnKey) {
      newDirection = "asc";
    } else if (sortDirection === "asc") {
      newDirection = "desc";
    } else if (sortDirection === "desc") {
      newDirection = null;
    }

    setSortedColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);

    if (!newDirection) {
      setFilteredVisitors([...visitors]);
      return;
    }

    const sorted = [...filteredVisitors].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredVisitors(sorted);
  };
  const handleVisitors = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }

    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
      },
    };

    return axios(config)
      .then(function (response) {
        const sortedVisitors = response.data.sort((a, b) => {
          if (a.unitNumber < b.unitNumber) return -1;
          if (a.unitNumber > b.unitNumber) return 1;
          return 0;
        });
        setSortedColumn("Unit Number");
        setVisitors(sortedVisitors);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };
  const handleSmartLocks = async () => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }

      const response = await axios.get(
        `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/smartlockstatus`,
        {
          headers: {
            Authorization: "Bearer " + currentFacility?.token?.access_token,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const smartLocks = response.data;
      if (smartLocks.length > 0) {
        setSmartLocks(smartLocks);
        return smartLocks;
      } else {
        return false;
      }
    } catch (error) {
      console.error(
        `Error fetching SmartLocks for: ${currentFacility.name}`,
        error
      );
      console.error(`${currentFacility.name} does not have SmartLocks`);
      return null;
    }
  };
  const moveOutVisitor = async (visitor) => {
    const handleDelete = async () => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }

      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units/${visitor.unitId}/vacate?suppressCommands=true`,

        headers: {
          Authorization: "Bearer " + currentFacility?.token?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: "",
      };

      return axios(config)
        .then(function (response) {
          setVisitors((prevUnits) =>
            prevUnits.filter((u) => u.unitNumber !== visitor.unitNumber)
          );
          return response;
        })
        .catch(async function (error) {
          await addEvent(
            "Remove Tenant",
            `${user.email} moved out ${visitor.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
            false
          );
          throw error;
        });
    };
    toast.promise(handleDelete(), {
      loading: "Moving out Tenant " + visitor.name + "...",
      success: <b>{visitor.unitNumber} successfully moved out!</b>,
      error: <b>{visitor.unitNumber} failed move out!</b>,
    });
    await addEvent(
      "Remove Tenant",
      `${user.email} moved out ${visitor.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
      true
    );
  };
  const deleteVisitor = async (visitor) => {
    const handleDelete = async () => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }

      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors/${visitor.id}/remove`,

        headers: {
          Authorization: "Bearer " + currentFacility?.token?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: "",
      };

      return axios(config)
        .then(function (response) {
          setVisitors((prevUnits) =>
            prevUnits.filter((u) => u.id !== visitor.id)
          );
          return response;
        })
        .catch(async function (error) {
          await addEvent(
            "Remove Tenant",
            `${user.email} moved out ${visitor.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
            false
          );
          throw error;
        });
    };

    toast.promise(handleDelete(), {
      loading: "Deleting Visitor " + visitor.name + "...",
      success: <b>{visitor.name} successfully deleted!</b>,
      error: <b>{visitor.name} failed deletion!</b>,
    });
    await addEvent(
      "Remove Tenant",
      `${user.email} moved out ${visitor.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
      true
    );
  };

  const handleDelete = (v) => {
    if (v.isTenant) {
      moveOutVisitor(v);
    } else {
      deleteVisitor(v);
    }
  };

  // Run handleUnits once when the component loads
  useEffect(() => {
    const fetchVisitors = async () => {
      if (!currentFacility.token) return;
      if (visitorsPulled) return;
      await handleVisitors();
      await handleSmartLocks();
      setVisitorsPulled(true);
    };

    fetchVisitors();
  }, [currentFacility, visitorsPulled]);

  useEffect(() => {
    // Filter facilities based on the search query
    const filteredVisitors = visitors.filter(
      (visitor) =>
        (visitor.id?.toString() || "").includes(searchQuery) ||
        (visitor.accessProfileName?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (visitor.timeGroupName?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (visitor.name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (visitor.unitNumber?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (visitor.mobilePhoneNumber?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (visitor.email?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (visitor.code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
    setFilteredVisitors(filteredVisitors);
  }, [visitors, searchQuery]);

  const columns = [
    { key: "id", label: "Visitor Id", accessor: (v) => v.id || "" },
    {
      key: "unitNumber",
      label: "Unit Number",
      accessor: (v) => v.unitNumber || "",
    },
    { key: "name", label: "Tenant Name", accessor: (v) => v.name || "" },
    {
      key: "type",
      label: "Visitor Type",
      accessor: (v) =>
        v.isTenant
          ? "Tenant"
          : v.isPortalVisitor
          ? "Non-Tenant"
          : !v.unitNumber
          ? "Non-Tenant Guest"
          : "Guest",
    },
    {
      key: "accessProfileName",
      label: "Access Profile",
      accessor: (v) => v.accessProfileName || "",
    },
    {
      key: "timeGroupName",
      label: "Time Profile",
      accessor: (v) => v.timeGroupName || "",
    },
    { key: "code", label: "Gate Code", accessor: (v) => v.code || "" },
    {
      key: "mobilePhoneNumber",
      label: "Phone Number",
      accessor: (v) => v.mobilePhoneNumber || "",
    },
    { key: "email", label: "Email", accessor: (v) => v.email || "" },
    {
      key: "smartlock",
      label: "SmartLock",
      sortable: true,
      accessor: (v) => {
        const lock = smartLocks.find((l) => l.unitId === v.unitId);
        return lock?.name?.toLowerCase() || "";
      },
      render: (v, i) => {
        const matchingLock = smartLocks.find(
          (lock) => lock.unitId === v.unitId
        );
        if (!matchingLock) return "";

        return (
          <div
            className="relative hover:cursor-pointer"
            onMouseDown={() => setHoveredRow(i)}
            onMouseLeave={() => setHoveredRow(null)}
          >
            <span>{`${matchingLock.deviceType} - ${matchingLock.name}`}</span>
            {hoveredRow === i && (
              <div className="absolute z-10 dark:bg-zinc-800 bg-white text-black dark:text-white p-4 rounded shadow-lg w-md left-1/2 transform -translate-x-1/2 shadow-zinc-300 dark:shadow-zinc-900">
                <div className="grid grid-cols-2 gap-3 text-xs max-h-64 overflow-y-auto text-left overflow-x-clip p-2">
                  {Object.entries(matchingLock).map(([key, value], idx) => (
                    <div key={idx}>
                      <span className="font-bold text-yellow-400 overflow-ellipsis">
                        {key}:
                      </span>{" "}
                      <span className="wrap-break-word">
                        {value === null || value === ""
                          ? "null"
                          : value.toString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (v) => (
        <div className="text-center flex gap-1">
          {permissions.pmsPlatformVisitorEdit && (
            <TableButton
              className="bg-green-500 hover:bg-green-600"
              onclick={() => {
                setSelectedVisitor(v);
                setIsEditVisitorModalOpen(true);
              }}
              text={"Edit"}
            />
          )}
          {permissions.pmsPlatformVisitorDelete && (
            <TableButton
              text={v.isTenant ? "Move Out" : "Delete"}
              className={`${
                v.isTenant
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              onclick={() => {
                if (continousDelete) {
                  handleDelete(v);
                } else {
                  setSelectedVisitor(v);
                  setIsDeleteModalOpen(true);
                }
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div
      className={`relative ${
        !visitorsPulled ? "overflow-hidden min-h-full" : "overflow-auto"
      } h-full dark:text-white dark:bg-zinc-900 relative`}
    >
      {/* Create Visitor Modal Popup */}
      {isCreateVisitorModalOpen && (
        <CreateVisitorVisitor
          setIsCreateVisitorModalOpen={setIsCreateVisitorModalOpen}
          setVisitors={setVisitors}
        />
      )}
      {/* Edit Visitor Modal Popup */}
      {isEditVisitorModalOpen && (
        <EditVisitorVisitorPage
          setIsEditVisitorModalOpen={setIsEditVisitorModalOpen}
          setVisitors={setVisitors}
          visitor={selectedVisitor}
        />
      )}
      {/* Delete Visitor Modal Popup */}
      {isDeleteModalOpen && (
        <DeleteModal
          type={"visitor"}
          setIsDeleteModalOpen={setIsDeleteModalOpen}
          handleDelete={handleDelete}
          value={selectedVisitor}
          setContinousDelete={setContinousDelete}
          continousDelete={continousDelete}
        />
      )}
      {/* Loading Spinner */}
      {!visitorsPulled && <LoadingSpinner loadingText={currentLoadingText} />}
      {/* Page Header */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-zinc-700 dark:bg-zinc-950">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; Visitors | {currentFacilityName}
        </div>
      </div>
      {/* Load Time Label */}
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        {/* Totals Header */}
        <div className="mt-5 min-h-12 flex justify-center gap-32">
          <div className="text-center">
            <div className="font-bold text-2xl">{tenantCount}</div>
            Tenants
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{guestCount}</div>
            Guests
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{nonTenantCount}</div>
            Non-Tenants
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">
              {nonTenantCount + tenantCount + guestCount}
            </div>
            Total
          </div>
        </div>
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          {/* Search Bar */}
          <InputBox
            type="text"
            placeholder="Search visitors..."
            onchange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
            value={searchQuery}
          />
          {/* Create Visitor Button */}
          {permissions.pmsPlatformVisitorCreate && (
            <GeneralButton
              text={"Create Visitor"}
              className="bg-green-500 hover:bg-green-600"
              onclick={() => {
                if (permissions.pmsPlatformVisitorCreate) {
                  setIsCreateVisitorModalOpen(true);
                }
              }}
            />
          )}
        </div>
        {/* Visitor Table */}
        <DataTable
          columns={columns}
          data={filteredVisitors}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
        />
        {/* Pagination Footer */}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredVisitors}
          />
        </div>
      </div>
    </div>
  );
}
