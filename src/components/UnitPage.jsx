import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import CreateUnit from "./modals/CreateUnit";
import CreateVisitor from "./modals/CreateVisitorUnit";
import { RiDoorLockFill } from "react-icons/ri";
import EditVisitor from "./modals/EditVisitor";

export default function UnitPage({
  currentFacility,
  currentFacilityName = { currentFacilityName },
}) {
  const [units, setUnits] = useState([]);
  const [rented, setRented] = useState("");
  const [vacant, setVacant] = useState("");
  const [delinquent, setDelinquent] = useState("");
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false);
  const [visitorAutofill, setVisitorAutofill] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const [isEditVisitorModalOpen, setIsEditVisitorModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState({});
  const [filteredUnits, setFilteredUnits] = useState(units);
  const [sortDirection, setSortDirection] = useState("asc");

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
        Authorization: "Bearer " + currentFacility?.bearer?.access_token,
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
        Authorization: "Bearer " + currentFacility?.bearer?.access_token,
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
        Authorization: "Bearer " + currentFacility?.bearer?.access_token,
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

        const rentedCount = sortedUnits.filter(
          (unit) => unit.status === "Rented"
        ).length;
        const delinquentCount = sortedUnits.filter(
          (unit) => unit.status === "Delinquent"
        ).length;
        const vacantCount = sortedUnits.filter(
          (unit) => unit.status === "Vacant"
        ).length;

        setRented(rentedCount);
        setVacant(vacantCount);
        setDelinquent(delinquentCount);
        setUnits(sortedUnits);

        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };

  const moveIn = (unit) => {
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
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: data,
      };

      return axios(config)
        .then(function (response) {
          setUnits((prevUnits) =>
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
      toast.promise(handleRent(), {
        loading: "Renting Unit " + unit.unitNumber + "...",
        success: <b>{unit.unitNumber} successfully rented!</b>,
        error: <b>{unit.unitNumber} failed rental!</b>,
      });
    } else {
      setIsCreateVisitorModalOpen(true);
    }
  };

  const turnRented = (unit) => {
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
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: "",
      };
      return axios(config)
        .then(function (response) {
          setUnits((prevUnits) =>
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
    toast.promise(handleRentalStatus(), {
      loading: "Changing " + unit.unitNumber + "to rented...",
      success: <b>{unit.unitNumber} successfully changed to rented!</b>,
      error: <b>{unit.unitNumber} failed status change!</b>,
    });
  };

  const moveOut = (unit) => {
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
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: "",
      };

      return axios(config)
        .then(function (response) {
          setUnits((prevUnits) =>
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
    toast.promise(handleMoveOut(), {
      loading: "Removing tenant from unit " + unit.unitNumber + "...",
      success: <b>{unit.unitNumber} successfully vacated!</b>,
      error: <b>{unit.unitNumber} failed rental!</b>,
    });
  };

  const turnDelinquent = (unit) => {
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
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: "",
      };
      return axios(config)
        .then(function (response) {
          setUnits((prevUnits) =>
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
    toast.promise(handleRentalStatus(), {
      loading: "Changing " + unit.unitNumber + "to delinquent...",
      success: <b>{unit.unitNumber} successfully changed to delinquent!</b>,
      error: <b>{unit.unitNumber} failed status change!</b>,
    });
  };

  const deleteUnit = (unit) => {
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
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: "",
      };

      return axios(config)
        .then(function (response) {
          setUnits((prevUnits) => prevUnits.filter((u) => u.id !== unit.id));
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };
    toast.promise(handleDelete(), {
      loading: "Deleting Unit " + unit.unitNumber + "...",
      success: <b>{unit.unitNumber} successfully deleted!</b>,
      error: <b>{unit.unitNumber} failed deletion!</b>,
    });
  };

  // Run handleUnits once when the component loads
  useEffect(() => {
    toast.promise(handleUnits(), {
      loading: "Loading units...",
      success: <b>Units loaded successfully!</b>,
      error: <b>Could not load units.</b>,
    });

    handleAccessProfiles();
    handleTimeProfiles();
  }, []);
  useEffect(() => {
    const filteredUnits = units.filter(
      (unit) =>
        unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.id.toString().includes(searchQuery) ||
        unit.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUnits(filteredUnits);
  }, [units]);

  const [searchQuery, setSearchQuery] = useState("");

  const editTenant = async (unit) => {
    if (unit.status === "Vacant") return;
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
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
          accept: "application/json",
          "api-version": "2.0",
          "Content-Type": "application/json-patch+json",
        },
        data: "",
      };
      return axios(config)
        .then(function (response) {
          return response.data[0];
        })
        .catch(function (error) {
          throw error;
        });
    };

    const visitor = await handleVisitorFetch();
    console.log(visitor);
    setSelectedVisitor(visitor);
    setIsEditVisitorModalOpen(true);
  };

  return (
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <RiDoorLockFill className="text-lg" />
          &ensp; Units | {currentFacilityName}
        </div>
      </div>
      <p className="text-sm dark:text-white text-left">{Date()}</p>

      <div className="w-full h-full p-5 flex flex-col rounded-lg">
        <div className="min-h-12 flex justify-center gap-32">
          <div className="text-center">
            <div className="font-bold text-2xl">{rented || 0}</div>
            Rented
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{delinquent || 0}</div>
            Delinquent
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{vacant || 0}</div>
            Vacant
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{units.length || 0}</div>
            Total
          </div>
        </div>
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
          />
          <h3 className="mr-2 w-36">Visitor Autofill</h3>
          <div
            className={`w-8 h-4 flex items-center rounded-full p-1 cursor-pointer ${
              visitorAutofill ? "bg-blue-600" : "bg-gray-300"
            }`}
            onClick={() => setVisitorAutofill(!visitorAutofill)}
          >
            <div
              className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-500 ease-out ${
                visitorAutofill ? "translate-x-2" : ""
              }`}
            ></div>
          </div>
          <button
            className="bg-green-500 text-white p-1 py-2 rounded hover:bg-green-600 hover:scale-105 ml-3 w-44 font-bold transition duration-300 ease-in-out transform select-none"
            onClick={() => setIsUnitModalOpen(true)}
          >
            Create Unit(s)
          </button>
        </div>

        {/* Create Unit Modal Popup */}
        {isUnitModalOpen && (
          <CreateUnit
            setIsUnitModalOpen={setIsUnitModalOpen}
            currentFacility={currentFacility}
            setUnits={setUnits}
          />
        )}

        {/* Create Visitor Modal Popup */}
        {isCreateVisitorModalOpen && (
          <CreateVisitor
            setIsCreateVisitorModalOpen={setIsCreateVisitorModalOpen}
            currentFacility={currentFacility}
            setUnits={setUnits}
            unit={selectedUnit}
          />
        )}

        {isEditVisitorModalOpen && (
          <EditVisitor
            setIsEditVisitorModalOpen={setIsEditVisitorModalOpen}
            currentFacility={currentFacility}
            visitor={selectedVisitor}
          />
        )}

        <table className="w-full table-auto border-collapse border-gray-300 pb-96 dark:border-border">
          <thead>
            <tr className="bg-gray-200 dark:bg-darkNavSecondary">
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hidden sm:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hidden md:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hidden md:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hidden lg:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hidden lg:table-cell hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
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
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((unit, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
              >
                <td
                  className="border-y border-gray-300 dark:border-border px-4 py-2"
                  onClick={() => editTenant(unit)}
                >
                  {unit.status === "Rented" || unit.status === "Delinquent" ? (
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
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {unit.unitNumber}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {unit.status}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                  {unit.facilityId}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden md:table-cell">
                  {unit.propertyNumber}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden md:table-cell">
                  {unit.additionalProp1}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell">
                  {unit.additionalProp2}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell">
                  {unit.additionalProp3}
                </td>

                <td className="border-y border-gray-300 dark:border-border px-4 py-2 select-none">
                  {unit.status === "Rented" ? (
                    <>
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 font-bold"
                        onClick={() => turnDelinquent(unit)}
                      >
                        Turn Delinquent
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600 font-bold"
                        onClick={() => moveOut(unit)}
                      >
                        Move Out
                      </button>
                    </>
                  ) : unit.status === "Vacant" ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 font-bold"
                        onClick={() => moveIn(unit) & setSelectedUnit(unit)}
                      >
                        Move In
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600 font-bold"
                        onClick={() => deleteUnit(unit)}
                      >
                        Delete
                      </button>
                    </>
                  ) : unit.status === "Delinquent" ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 font-bold"
                        onClick={() => turnRented(unit)}
                      >
                        Turn Rented
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600 font-bold"
                        onClick={() => moveOut(unit)}
                      >
                        Move Out
                      </button>
                    </>
                  ) : (
                    <>error</>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
