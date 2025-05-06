import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import CreateUnit from "./modals/CreateUnit";
import CreateVisitor from "./modals/CreateVisitorUnit";
import { RiDoorLockFill } from "react-icons/ri";
import EditVisitor from "./modals/EditVisitorUnit";
import { useAuth } from "../context/AuthProvider";
import { addEvent } from "../functions/events";
import PaginationFooter from "./PaginationFooter";
import LoadingSpinner from "./LoadingSpinner";
import DataTable from "./modules/DataTable";

export default function UnitPage({
  currentFacilityName = { currentFacilityName },
}) {
  const [units, setUnits] = useState([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false);
  const [visitorAutofill, setVisitorAutofill] = useState(
    localStorage.getItem("visitorAutofill") === "true"
  );
  const [selectedUnit, setSelectedUnit] = useState("");
  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const [isEditVisitorModalOpen, setIsEditVisitorModalOpen] = useState(false);
  const [filteredUnits, setFilteredUnits] = useState(units);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [unitsPulled, setUnitsPulled] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const { currentFacility, user, permissions } = useAuth();
  const [smartLocks, setSmartLocks] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentLoadingText, setCurrentLoadingText] =
    useState("Loading Units...");
  const rentedCount = filteredUnits.filter(
    (unit) => unit.status === "Rented"
  ).length;
  const delinquentCount = filteredUnits.filter(
    (unit) => unit.status === "Delinquent"
  ).length;
  const vacantCount = filteredUnits.filter(
    (unit) => unit.status === "Vacant"
  ).length;

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
        setSortedColumn("Unit Number");
        setUnits(sortedUnits);
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
  const moveIn = async (unit) => {
    const handleRent = async () => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }
      const data = {
        timeGroupId: timeProfiles[0].id,
        accessProfileId: accessProfiles[0].id,
        unitId: unit.id,
        accessCode:
          Math.floor(Math.random() * (999999999 - 100000 + 1)) + 100000,
        lastName: "Tenant",
        firstName: "Temporary",
        email: "automations@temp.com",
        mobilePhoneNumber: "9996666999",
        isTenant: true,
        extendedData: {
          additionalProp1: null,
          additionalProp2: null,
          additionalProp3: null,
        },
        suppressCommands: false,
      };

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

      return axios(config)
        .then(function (response) {
          setFilteredUnits((prevUnits) =>
            prevUnits.map((u) =>
              u.id === unit.id ? { ...u, status: "Rented" } : u
            )
          );
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };

    if (visitorAutofill) {
      try {
        await toast.promise(handleRent(), {
          loading: "Renting Unit " + unit.unitNumber + "...",
          success: <b>{unit.unitNumber} successfully rented!</b>,
          error: <b>{unit.unitNumber} failed rental!</b>,
        });
        await addEvent(
          "Add Tenant",
          `${user.email} rented unit ${unit.unitNumber} to Tenant Temporary at facility ${currentFacility.name}, ${currentFacility.id}`,
          true
        );
      } catch (error) {
        await addEvent(
          "Add Tenant",
          `${user.email} rented unit ${unit.unitNumber} to Tenant Temporary at facility ${currentFacility.name}, ${currentFacility.id}`,
          false
        );
      }
    } else {
      setIsCreateVisitorModalOpen(true);
    }
  };
  const turnRented = async (unit) => {
    const handleRentalStatus = async () => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }
      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units/${unit.id}/enable?suppressCommands=true`,
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
          setFilteredUnits((prevUnits) =>
            prevUnits.map((u) =>
              u.id === unit.id ? { ...u, status: "Rented" } : u
            )
          );
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };
    try {
      toast.promise(handleRentalStatus(), {
        loading: "Changing " + unit.unitNumber + "to rented...",
        success: <b>{unit.unitNumber} successfully changed to rented!</b>,
        error: <b>{unit.unitNumber} failed status change!</b>,
      });
      await addEvent(
        "Update Unit To Rented",
        `${user.email} set ${unit.unitNumber} as rented at ${currentFacilityName}, facility id ${currentFacility.id}`,
        true
      );
    } catch (error) {
      await addEvent(
        "Update Unit To Rented",
        `${user.email} set ${unit.unitNumber} as rented at ${currentFacilityName}, facility id ${currentFacility.id}`,
        false
      );
    }
  };
  const moveOut = async (unit) => {
    const handleMoveOut = async () => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }

      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units/${unit.id}/vacate?suppressCommands=true`,
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
          setFilteredUnits((prevUnits) =>
            prevUnits.map((u) =>
              u.id === unit.id ? { ...u, status: "Vacant" } : u
            )
          );
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };
    try {
      await toast.promise(handleMoveOut(), {
        loading: "Removing tenant from unit " + unit.unitNumber + "...",
        success: <b>{unit.unitNumber} successfully vacated!</b>,
        error: <b>{unit.unitNumber} failed rental!</b>,
      });
      await addEvent(
        "Remove Tenant",
        `${user.email} moved out ${unit.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
        true
      );
    } catch (error) {
      await addEvent(
        "Remove Tenant",
        `${user.email} moved out ${unit.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
        false
      );
    }
  };
  const turnDelinquent = async (unit) => {
    const handleRentalStatus = async () => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }
      const config = {
        method: "post",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units/${unit.id}/disable?suppressCommands=true`,
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
          setFilteredUnits((prevUnits) =>
            prevUnits.map((u) =>
              u.id === unit.id ? { ...u, status: "Delinquent" } : u
            )
          );
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };
    try {
      toast.promise(handleRentalStatus(), {
        loading: "Changing " + unit.unitNumber + "to delinquent...",
        success: <b>{unit.unitNumber} successfully changed to delinquent!</b>,
        error: <b>{unit.unitNumber} failed status change!</b>,
      });
      await addEvent(
        "Update Unit To Delinquent",
        `${user.email} set ${unit.unitNumber} as delinquent at ${currentFacilityName}, facility id ${currentFacility.id}`,
        true
      );
    } catch (error) {
      await addEvent(
        "Update Unit To Delinquent",
        `${user.email} set ${unit.unitNumber} as delinquent at ${currentFacilityName}, facility id ${currentFacility.id}`,
        false
      );
    }
  };
  const deleteUnit = async (unit) => {
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
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units/${unit.id}/delete/vacant?suppressCommands=true`,
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
          setFilteredUnits((prevUnits) =>
            prevUnits.filter((u) => u.id !== unit.id)
          );
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };
    try {
      toast.promise(handleDelete(), {
        loading: "Deleting Unit " + unit.unitNumber + "...",
        success: <b>{unit.unitNumber} successfully deleted!</b>,
        error: <b>{unit.unitNumber} failed deletion!</b>,
      });
      await addEvent(
        "Delete Unit",
        `${user.email} deleted ${unit.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
        true
      );
    } catch (error) {
      await addEvent(
        "Delete Unit",
        `${user.email} deleted ${unit.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
        false
      );
    }
  };
  const editTenants = async (unit) => {
    if (unit.status === "Vacant") return;
    setSelectedUnit(unit);
    const handleVisitorFetch = async () => {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (currentFacility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = currentFacility.environment;
      }
      const config = {
        method: "get",
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/units/${unit.id}/visitors`,
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
          return response.data;
        })
        .catch(function (error) {
          throw error;
        });
    };

    const visitors = await handleVisitorFetch();
    setVisitors(visitors);
    setIsEditVisitorModalOpen(true);
  };
  const handleVisitorAutofill = (isFill) => {
    setVisitorAutofill(!isFill);
    localStorage.setItem("visitorAutofill", !isFill);
  };

  // Run handleUnits once when the component loads
  useEffect(() => {
    const fetchData = async () => {
      // Return if no token is found
      if (!currentFacility.token) return;
      // Return if units have already been pulled
      if (unitsPulled) return;
      await Promise.all([
        handleUnits(),
        handleAccessProfiles(),
        handleTimeProfiles(),
        handleSmartLocks(),
      ]);
      setUnitsPulled(true);
    };

    fetchData();
  }, [currentFacility, unitsPulled]);

  useEffect(() => {
    const filteredUnits = units.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.id.toString().includes(searchQuery) ||
        unit.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnits(filteredUnits);
  }, [units, searchQuery]);

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
      setFilteredUnits([...units]);
      return;
    }

    const sorted = [...filteredUnits].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUnits(sorted);
  };

  const columns = [
    {
      key: "id",
      label: "Unit ID",
      render: (u) =>
        u.status === "Rented" || u.status === "Delinquent" ? (
          <span
            className="text-blue-500 hover:underline cursor-pointer"
            title="Edit Tenant"
            onClick={() => editTenants(u)}
          >
            {u.id}
          </span>
        ) : (
          u.id
        ),
    },
    {
      key: "unitNumber",
      label: "Unit Number",
      accessor: (u) => u.unitNumber,
    },
    {
      key: "status",
      label: "Status",
      accessor: (u) => u.status,
    },
    {
      key: "smartLock",
      label: "SmartLock",
      accessor: (u) => {
        const lock = smartLocks.find((l) => l.unitId === u.id);
        return lock?.name?.toLowerCase() || "";
      },
      render: (u) => {
        const lock = smartLocks.find((lock) => lock.unitId === u.id);
        return lock ? `${lock.deviceType} - ${lock.name}` : "";
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (unit) => {
        if (unit.status === "Rented") {
          return (
            <div className="space-x-1">
              {permissions.pmsPlatformVisitorEdit && (
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
                  onClick={() => turnDelinquent(unit)}
                >
                  Turn Delinquent
                </button>
              )}
              {permissions.pmsPlatformVisitorDelete && (
                <button
                  className="bg-red-500 hover:bg-red-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
                  onClick={() => moveOut(unit)}
                >
                  Move Out
                </button>
              )}
            </div>
          );
        }
        if (unit.status === "Vacant") {
          return (
            <div className="space-x-1">
              {permissions.pmsPlatformVisitorCreate && (
                <button
                  className="bg-green-500 hover:bg-green-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
                  onClick={() => {
                    moveIn(unit);
                    setSelectedUnit(unit);
                  }}
                >
                  Move In
                </button>
              )}
              {permissions.pmsPlatformUnitDelete && (
                <button
                  className="bg-red-500 hover:bg-red-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
                  onClick={() => deleteUnit(unit)}
                >
                  Delete
                </button>
              )}
            </div>
          );
        }
        if (unit.status === "Delinquent") {
          return (
            <div className="space-x-1">
              {permissions.pmsPlatformVisitorEdit && (
                <button
                  className="bg-green-500 hover:bg-green-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
                  onClick={() => turnRented(unit)}
                >
                  Turn Rented
                </button>
              )}
              {permissions.pmsPlatformVisitorDelete && (
                <button
                  className="bg-red-500 hover:bg-red-600 cursor-pointer text-white px-2 py-1 rounded font-bold"
                  onClick={() => moveOut(unit)}
                >
                  Move Out
                </button>
              )}
            </div>
          );
        }

        return <span>Error</span>;
      },
      sortable: false,
    },
  ];

  return (
    <div
      className={`relative ${
        !unitsPulled ? "overflow-hidden min-h-full" : "overflow-auto"
      } h-full dark:text-white dark:bg-darkPrimary relative`}
    >
      {/* Create Unit Modal Popup */}
      {isUnitModalOpen && (
        <CreateUnit
          setIsUnitModalOpen={setIsUnitModalOpen}
          setUnits={setUnits}
        />
      )}
      {/* Create Visitor Modal Popup */}
      {isCreateVisitorModalOpen && (
        <CreateVisitor
          setIsCreateVisitorModalOpen={setIsCreateVisitorModalOpen}
          setUnits={setUnits}
          unit={selectedUnit}
        />
      )}
      {/* Multi Visitor Edit Modal */}
      {isEditVisitorModalOpen && (
        <EditVisitor
          setIsEditVisitorModalOpen={setIsEditVisitorModalOpen}
          currentFacility={currentFacility}
          visitors={visitors}
          unit={selectedUnit}
        />
      )}
      {/* Loading Spinner */}
      {!unitsPulled && <LoadingSpinner loadingText={currentLoadingText} />}
      {/* Page Header */}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <RiDoorLockFill className="text-lg" />
          &ensp; Units | {currentFacilityName}
        </div>
      </div>
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        {/* Totals Header */}
        <div className="mt-5 min-h-12 flex justify-center gap-32">
          <div className="text-center">
            <div className="font-bold text-2xl">{rentedCount}</div>
            Rented
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{delinquentCount}</div>
            Delinquent
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{vacantCount}</div>
            Vacant
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">
              {rentedCount + vacantCount + delinquentCount}
            </div>
            Total
          </div>
        </div>
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value) & setCurrentPage(1)}
            className="border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
          />
          {/* Visitor Autofill Toggle */}
          {permissions.pmsPlatformVisitorCreate && (
            <>
              <h3 className="mr-2 w-36">Visitor Autofill</h3>
              <div
                className={`w-8 h-4 flex items-center rounded-full p-1 cursor-pointer ${
                  visitorAutofill ? "bg-blue-600" : "bg-gray-300"
                }`}
                onClick={() => handleVisitorAutofill(visitorAutofill)}
              >
                <div
                  className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-500 ease-out ${
                    visitorAutofill ? "translate-x-2" : ""
                  }`}
                ></div>
              </div>
            </>
          )}
          {/* Create Unit Button */}
          {permissions.pmsPlatformUnitCreate && (
            <button
              className={`bg-green-500 text-white p-1 py-2 rounded font-bold ml-3 w-44 transition duration-300 ease-in-out transform select-none ${
                permissions.pmsPlatformUnitCreate
                  ? "hover:bg-green-600 hover:scale-105 hover:cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => setIsUnitModalOpen(true)}
              disabled={!permissions.pmsPlatformUnitCreate}
            >
              Create Unit(s)
            </button>
          )}
        </div>
        {/* Unit Table */}
        <DataTable
          columns={columns}
          data={filteredUnits}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          sortedColumn={sortedColumn}
          sortDirection={sortDirection}
          onSort={handleColumnSort}
        />
        {/* Pagination Footer */}
        <div className="px-2 py-5 mx-1">
          <PaginationFooter
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            items={filteredUnits}
          />
        </div>
      </div>
    </div>
  );
}
