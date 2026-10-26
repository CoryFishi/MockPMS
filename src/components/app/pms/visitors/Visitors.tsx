import CreateVisitorVisitor from "@views/pms/visitors/CreateVisitorVisitorPage";
import EditVisitorVisitorPage from "@views/pms/visitors/EditVisitorVisitorPage";
import PaginationFooter from "@components/shared/PaginationFooter";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import DataTable from "@components/shared/DataTable";
import { useAuth } from "@context/AuthProvider";
import { FaPerson } from "react-icons/fa6";
import axios from "axios";
import toast from "react-hot-toast";
import { useMemo, useState } from "react";
import DeleteModal from "@views/pms/DeleteModal";
import InputBox from "@components/ui/InputBox";
import GeneralButton from "@components/ui/GeneralButton";
import TableButton from "@components/ui/TableButton";
import { addEvent } from "@hooks/supabase";
import { buildApiUrl, authHeaders } from "@hooks/opentech";
import { useFacilityResource, sortByUnitNumber } from "@hooks/facilityResource";
import { useTableSort } from "@hooks/tableSort";
import PageHeader from "@components/shared/PageHeader";

export default function Visitors({ currentFacilityName }) {
  const [isCreateVisitorModalOpen, setIsCreateVisitorModalOpen] =
    useState<boolean>(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [isEditVisitorModalOpen, setIsEditVisitorModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const { currentFacility, permissions } = useAuth();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [currentLoadingText] = useState<string>("Loading Visitors...");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [continousDelete, setContinousDelete] = useState<boolean>(false);
  const { user } = useAuth();
  const {
    data: visitors,
    setData: setVisitors,
    isPending: visitorsPending,
  } = useFacilityResource(currentFacility, "/visitors", { transform: sortByUnitNumber });
  const visitorsPulled = !visitorsPending;
  // Errors when the facility has no SmartLocks, so don't retry
  const { data: smartLocks } = useFacilityResource(currentFacility, "/smartlockstatus", { retry: false });

  const searchedVisitors = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return visitors.filter(
      (visitor) =>
        (visitor.id?.toString() || "").includes(searchQuery) ||
        (visitor.accessProfileName?.toLowerCase() || "").includes(query) ||
        (visitor.timeGroupName?.toLowerCase() || "").includes(query) ||
        (visitor.name?.toLowerCase() || "").includes(query) ||
        (visitor.unitNumber?.toLowerCase() || "").includes(query) ||
        (visitor.mobilePhoneNumber?.toLowerCase() || "").includes(query) ||
        (visitor.email?.toLowerCase() || "").includes(query) ||
        (visitor.code?.toLowerCase() || "").includes(query)
    );
  }, [visitors, searchQuery]);
  const { sortedRows: filteredVisitors, sortedColumn, sortDirection, onSort } =
    useTableSort(searchedVisitors);

  const tenantCount = filteredVisitors.filter(
    (visitor) => visitor.isTenant === true
  ).length;
  const nonTenantCount = filteredVisitors.filter(
    (visitor) => visitor.isPortalVisitor === true
  ).length;
  const guestCount = filteredVisitors.filter(
    (visitor) => visitor.isTenant === false && visitor.isPortalVisitor === false
  ).length;

  const moveOutVisitor = async (visitor: any) => {
    const handleDelete = async () => {
      const config = {
        method: "post",
        url: buildApiUrl(
          currentFacility,
          `/facilities/${currentFacility.id}/units/${visitor.unitId}/vacate?suppressCommands=true`
        ),

        headers: authHeaders(currentFacility, "application/json-patch+json"),
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
  const deleteVisitor = async (visitor: any) => {
    const handleDelete = async () => {
      const config = {
        method: "post",
        url: buildApiUrl(
          currentFacility,
          `/facilities/${currentFacility.id}/visitors/${visitor.id}/remove`
        ),

        headers: authHeaders(currentFacility, "application/json-patch+json"),
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
          ? "PMS Tenant"
          : v.isPortalVisitor
          ? "Non-Tenant"
          : !v.unitNumber
          ? "PMS Non-Tenant Guest"
          : "PMS Guest",
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
      <PageHeader icon={FaPerson} title="Visitors" subtitle={currentFacilityName} />
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
            onchange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
            value={searchQuery}
          />
          {/* Create Visitor Button */}
          {permissions.pmsPlatformVisitorCreate && (
            <GeneralButton
              text={"Create Visitor"}
              className="bg-yellow-500 hover:bg-yellow-600"
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
          onSort={onSort}
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
