import PaginationFooter from "@components/shared/PaginationFooter";
import EditRole from "@features/admin/modals/EditRole";
import CreateRole from "@features/admin/modals/CreateRole";
import DataTable from "@components/shared/DataTable";
import React, { useRef, useState, useEffect } from "react";
import { FaPerson } from "react-icons/fa6";
import { useAuth } from "@context/AuthProvider";
import { supabaseAdmin, supabase } from "@app/supabaseClient";
import toast from "react-hot-toast";
import InputBox from "@components/UI/InputBox";

export default function Roles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [filteredRoles, setFilteredRoles] = useState<any[]>([]);
  const [rolesPulled, setRolesPulled] = useState<boolean>(false);
  const [dropdownIndex, setDropdownIndex] = useState<number | null>(null);
  const modalRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState<boolean>(false);
  const [users, setUsers] = useState<any[]>([]);
  const [sortedColumn, setSortedColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("asc");

  const handleColumnSort = (columnKey: string, accessor: any = (a:any) => a[columnKey]) => {
    let newDirection: "asc" | "desc" | null;

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
      setFilteredRoles([...roles]);
      return;
    }

    const sorted = [...filteredRoles].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredRoles(sorted);
  };

  const toggleDropdown = (index: number) => {
    setDropdownIndex(dropdownIndex === index ? null : index);
  };

  // Close modal if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickInsideAny = Object.values(modalRefs.current).some((ref) =>
        ref instanceof HTMLElement && ref.contains(event.target as Node)
      );
      if (!isClickInsideAny) {
        setDropdownIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteRole = async (roleId: number) => {
    try {
      // Delete the role
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) {
        console.error("Error deleting the role:", error);
        throw new Error("Failed to delete role.");
      }
      // Success
      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
      return `Role ${roleId} deleted successfully.`;
    } catch (err) {
      console.error("Unexpected error:", err);
      throw err; // Re-throw the error to let `toast.promise` handle it
    }
  };

  useEffect(() => {
    if (!rolesPulled) {
      async function getRoles() {
        if (!user) return;
        const { data, error } = await supabaseAdmin.from("roles").select("*");

        if (error) {
          console.error("Error fetching events:", error);
        } else {
          setRolesPulled(true);
          setRoles(data);
        }
      }
      getRoles();
      async function getUsers() {
        if (!user) return;
        const { data, error } = await supabaseAdmin
          .from("user_data")
          .select("*");

        if (error) {
          console.error("Error fetching events:", error);
        } else {
          setUsers(data);
        }
      }
      getUsers();
    }
  }, [user, rolesPulled, roles]);

  useEffect(() => {
    const filteredRoles = roles.sort((a, b) => {
      if ((a.role_name || "").toLowerCase() < (b.role_name || "").toLowerCase())
        return -1;
      if ((a.role_name || "").toLowerCase() > (b.role_name || "").toLowerCase())
        return 1;
      return 0;
    });
    setSortedColumn("Role");
    setFilteredRoles(filteredRoles);
  }, [roles]);

  useEffect(() => {
    // Filter roles based on the search query
    const filteredRoles = roles.filter(
      (role) =>
        (role.id?.toString() || "").includes(searchQuery) ||
        (role.role_name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (role.role_description?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
    );
    setFilteredRoles(filteredRoles);
  }, [searchQuery, roles]);

  const columns = [
    {
      key: "role_name",
      label: "Role",
      accessor: (r: any) => r.role_name || "",
    },
    {
      key: "role_description",
      label: "Description",
      accessor: (r: any) => r.role_description || "",
    },
    {
      key: "permissions",
      label: "Permissions",
      accessor: (r: any) =>
        Object.values(r.permissions)?.filter((value) => value === true)
          ?.length || 0,
    },
    {
      key: "users",
      label: "Users",
      accessor: (r: any) => {
        return users.filter((user) => user.role === r.role_name).length;
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (role: any, index: number) => (
        <div className="flex justify-center relative">
          <button
            className="dark:bg-zinc-800 border rounded-lg dark:border-zinc-700 p-2 dark:hover:bg-zinc-900 w-full cursor-pointer"
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              toggleDropdown(index);
            }}
          >
            Actions
          </button>
          {dropdownIndex === index && (
            <div
              ref={(el: HTMLDivElement | null) => { modalRefs.current[index] = el; }}
              className="absolute top-full mt-1 right-0 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 flex flex-col"
            >
              <button
                className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md hover:cursor-pointer rounded-b"
                onClick={() => {
                  setSelectedRole(role);
                  setIsEditRoleModalOpen(true);
                  setDropdownIndex(null);
                }}
              >
                Edit
              </button>
              {users.filter((user) => user.role === role.role_name).length <
              1 ? (
                <button
                  className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md hover:cursor-pointer rounded-b"
                  onClick={() =>
                    toast.promise(deleteRole(role.id), {
                      loading: `Deleting role...`,
                      success: <b>Role deleted successfully!</b>,
                      error: <b>Failed to delete role. Please try again.</b>,
                    })
                  }
                >
                  Delete
                </button>
              ) : null}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-auto dark:text-white dark:bg-zinc-900 h-full">
      {/* Edit Role Modal */}
      {isEditRoleModalOpen && (
        <EditRole
          setIsEditRoleModalOpen={setIsEditRoleModalOpen}
          selectedRole={selectedRole}
          setRoles={setRoles}
        />
      )}
      {/* Create Role Modal */}
      {isCreateRoleModalOpen && (
        <CreateRole
          setIsCreateRoleModalOpen={setIsCreateRoleModalOpen}
          setRoles={setRoles}
        />
      )}
      {/* Header */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-zinc-700 dark:bg-zinc-950">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; Roles
        </div>
      </div>
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        {/* Search Bar */}
        <div className="mb-2 mt-5 flex items-center justify-end text-center">
          <InputBox
            placeholder="Search roles..."
            value={searchQuery}
            onchange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => setIsCreateRoleModalOpen(true)}
            className="hover:cursor-pointer bg-yellow-500 text-white p-1 py-2 rounded-sm hover:bg-yellow-600 hover:scale-105 ml-3 w-44 font-bold transition duration-300 ease-in-out transform select-none"
          >
            Create Role
          </button>
        </div>
        {/* Table */}
        <div>
          <DataTable
            columns={columns}
            data={filteredRoles}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            sortDirection={sortDirection}
            sortedColumn={sortedColumn}
            onSort={handleColumnSort}
          />
          {/* No Roles Notification Text */}
          {filteredRoles.length < 1 && (
            <p className="text-center p-4 font-bold text-lg">No roles found.</p>
          )}
          {/* Pagination Footer */}
          <div className="px-2 py-5 mx-1">
            <PaginationFooter
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              items={filteredRoles}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
