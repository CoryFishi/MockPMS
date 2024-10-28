import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import CreateVisitorVisitor from "./modals/CreateVisitorVisitor";
import EditVisitor from "./modals/EditVisitor";
import { FaPerson } from "react-icons/fa6";

export default function VisitorPage({ currentFacility, currentFacilityName }) {
  const [visitors, setVisitors] = useState([]);
  const [tenants, setTenants] = useState("");
  const [nonTenants, setNonTenants] = useState("");
  const [guests, setGuests] = useState("");
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState("");
  const [isEditVisitorModalOpen, setIsEditVisitorModalOpen] = useState("");
  const [filteredVisitors, setFilteredVisitors] = useState(visitors);
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");

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
        Authorization: "Bearer " + currentFacility?.bearer?.access_token,
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

        const tenantCount = sortedVisitors.filter(
          (visitor) => visitor.isTenant === true
        ).length;
        const nonTenantCount = sortedVisitors.filter(
          (visitor) => visitor.isPortalVisitor === true
        ).length;
        const guestCount = sortedVisitors.filter(
          (visitor) =>
            visitor.isTenant === false && visitor.isPortalVisitor === false
        ).length;

        setTenants(tenantCount);
        setNonTenants(nonTenantCount);
        setGuests(guestCount);
        setVisitors(sortedVisitors);

        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };

  const moveOutVisitor = (visitor) => {
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
          Authorization: "Bearer " + currentFacility?.bearer?.access_token,
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
        .catch(function (error) {
          throw error;
        });
    };
    toast.promise(handleDelete(), {
      loading: "Moving out Tenant " + visitor.name + "...",
      success: <b>{visitor.unitNumber} successfully moved out!</b>,
      error: <b>{visitor.unitNumber} failed move out!</b>,
    });
  };

  const deleteVisitor = (visitor) => {
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
        url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors/${visitor.id}/remove?suppressCommands=false`,

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
          setVisitors((prevUnits) =>
            prevUnits.filter((u) => u.id !== visitor.id)
          );
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };
    toast.promise(handleDelete(), {
      loading: "Deleting Unit " + visitor.unitNumber + "...",
      success: <b>{visitor.unitNumber} successfully deleted!</b>,
      error: <b>{visitor.unitNumber} failed deletion!</b>,
    });
  };

  // Run handleUnits once when the component loads
  useEffect(() => {
    toast.promise(handleVisitors(), {
      loading: "Loading visitors...",
      success: <b>Visitors loaded successfully!</b>,
      error: <b>Could not load visitors.</b>,
    });
  }, []);

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
  }, [visitors]);

  return (
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; Visitors | {currentFacilityName}
        </div>
      </div>
      <p className="text-sm dark:text-white text-left">{Date()}</p>

      <div className="w-full h-full p-5 flex flex-col rounded-lg">
        <div className="min-h-12 flex justify-center gap-32">
          <div className="text-center">
            <div className="font-bold text-2xl">{tenants || 0}</div>
            Tenants
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{guests || 0}</div>
            Guests
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{nonTenants || 0}</div>
            Non-Tenants
          </div>
          <div className="text-center">
            <div className="font-bold text-2xl">{visitors.length || 0}</div>
            Total
          </div>
        </div>
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search visitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
          />
          <button
            className="bg-green-500 text-white p-1 py-2 rounded hover:bg-green-600 hover:scale-105 ml-3 w-44 font-bold transition duration-300 ease-in-out transform"
            onClick={() => setIsCreateVisitorModalOpen(true)}
          >
            Create Visitor
          </button>
        </div>

        {/* Create Visitor Modal Popup */}
        {isCreateVisitorModalOpen && (
          <CreateVisitorVisitor
            setIsCreateVisitorModalOpen={setIsCreateVisitorModalOpen}
            currentFacility={currentFacility}
            setVisitors={setVisitors}
          />
        )}

        {/* Edit Visitor Modal Popup */}
        {isEditVisitorModalOpen && (
          <EditVisitor
            setIsEditVisitorModalOpen={setIsEditVisitorModalOpen}
            currentFacility={currentFacility}
            setVisitors={setVisitors}
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

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      if (a.id < b.id) return newDirection === "asc" ? -1 : 1;
                      if (a.id > b.id) return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Visitor Id
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      const unitA = (a.unitNumber || "").toLowerCase();
                      const unitB = (b.unitNumber || "").toLowerCase();

                      if (unitA < unitB) return newDirection === "asc" ? -1 : 1;
                      if (unitA > unitB) return newDirection === "asc" ? 1 : -1;
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

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      if (a.name.toLowerCase() < b.name.toLowerCase())
                        return newDirection === "asc" ? -1 : 1;
                      if (a.name.toLowerCase() > b.name.toLowerCase())
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Name
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      if (a.isTenant < b.isTenant)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.isTenant > b.isTenant)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Visitor Type
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hidden sm:table-cell hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      if (a.accessProfileName < b.accessProfileName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.accessProfileName > b.accessProfileName)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Access Profile
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hidden sm:table-cell hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      if (a.timeGroupName < b.timeGroupName)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.timeGroupName > b.timeGroupName)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Time Profile
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hidden lg:table-cell hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      if (a.code < b.code)
                        return newDirection === "asc" ? -1 : 1;
                      if (a.code > b.code)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Gate Code
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hidden lg:table-cell hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      const phoneA = (a.mobilePhoneNumber || "").toLowerCase();
                      const phoneB = (b.mobilePhoneNumber || "").toLowerCase();

                      if (phoneA < phoneB)
                        return newDirection === "asc" ? -1 : 1;
                      if (phoneA > phoneB)
                        return newDirection === "asc" ? 1 : -1;

                      return 0;
                    })
                  );
                }}
              >
                Phone Number
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hidden xl:table-cell hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);

                  setFilteredVisitors(
                    [...filteredVisitors].sort((a, b) => {
                      const emailA = (a.email || "").toLowerCase();
                      const emailB = (b.email || "").toLowerCase();

                      if (emailA < emailB)
                        return newDirection === "asc" ? -1 : 1;
                      if (emailA > emailB)
                        return newDirection === "asc" ? 1 : -1;

                      return 0;
                    })
                  );
                }}
              >
                Email Address
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitors.map((visitor, index) => (
              <tr
                key={index}
                className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
              >
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden md:table-cell">
                  {visitor.id}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {visitor.unitNumber}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {visitor.name}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {visitor.isTenant
                    ? "Tenant"
                    : visitor.isPortalVisitor
                    ? "Non-Tenant"
                    : !visitor.unitNumber
                    ? "Non-Tenant Guest"
                    : "Guest"}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                  {visitor.accessProfileName}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                  {visitor.timeGroupName}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell">
                  {visitor.code}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell">
                  {visitor.mobilePhoneNumber}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden xl:table-cell">
                  {visitor.email}
                </td>
                <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                  {visitor.isTenant === true ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 font-bold"
                        onClick={() =>
                          setIsEditVisitorModalOpen(true) &
                          setSelectedVisitor(visitor)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600 font-bold"
                        onClick={() => moveOutVisitor(visitor)}
                      >
                        Move Out
                      </button>
                    </>
                  ) : visitor.isPortalVisitor === true ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 font-bold"
                        onClick={() =>
                          setIsEditVisitorModalOpen(true) &
                          setSelectedVisitor(visitor)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600 font-bold"
                        onClick={() => deleteVisitor(visitor)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 font-bold"
                        onClick={() =>
                          setIsEditVisitorModalOpen(true) &
                          setSelectedVisitor(visitor)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600 font-bold"
                        onClick={() => deleteVisitor(visitor)}
                      >
                        Remove
                      </button>
                    </>
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
