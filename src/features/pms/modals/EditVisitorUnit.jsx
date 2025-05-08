import EditVisitorVisitor from "./EditVisitorVisitor";
import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import { addEvent } from "@hooks/events";
import { useAuth } from "@context/AuthProvider";
import { MdEdit } from "react-icons/md";
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateVisitorUnit from "./CreateVisitorUnit";

export default function EditVisitor({
  setIsEditVisitorModalOpen,
  visitors,
  unit,
}) {
  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filteredVisitors, setFilteredVisitors] = useState(visitors || []);
  const [visitorAutofill, setVisitorAutofill] = useState(true);
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false);
  const [isEditVisitorModalOpen2, setIsEditVisitorModalOpen2] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState({});
  const { currentFacility, user, permissions } = useAuth();
  const [sortedColumn, setSortedColumn] = useState(null);
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
        .then(async function (response) {
          const visitor = response.data.visitor;
          setFilteredVisitors((prev) => [...prev, visitor]);
          await addEvent(
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
      toast.promise(handleRent, {
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

  const columns = [
    {
      key: "id",
      label: "Visitor Id",
      accessor: (v) => v.id,
    },
    {
      key: "unitNumber",
      label: "Unit Number",
      accessor: (v) => v.unitNumber,
    },
    {
      key: "name",
      label: "Visitor Name",
      accessor: (v) => v.name,
    },
    {
      key: "isTenant",
      label: "Is Tenant",
      accessor: (v) => (v.isTenant ? "True" : "False"),
    },
    {
      key: "timeGroupName",
      label: "Time Group",
      accessor: (v) => v.timeGroupName,
    },
    {
      key: "accessProfileName",
      label: "Access Profile",
      accessor: (v) => v.accessProfileName,
    },
    {
      key: "code",
      label: "Gate Code",
      accessor: (v) => v.code,
    },
    {
      key: "email",
      label: "Email Address",
      accessor: (v) => v.email,
    },
    {
      key: "mobilePhoneNumber",
      label: "Phone Number",
      accessor: (v) => v.mobilePhoneNumber,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      accessor: () => null,
      render: (v) => (
        <div className="text-center space-x-1">
          <button
            className={`bg-green-500 text-white px-2 py-1 rounded font-bold ${
              permissions.pmsPlatformVisitorEdit
                ? "hover:bg-green-600 hover:cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
            onClick={() => {
              if (permissions.pmsPlatformVisitorEdit) {
                setIsEditVisitorModalOpen2(true);
                setSelectedVisitor(v);
              }
            }}
            disabled={!permissions.pmsPlatformVisitorEdit}
          >
            Edit
          </button>
          {!v.isTenant && (
            <button
              className={`bg-red-500 text-white px-2 py-1 rounded font-bold ${
                permissions.pmsPlatformVisitorDelete
                  ? "hover:bg-red-600 hover:cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => {
                if (permissions.pmsPlatformVisitorDelete) {
                  toast.promise(removeVisitor(v.id), {
                    loading: "Removing visitor...",
                    success: "Visitor removed successfully!",
                    error: "Failed to remove visitor. Please try again.",
                  });
                }
              }}
              disabled={!permissions.pmsPlatformVisitorDelete}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
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
        <CreateVisitorUnit
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
            className="hover:cursor-pointer right-0 text-gray-600 bg-gray-100 hover:bg-gray-300 dark:text-white dark:hover:bg-red-500 h-full px-5 rounded-tr dark:bg-gray-800"
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
                    ? "hover:bg-green-600 hover:scale-105 hover:cursor-pointer"
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
            <DataTable
              columns={columns}
              data={filteredVisitors}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              sortDirection={sortDirection}
              sortedColumn={sortedColumn}
              onSort={(columnKey, accessor) => {
                const newDirection =
                  sortedColumn !== columnKey
                    ? "asc"
                    : sortDirection === "asc"
                    ? "desc"
                    : null;

                setSortedColumn(newDirection ? columnKey : null);
                setSortDirection(newDirection);

                if (!newDirection) {
                  setFilteredVisitors([...filteredVisitors]);
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
              }}
            />
          </div>
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
    </div>
  );
}
