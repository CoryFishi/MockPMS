import axios from "axios";
import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { MdEdit } from "react-icons/md";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import EditVisitorVisitor from "./EditVisitorVisitor";
import CreateVisitorUnitModal from "./CreateVisitorUnitModal";
import { useAuth } from "../../context/AuthProvider";

export default function EditVisitor({
  setIsEditVisitorModalOpen,
  visitors,
  unit,
  addEvent,
}) {
  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filteredVisitors, setFilteredVisitors] = useState(visitors || []);
  const pageCount = Math.ceil(filteredVisitors.length / rowsPerPage);
  const [visitorAutofill, setVisitorAutofill] = useState(true);
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false);
  const [isEditVisitorModalOpen2, setIsEditVisitorModalOpen2] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState({});
  const { currentFacility, user, permissions } = useAuth();

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
  const createTenant = () => {
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
        isTenant: false,
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
          const visitor = response.data.visitor;
          setFilteredVisitors((prev) => [...prev, visitor]);
          addEvent(
            "Add Visitor",
            `${user.email} added visitor ${visitor.id} to unit ${unit.unitNumber} at facility ${currentFacility.name}, ${currentFacility.id}`,
            true
          );
          return response;
        })
        .catch(function (error) {
          throw error;
        });
    };

    if (visitorAutofill) {
      toast.promise(handleRent(), {
        loading: "Adding guest to " + unit.unitNumber + "...",
        success: <b>Added guest to {unit.unitNumber}!</b>,
        error: <b>Failed adding guest to{unit.unitNumber}!</b>,
      });
    } else {
      setIsCreateVisitorModalOpen(true);
    }
  };
  const removeVisitor = async (visitorId) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const config = {
      method: "post",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/visitors/${visitorId}/remove`,

      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json-patch+json",
      },
    };

    return axios(config)
      .then(async function (response) {
        setFilteredVisitors((prev) => prev.filter((v) => v.id !== visitorId));
        await addEvent(
          "Remove Guest",
          `${user.email} removed visitor ${visitorId} from unit ${unit.unitNumber} at facility ${currentFacility.name}, ${currentFacility.id}`,
          true
        );
        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };

  useEffect(() => {
    handleTimeProfiles();
    handleAccessProfiles();
  }, []);

  useEffect(() => {
    const filteredVisitors = visitors.filter(
      (visitor) =>
        visitor.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.code.toString().includes(searchQuery.toLowerCase()) ||
        visitor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.mobilePhoneNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        visitor.accessProfileName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        visitor.timeGroupName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        visitor.id.toString().includes(searchQuery)
    );
    setFilteredVisitors(filteredVisitors);
  }, [visitors, searchQuery]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Edit Visitor Modal Popup */}
      {isEditVisitorModalOpen2 && (
        <EditVisitorVisitor
          setIsEditVisitorModalOpen={setIsEditVisitorModalOpen2}
          currentFacility={currentFacility}
          setVisitors={setFilteredVisitors}
          visitor={selectedVisitor}
          addEvent={addEvent}
        />
      )}
      {/* Create Visitor Modal Popup */}
      {isCreateVisitorModalOpen && (
        <CreateVisitorUnitModal
          setIsCreateVisitorModalOpen={setIsCreateVisitorModalOpen}
          currentFacility={currentFacility}
          setVisitors={setFilteredVisitors}
          unit={unit}
          addEvent={addEvent}
        />
      )}
      <div className="bg-white rounded-sm shadow-lg w-[95vw] h-[95vh] dark:bg-darkPrimary">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <MdEdit />
            <h2 className="ml-2 text-lg font-bold text-center items-center">
              Editing Visitors
            </h2>
          </div>

          <button
            className="right-0 text-gray-600 bg-gray-100 hover:bg-gray-300 dark:text-white dark:hover:bg-red-500 h-full px-5 rounded-tr dark:bg-gray-800"
            onClick={() => setIsEditVisitorModalOpen(false)}
          >
            x
          </button>
        </div>
        <div className="p-2 w-full h-full">
          <div className="justify-between flex mb-2">
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
            />
            <div className="flex items-center justify-end text-center">
              <div className="flex">
                <h3 className="w-28">Guest Autofill</h3>
                <div
                  className={`w-7 h-4 flex items-center rounded-full p-1 mt-1 cursor-pointer ${
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
              </div>
              <button
                className={`bg-green-500 text-white p-1 py-2 rounded font-bold ml-3 w-44 transition duration-300 ease-in-out transform select-none ${
                  permissions.pmsPlatformVisitorCreate
                    ? "hover:bg-green-600 hover:scale-105"
                    : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => createTenant()}
                disabled={!permissions.pmsPlatformVisitorCreate}
              >
                Add Guest
              </button>
            </div>
          </div>
          <div className="overflow-y-auto h-[77vh]">
            <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
              <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary">
                <tr className="bg-gray-200 dark:bg-darkNavSecondary">
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Visitor Id
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Unit Number
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Visitor Name
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    isTenant
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Time Group
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Access Profile
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Gate Code
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Email Address
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Phone Number
                  </th>
                  <th className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors
                  .slice(
                    (currentPage - 1) * rowsPerPage,
                    currentPage * rowsPerPage
                  )
                  .map((visitor, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
                    >
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                        {visitor.id}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                        {visitor.unitNumber}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                        {visitor.name}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                        {visitor.isTenant ? "True" : "False"}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden md:table-cell">
                        {visitor.timeGroupName}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden md:table-cell">
                        {visitor.accessProfileName}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell">
                        {visitor.code}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell">
                        {visitor.email}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell">
                        {visitor.mobilePhoneNumber}
                      </td>
                      <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden lg:table-cell gap-2">
                        <button
                          className={`bg-green-500 text-white px-2 py-1 rounded font-bold ${
                            permissions.pmsPlatformVisitorEdit
                              ? "hover:bg-green-600"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                          onClick={() => {
                            if (permissions.pmsPlatformVisitorEdit) {
                              setIsEditVisitorModalOpen2(true);
                              setSelectedVisitor(visitor);
                            }
                          }}
                          disabled={!permissions.pmsPlatformVisitorEdit}
                        >
                          Edit
                        </button>
                        {!visitor.isTenant && (
                          <button
                            className={`bg-red-500 text-white px-2 py-1 rounded font-bold ${
                              permissions.pmsPlatformVisitorDelete
                                ? "hover:bg-red-600"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                            onClick={() => {
                              if (permissions.pmsPlatformVisitorDelete) {
                                toast.promise(removeVisitor(visitor.id), {
                                  loading: "Removing visitor...",
                                  success: "Visitor removed successfully!",
                                  error:
                                    "Failed to remove visitor. Please try again.",
                                });
                              }
                            }}
                            disabled={!permissions.pmsPlatformVisitorDelete}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Modal footer/pagination */}
          <div className="flex justify-between items-center px-2 py-5 mx-1">
            <div className="flex gap-3">
              <div>
                <select
                  className="border rounded-sm ml-2 dark:bg-darkSecondary dark:border-border"
                  id="rowsPerPage"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page on rows per page change
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <p className="text-sm">
                {currentPage === 1 ? 1 : (currentPage - 1) * rowsPerPage + 1} -{" "}
                {currentPage * rowsPerPage > filteredVisitors.length
                  ? filteredVisitors.length
                  : currentPage * rowsPerPage}{" "}
                of {filteredVisitors.length}
              </p>
            </div>
            <div className="gap-2 flex">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronsLeft />
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronLeft />
              </button>
              <p>
                {currentPage} of {pageCount}
              </p>
              <button
                disabled={currentPage === pageCount}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronRight />
              </button>
              <button
                disabled={currentPage === pageCount}
                onClick={() => setCurrentPage(pageCount)}
                className="disabled:cursor-not-allowed p-1 disabled:text-slate-500"
              >
                <BiChevronsRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
