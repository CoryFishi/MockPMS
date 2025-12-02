import EditVisitorVisitorPage from "@features/pms/modals/EditVisitorVisitorPage";
import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import { addEvent } from "@hooks/supabase";
import { useAuth } from "@context/AuthProvider";
import { MdEdit } from "react-icons/md";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateVisitorUnitPage from "@features/pms/modals/CreateVisitorUnitPage";
import ModalContainer from "@components/UI/ModalContainer";
import DeleteModal from "@features/pms/modals/DeleteModal";
import InputBox from "@components/UI/InputBox";
import GeneralButton from "@components/UI/GeneralButton";
import SliderButton from "@components/UI/SliderButton";

export default function EditVisitor({
  setIsEditVisitorModalOpen,
  visitors,
  unit,
}) {
  const [allVisitors, setAllVisitors] = useState(visitors || []);
  const [timeProfiles, setTimeProfiles] = useState({});
  const [accessProfiles, setAccessProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filteredVisitors, setFilteredVisitors] = useState(allVisitors || []);
  const [visitorAutofill, setVisitorAutofill] = useState(
    localStorage.getItem("visitorAutofill") === "true" || false
  );
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState(false);
  const [isEditVisitorModalOpen2, setIsEditVisitorModalOpen2] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState({});
  const { currentFacility, user, permissions } = useAuth();
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [continousDelete, setContinousDelete] = useState(false);

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
          setAllVisitors((prev) => [...prev, visitor]);
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
        setAllVisitors((prev) => prev.filter((v) => v.id !== visitorId));
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
    const filteredVisitors = allVisitors.filter(
      (visitor) =>
        visitor.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.code?.toString().includes(searchQuery.toLowerCase()) ||
        visitor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visitor.mobilePhoneNumber
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        visitor.accessProfileName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        visitor.timeGroupName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        visitor.id?.toString().includes(searchQuery)
    );
    setFilteredVisitors(filteredVisitors);
  }, [allVisitors, searchQuery]);

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
          {permissions.pmsPlatformVisitorEdit && (
            <button
              className={`bg-green-500 text-white px-2 py-1 rounded font-bold hover:bg-green-600 hover:cursor-pointer`}
              onClick={() => {
                setIsEditVisitorModalOpen2(true);
                setSelectedVisitor(v);
              }}
            >
              Edit
            </button>
          )}
          {!v.isTenant && permissions.pmsPlatformVisitorDelete && (
            <button
              className={`bg-red-500 text-white px-2 py-1 rounded font-bold hover:bg-red-600 hover:cursor-pointer`}
              onClick={() => {
                if (continousDelete) {
                  handleDelete(v);
                } else {
                  setIsDeleteModalOpen(true);
                  setSelectedVisitor(v);
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleDelete = (v) => {
    if (permissions.pmsPlatformVisitorDelete) {
      toast.promise(removeVisitor(v.id), {
        loading: "Removing visitor...",
        success: "Visitor removed successfully!",
        error: "Failed to remove visitor. Please try again.",
      });
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <ModalContainer
        title={"Editing Visitors"}
        icon={<MdEdit />}
        onClose={() => setIsEditVisitorModalOpen(false)}
        mainContent={
          <div className="justify-between flex mb-2 flex-col">
            {isDeleteModalOpen && (
              <DeleteModal
                continousDelete={continousDelete}
                setContinousDelete={setContinousDelete}
                type={"Visitor"}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                handleDelete={() => {
                  handleDelete(selectedVisitor);
                }}
                value={selectedVisitor}
              />
            )}
            {/* Edit Visitor Modal Popup */}
            {isEditVisitorModalOpen2 && (
              <EditVisitorVisitorPage
                setIsEditVisitorModalOpen={setIsEditVisitorModalOpen2}
                currentFacility={currentFacility}
                setVisitors={setFilteredVisitors}
                visitor={selectedVisitor}
              />
            )}
            {/* Create Visitor Modal Popup */}
            {isCreateVisitorModalOpen && (
              <CreateVisitorUnitPage
                setIsCreateVisitorModalOpen={setIsCreateVisitorModalOpen}
                currentFacility={currentFacility}
                setValues={setFilteredVisitors}
                unit={unit}
                type="visitor"
              />
            )}
            <div className="flex justify-between items-center my-2">
              <InputBox
                type="text"
                value={searchQuery}
                placeholder="Search visitors..."
                onchange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex items-center justify-end text-center">
                {/* Visitor Autofill Toggle */}
                {permissions.pmsPlatformVisitorCreate && (
                  <>
                    <h3 className="mx-2 w-24">Visitor Autofill</h3>
                    <SliderButton
                      onclick={() => {
                        setVisitorAutofill(!visitorAutofill);
                        localStorage.setItem(
                          "visitorAutofill",
                          !visitorAutofill
                        );
                      }}
                      value={visitorAutofill}
                    />
                  </>
                )}
                {permissions.pmsPlatformVisitorCreate && (
                  <GeneralButton
                    text={"Create Visitor"}
                    onclick={() => createTenant()}
                    className={"bg-green-500 hover:bg-green-600"}
                  />
                )}
              </div>
            </div>
            <div className="overflow-y-auto h-[70vh]">
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
              {filteredVisitors.length < 1 && (
                <p className="w-full text-center p-10 text-red-500">
                  No Visitors Found...
                </p>
              )}
            </div>
            <div className="pt-4">
              <PaginationFooter
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                items={filteredVisitors}
              />
            </div>
          </div>
        }
      />
    </>
  );
}
