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
        setUnitsPulled(true);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
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
          `${user.email} rented ${unit.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
          true
        );
      } catch (error) {
        await addEvent(
          "Add Tenant",
          `${user.email} rented ${unit.unitNumber} at ${currentFacilityName}, facility id ${currentFacility.id}`,
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
    //Return if no token is found
    if (!currentFacility.token) return;
    // Return if units have already been pulled
    if (unitsPulled) return;
    handleUnits();
    handleAccessProfiles();
    handleTimeProfiles();
  }, [currentFacility]);

  useEffect(() => {
    const filteredUnits = units.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.id.toString().includes(searchQuery) ||
        unit.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnits(filteredUnits);
  }, [units, searchQuery]);

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary mb-14">
      {/* Page Header */}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <RiDoorLockFill className="text-lg" />
          &ensp; Units | {currentFacilityName}
        </div>
      </div>
      {/* Load Time Label */}
      <p className="text-sm dark:text-white text-left">{Date()}</p>
      <div className="w-full px-5 flex flex-col rounded-lg h-full">
        {/* Totals Header */}
        <div className="min-h-12 flex justify-center gap-32">
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
          />
          {/* Visitor Autofill Toggle */}
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
          {/* Create Unit Button */}
          <button
            className={`bg-green-500 text-white p-1 py-2 rounded font-bold ml-3 w-44 transition duration-300 ease-in-out transform select-none ${
              permissions.pmsPlatformUnitCreate
                ? "hover:bg-green-600 hover:scale-105"
                : "opacity-50 cursor-not-allowed"
            }`}
            onClick={() => setIsUnitModalOpen(true)}
            disabled={!permissions.pmsPlatformUnitCreate}
          >
            Create Unit(s)
          </button>
        </div>

        {/* Create Unit Modal Popup */}
        {isUnitModalOpen && (
          <CreateUnit
            setIsUnitModalOpen={setIsUnitModalOpen}
            setUnits={setUnits}
            addEvent={addEvent}
          />
        )}

        {/* Create Visitor Modal Popup */}
        {isCreateVisitorModalOpen && (
          <CreateVisitor
            setIsCreateVisitorModalOpen={setIsCreateVisitorModalOpen}
            setUnits={setUnits}
            unit={selectedUnit}
            addEvent={addEvent}
          />
        )}

        {/* Multi Visitor Edit Modal */}
        {isEditVisitorModalOpen && (
          <EditVisitor
            setIsEditVisitorModalOpen={setIsEditVisitorModalOpen}
            currentFacility={currentFacility}
            visitors={visitors}
            unit={selectedUnit}
            addEvent={addEvent}
          />
        )}

        {/* Unit Table */}
        <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
          {/* Header */}
          <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary">
            <tr className="border border-gray-300 dark:border-border bg-gray-200 dark:bg-darkNavSecondary">
              <th
                className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Unit Id");

                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      if (a.id < b.id) return newDirection === "asc" ? -1 : 1;
                      if (a.id > b.id) return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Unit Id
                {sortedColumn === "Unit Id" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Unit Number");
                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      if (
                        a.unitNumber.toLowerCase() < b.unitNumber.toLowerCase()
                      )
                        return newDirection === "asc" ? -1 : 1;
                      if (
                        a.unitNumber.toLowerCase() > b.unitNumber.toLowerCase()
                      )
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Unit Number
                {sortedColumn === "Unit Number" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Status");

                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      if (a.status < b.status)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.status > b.status)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Status
                {sortedColumn === "Status" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-2 hover:cursor-pointer hidden sm:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Facility ID");
                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      if (a.facilityId < b.facilityId)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.facilityId > b.facilityId)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Facility ID
                {sortedColumn === "Facility ID" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-2 hover:cursor-pointer hidden md:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Property Number");
                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      const propertyNumberA = (
                        a.propertyNumber || ""
                      ).toLowerCase();
                      const propertyNumberB = (
                        b.propertyNumber || ""
                      ).toLowerCase();
                      if (propertyNumberA < propertyNumberB)
                        return newDirection === "asc" ? -1 : 1;
                      if (propertyNumberA > propertyNumberB)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Property Number
                {sortedColumn === "Property Number" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-2 hover:cursor-pointer hidden md:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Additional Prop 1");
                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      const extendedDataA = (
                        a.extendedData?.additionalProp1 || ""
                      ).toLowerCase();
                      const extendedDataB = (
                        b.extendedData?.additionalProp1 || ""
                      ).toLowerCase();
                      if (extendedDataA < extendedDataB)
                        return newDirection === "asc" ? -1 : 1;
                      if (extendedDataA > extendedDataB)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Additional Prop 1
                {sortedColumn === "Additional Prop 1" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-2 hover:cursor-pointer hidden lg:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Additional Prop 2");
                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      const extendedDataA = (
                        a.extendedData?.additionalProp2 || ""
                      ).toLowerCase();
                      const extendedDataB = (
                        b.extendedData?.additionalProp2 || ""
                      ).toLowerCase();
                      if (extendedDataA < extendedDataB)
                        return newDirection === "asc" ? -1 : 1;
                      if (extendedDataA > extendedDataB)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Additional Prop 2
                {sortedColumn === "Additional Prop 2" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="px-4 py-2 hover:cursor-pointer hidden lg:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Additional Prop 3");
                  setFilteredUnits(
                    [...filteredUnits].sort((a, b) => {
                      const extendedDataA = (
                        a.extendedData?.additionalProp3 || ""
                      ).toLowerCase();
                      const extendedDataB = (
                        b.extendedData?.additionalProp3 || ""
                      ).toLowerCase();
                      if (extendedDataA < extendedDataB)
                        return newDirection === "asc" ? -1 : 1;
                      if (extendedDataA > extendedDataB)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Additional Prop 3
                {sortedColumn === "Additional Prop 3" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th className="px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Actions
              </th>
            </tr>
          </thead>
          {/* Body */}
          <tbody>
            {filteredUnits
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((unit, index) => (
                <tr
                  key={index}
                  className="border-y border-gray-300 dark:border-border hover:bg-gray-100 dark:hover:bg-darkNavSecondary text-center"
                >
                  <td className="px-4 py-2" onClick={() => editTenants(unit)}>
                    {unit.status === "Rented" ||
                    unit.status === "Delinquent" ? (
                      <p
                        className="text-blue-500  hover:cursor-pointer"
                        title="edit tenant"
                      >
                        {unit.id}
                      </p>
                    ) : (
                      unit.id
                    )}
                  </td>
                  <td className="px-4 py-2">{unit.unitNumber}</td>
                  <td className="px-4 py-2">{unit.status}</td>
                  <td className="px-4 py-2 hidden sm:table-cell">
                    {unit.facilityId}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell">
                    {unit.propertyNumber}
                  </td>
                  <td className="px-4 py-2 hidden md:table-cell">
                    {unit.additionalProp1}
                  </td>
                  <td className="px-4 py-2 hidden lg:table-cell">
                    {unit.additionalProp2}
                  </td>
                  <td className="px-4 py-2 hidden lg:table-cell">
                    {unit.additionalProp3}
                  </td>
                  <td className="px-4 py-2 select-none">
                    {unit.status === "Rented" ? (
                      <div className="text-center space-x-1">
                        <button
                          className={`bg-yellow-500 text-white px-2 py-1 rounded font-bold ${
                            permissions.pmsPlatformVisitorEdit
                              ? "hover:bg-yellow-600"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => turnDelinquent(unit)}
                          disabled={!permissions.pmsPlatformVisitorEdit}
                        >
                          Turn Delinquent
                        </button>
                        <button
                          className={`bg-red-500 text-white px-2 py-1 rounded font-bold ${
                            permissions.pmsPlatformVisitorDelete
                              ? "hover:bg-red-600"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => moveOut(unit)}
                          disabled={!permissions.pmsPlatformVisitorDelete}
                        >
                          Move Out
                        </button>
                      </div>
                    ) : unit.status === "Vacant" ? (
                      <div className="text-center space-x-1">
                        <button
                          className={`bg-green-500 text-white px-2 py-1 rounded font-bold ${
                            permissions.pmsPlatformVisitorCreate
                              ? "hover:bg-green-600"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => moveIn(unit) & setSelectedUnit(unit)}
                          disabled={!permissions.pmsPlatformVisitorCreate}
                        >
                          Move In
                        </button>
                        <button
                          className={`bg-red-500 text-white px-2 py-1 rounded font-bold ${
                            permissions.pmsPlatformUnitDelete
                              ? "hover:bg-red-600"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => deleteUnit(unit)}
                          disabled={!permissions.pmsPlatformUnitDelete}
                        >
                          Delete
                        </button>
                      </div>
                    ) : unit.status === "Delinquent" ? (
                      <div className="text-center space-x-1">
                        <button
                          className={`bg-green-500 text-white px-2 py-1 rounded font-bold ${
                            permissions.pmsPlatformVisitorEdit
                              ? "hover:bg-green-600"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => turnRented(unit)}
                          disabled={!permissions.pmsPlatformVisitorEdit}
                        >
                          Turn Rented
                        </button>
                        <button
                          className={`bg-red-500 text-white px-2 py-1 rounded font-bold ${
                            permissions.pmsPlatformVisitorDelete
                              ? "hover:bg-red-600"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => moveOut(unit)}
                          disabled={!permissions.pmsPlatformVisitorDelete}
                        >
                          Move Out
                        </button>
                      </div>
                    ) : (
                      <>error</>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

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
