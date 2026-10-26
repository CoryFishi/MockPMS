import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { MdOutlineMap } from "react-icons/md";
import { useAuth } from "@context/AuthProvider";
import PageHeader from "@components/shared/PageHeader";
import DataTable from "@components/shared/DataTable";
import PaginationFooter from "@components/shared/PaginationFooter";
import LoadingSpinner from "@components/shared/LoadingSpinner";
import InputBox from "@components/ui/InputBox";
import GeneralButton from "@components/ui/GeneralButton";
import TableButton from "@components/ui/TableButton";
import ModalContainer from "@components/ui/ModalContainer";
import ModalButton from "@components/ui/ModalButton";
import { useTableSort } from "@hooks/tableSort";
import {
  createPlan,
  deletePlan,
  duplicatePlan,
  invalidateSitePlans,
  useSitePlans,
  type SitePlanListRow,
} from "@hooks/sitePlans";
import PlanDetailsModal from "@views/smartspace/mapping/PlanDetailsModal";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function SitePlans() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const { data: plans = [], isPending, isError } = useSitePlans();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<SitePlanListRow | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) =>
      [p.name, p.customer, p.address, p.updated_by_email, p.created_by_email]
        .some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [plans, searchQuery]);
  const { sortedRows, sortedColumn, sortDirection, onSort } = useTableSort(filtered);

  const canDelete = (plan: SitePlanListRow) => role === "admin" || plan.created_by === user?.id;

  const handleDuplicate = (plan: SitePlanListRow) => {
    toast.promise(
      duplicatePlan(plan).then(() => invalidateSitePlans(queryClient)),
      { loading: "Duplicating...", success: <b>Plan duplicated.</b>, error: (e) => <b>Duplicate failed: {e.message}</b> },
    );
  };

  const handleDelete = async (plan: SitePlanListRow) => {
    setToDelete(null);
    await toast.promise(
      deletePlan(plan).then(({ storageError }) => {
        if (storageError) toast.error("Plan deleted, but its background image could not be removed.");
        return invalidateSitePlans(queryClient);
      }),
      { loading: "Deleting...", success: <b>Plan deleted.</b>, error: (e) => <b>Delete failed: {e.message}</b> },
    ).catch(() => {});
  };

  const count = (plan: SitePlanListRow, keys: (keyof SitePlanListRow["summary"])[]) =>
    keys.reduce((sum, k) => sum + (plan.summary?.[k] ?? 0), 0);

  const columns = [
    { key: "name", label: "Name" },
    { key: "customer", label: "Customer" },
    { key: "address", label: "Address" },
    {
      key: "openNet",
      label: "ER / AP",
      accessor: (p: SitePlanListRow) => count(p, ["edgeRouters", "accessPoints"]),
      render: (p: SitePlanListRow) => `${count(p, ["edgeRouters"])} / ${count(p, ["accessPoints"])}`,
    },
    { key: "locks", label: "SmartLocks", accessor: (p: SitePlanListRow) => count(p, ["smartLocks"]) },
    { key: "motion", label: "SmartMotion", accessor: (p: SitePlanListRow) => count(p, ["smartMotion100", "smartMotion200"]) },
    { key: "updated_by_email", label: "Updated By" },
    { key: "updated_at", label: "Updated", render: (p: SitePlanListRow) => formatDate(p.updated_at) },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (p: SitePlanListRow) => (
        // Buttons sit inside a clickable row
        <div className="space-x-1" onClick={(e) => e.stopPropagation()}>
          <TableButton onclick={() => handleDuplicate(p)} text="Duplicate" className="bg-zinc-500 hover:bg-zinc-600" />
          {canDelete(p) && (
            <TableButton onclick={() => setToDelete(p)} text="Delete" className="bg-red-500 hover:bg-red-600" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={`relative ${isPending ? "overflow-hidden min-h-full" : "overflow-auto"} h-full dark:text-white dark:bg-zinc-900`}>
      {isPending && <LoadingSpinner loadingText="Loading site plans..." />}
      {isCreateOpen && (
        <PlanDetailsModal
          title="New Site Plan"
          submitText="Create"
          onClose={() => setIsCreateOpen(false)}
          onSubmit={async (details) => {
            try {
              const id = await createPlan(details);
              await invalidateSitePlans(queryClient);
              navigate(`/smartspace/mapping/${id}`);
            } catch (e) {
              toast.error(`Could not create the plan: ${(e as Error).message}`);
              throw e;
            }
          }}
        />
      )}
      {toDelete && (
        <ModalContainer
          title="Delete Site Plan"
          icon={<MdOutlineMap />}
          onClose={() => setToDelete(null)}
          mainContent={
            <p className="pt-5">
              Delete <b>{toDelete.name}</b> and its background image? This can&apos;t be undone.
            </p>
          }
          responseContent={
            <>
              <ModalButton onclick={() => setToDelete(null)} text="Cancel" />
              <ModalButton onclick={() => handleDelete(toDelete)} text="Delete" className="bg-red-500 hover:bg-red-600" />
            </>
          }
        />
      )}
      <PageHeader icon={MdOutlineMap} title="Site Plans" meta={`${plans.length} plan${plans.length === 1 ? "" : "s"}`} />
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <InputBox
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onchange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
          <GeneralButton onclick={() => setIsCreateOpen(true)} text="New Plan" className="bg-yellow-500 hover:bg-yellow-600" />
        </div>
        {isError ? (
          <p className="py-10 text-center text-red-500">Could not load site plans. Check that the site_plans migration has been applied.</p>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={sortedRows}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              sortedColumn={sortedColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              onRowClick={(row: SitePlanListRow) => navigate(`/smartspace/mapping/${row.id}`)}
            />
            <div className="px-2 py-5 mx-1">
              <PaginationFooter
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                items={sortedRows}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
