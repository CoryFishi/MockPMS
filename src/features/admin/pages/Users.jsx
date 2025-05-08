import React, { useRef, useState, useEffect } from "react";
import { FaPerson } from "react-icons/fa6";
import { useAuth } from "@context/AuthProvider";
import { supabaseAdmin } from "@app/supabaseClient";
import toast from "react-hot-toast";
import EditUser from "../modals/EditUser";
import PaginationFooter from "@components/shared/PaginationFooter";
import { addEvent } from "@hooks/events";
import DataTable from "@components/shared/DataTable";

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [usersPulled, setUsersPulled] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const [selfUser, setSelfUser] = useState(user);
  const modalRefs = useRef({});
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

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
      setFilteredUsers([...users]);
      return;
    }

    const sorted = [...filteredUsers].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(sorted);
  };

  const toggleDropdown = (index) => {
    setDropdownIndex((prevIndex) => (prevIndex === index ? null : index));
  };

  // Close modal if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideAny = Object.values(modalRefs.current).some((ref) =>
        ref?.contains(event.target)
      );
      if (!isClickInsideAny) {
        setDropdownIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function getUsers() {
    if (!user) return;
    const { data, error } = await supabaseAdmin.from("user_data").select("*");

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setUsersPulled(true);
      setUsers(data);
    }
  }

  const deleteUser = async (userId) => {
    try {
      // Delete the user from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
        userId
      );
      if (authError) {
        addEvent("User Deleted", `${user.email} deleted user ${userId}`, false);
        console.error("Error deleting user:", authError);
        throw new Error("Failed to delete user from Auth.");
      }

      // Delete the user's row from the user_data table
      const { error: dataError } = await supabaseAdmin
        .from("user_data")
        .delete()
        .eq("user_id", userId);

      if (dataError) {
        addEvent("User Deleted", `${user.email} deleted user ${userId}`, false);
        console.error("Error deleting user data:", dataError);
        throw new Error("Failed to delete user data.");
      }

      // Success
      addEvent("User Deleted", `${user.email} deleted user ${userId}`, true);
      setFilteredUsers((prevFilteredUsers) =>
        prevFilteredUsers.filter((user) => user.user_id !== userId)
      );
      return `User ${userId} and associated data deleted successfully.`;
    } catch (err) {
      console.error("Unexpected error:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (!usersPulled) getUsers();
  }, [user]);

  useEffect(() => {
    const filteredUsers = users.sort((a, b) => {
      if (
        (a.user_email || "").toLowerCase() < (b.user_email || "").toLowerCase()
      )
        return -1;
      if (
        (a.user_email || "").toLowerCase() > (b.user_email || "").toLowerCase()
      )
        return 1;
      return 0;
    });
    setSortedColumn("User");
    setFilteredUsers(filteredUsers);
  }, [users]);

  useEffect(() => {
    // Filter users based on the search query
    const filteredUsers = users.filter(
      (user) =>
        (user.id?.toString() || "").includes(searchQuery) ||
        (user.user_email?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (user.role?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (user.current_facility?.name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (user.created_at?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
    );
    setFilteredUsers(filteredUsers);
  }, [searchQuery]);

  const columns = [
    {
      key: "user_email",
      label: "Email",
      accessor: (e) => e.user_email || "",
    },
    {
      key: "tokens",
      label: "Tokens",
      accessor: (e) => e.tokens?.length || 0,
    },
    {
      key: "favorite_tokens",
      label: "Favorite",
      accessor: (e) => e.favorite_tokens?.length || 0,
    },
    {
      key: "selected_tokens",
      label: "Selected",
      accessor: (e) => e.selected_tokens?.length || 0,
    },
    {
      key: "current_facility",
      label: "Current Facility",
      accessor: (e) => e.current_facility.name || "",
    },
    {
      key: "role",
      label: "Role",
      accessor: (e) => e.role || "",
    },
    {
      key: "created_at",
      label: "Created On",
      accessor: (e) => e.created_at || "",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (user, index) => (
        <div className="flex justify-center relative">
          <button
            className="dark:bg-darkSecondary border rounded-lg dark:border-border p-2 dark:hover:bg-darkPrimary w-full cursor-pointer"
            onMouseDown={(e) => {
              e.stopPropagation();
              toggleDropdown(index);
            }}
          >
            Actions
          </button>
          {dropdownIndex === index && (
            <div
              ref={(el) => (modalRefs.current[index] = el)}
              className="absolute top-full mt-1 right-0 w-full bg-white dark:bg-darkSecondary border border-zinc-200 dark:border-border rounded-lg shadow-lg z-20 flex flex-col"
            >
              <button
                className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md hover:cursor-pointer rounded-t"
                onClick={() => {
                  setSelectedUser(user);
                  setIsEditUserModalOpen(true);
                  setDropdownIndex(null);
                }}
              >
                Edit
              </button>
              <button
                className="hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-2 text-md hover:cursor-pointer rounded-b"
                onClick={() => {
                  setDropdownIndex(null);
                  if (selfUser.id !== user.user_id) {
                    toast.promise(
                      deleteUser(user.user_id).then((result) => {
                        if (result.success) {
                          setUsers((prevUsers) =>
                            prevUsers.filter((u) => u.user_id !== user.user_id)
                          );
                        }
                        return result;
                      }),
                      {
                        loading: `Deleting ${user.user_id}...`,
                        success: <b>{user.user_id} deleted!</b>,
                        error: <b>Could not delete {user.user_id}.</b>,
                      }
                    );
                  } else {
                    alert("Can't delete your account!");
                  }
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary h-full">
      {/* User Edit Modal */}
      {isEditUserModalOpen && (
        <EditUser
          setIsEditUserModalOpen={setIsEditUserModalOpen}
          selectedUser={selectedUser}
          setUsers={setUsers}
          users={users}
        />
      )}
      {/* Header */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; Users
        </div>
      </div>
      {/* Body */}
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        {/* Search Bar */}
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
          />
        </div>
        {/* Table */}
        <div>
          <DataTable
            columns={columns}
            data={filteredUsers}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            sortDirection={sortDirection}
            sortedColumn={sortedColumn}
            onSort={handleColumnSort}
          />
          {/* No Users Notification */}
          {filteredUsers.length < 1 && (
            <p className="text-center p-4 font-bold text-lg">No users found.</p>
          )}
          {/* Pagination Footer */}
          <div className="px-2 py-5 mx-1">
            <PaginationFooter
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              items={filteredUsers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
