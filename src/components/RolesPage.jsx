import React, { useRef, useState, useEffect } from "react";
import { FaPerson } from "react-icons/fa6";
import { useAuth } from "../context/AuthProvider";
import { supabaseAdmin, supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import PaginationFooter from "./PaginationFooter";
import EditRole from "./modals/EditRole";

export default function Roles() {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [rolesPulled, setRolesPulled] = useState(false);
  const pageCount = Math.ceil(filteredRoles.length / rowsPerPage);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const modalRef = useRef(null);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  async function getUsers() {
    if (!user) return;
    const { data, error } = await supabaseAdmin.from("user_data").select("*");

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setUsers(data);
    }
  }

  async function addEvent(eventName, eventDescription, completed) {
    const { data, error } = await supabase.from("user_events").insert([
      {
        event_name: eventName,
        event_description: eventDescription,
        completed: completed,
      },
    ]);

    if (error) {
      console.error("Error inserting event:", error);
    }
  }

  const toggleDropdown = (index) => {
    setDropdownIndex(dropdownIndex === index ? null : index);
  };

  // Close modal if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setDropdownIndex(null); // Close the modal
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setDropdownIndex]);

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

  const deleteRole = async (roleId) => {
    try {
      // Delete the role
      const { error } = await supabase.from("roles").delete().eq("id", roleId);
      if (error) {
        console.error("Error deleting the role:", authError);
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
    if (!rolesPulled) getRoles() & getUsers();
  }, [user]);

  useEffect(() => {
    const filteredUsers = roles.sort((a, b) => {
      if ((a.role_name || "").toLowerCase() < (b.role_name || "").toLowerCase())
        return -1;
      if ((a.role_name || "").toLowerCase() > (b.role_name || "").toLowerCase())
        return 1;
      return 0;
    });
    setSortedColumn("Role");
    setFilteredRoles(filteredUsers);
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
  }, [searchQuery]);

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary mb-14 h-full">
      {isEditRoleModalOpen && (
        <EditRole
          setIsEditRoleModalOpen={setIsEditRoleModalOpen}
          selectedRole={selectedRole}
          setRoles={setRoles}
        />
      )}
      {isCreateRoleModalOpen && (
        <CreateRole
          setIsCreateRoleModalOpen={setIsCreateRoleModalOpen}
          setRoles={setRoles}
        />
      )}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; Roles
        </div>
      </div>
      <div className="mt-2  flex items-center justify-end text-center px-5">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
        <button
          onClick={() => setIsCreateRoleModalOpen(true)}
          className="bg-green-500 text-white p-1 py-2 rounded hover:bg-green-600 hover:scale-105 ml-3 w-44 font-bold transition duration-300 ease-in-out transform select-none"
        >
          Create Role
        </button>
      </div>
      <div className="w-full px-5 py-2">
        <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
          <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary w-full">
            <tr className="bg-gray-200 dark:bg-darkNavSecondary w-full">
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Role");
                  setFilteredRoles(
                    [...roles].sort((a, b) => {
                      if (
                        (a.role_name || "").toLowerCase() <
                        (b.role_name || "").toLowerCase()
                      )
                        return newDirection === "asc" ? -1 : 1;
                      if (
                        (a.role_name || "").toLowerCase() >
                        (b.role_name || "").toLowerCase()
                      )
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Role
                {sortedColumn === "Role" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Description");
                  setFilteredRoles(
                    [...roles].sort((a, b) => {
                      if (
                        (a.role_description || "").toLowerCase() <
                        (b.role_description || "").toLowerCase()
                      )
                        return newDirection === "asc" ? -1 : 1;
                      if (
                        (a.role_description || "").toLowerCase() >
                        (b.role_description || "").toLowerCase()
                      )
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Description
                {sortedColumn === "Description" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Permissions");
                  setFilteredRoles(
                    [...roles].sort((a, b) => {
                      const permissionA = Object.values(
                        a.permissions || {}
                      ).filter((value) => value === true).length;
                      const permissionB = Object.values(
                        b.permissions || {}
                      ).filter((value) => value === true).length;

                      if (permissionA < permissionB)
                        return newDirection === "asc" ? -1 : 1;
                      if (permissionA > permissionB)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Permissions
                {sortedColumn === "Permissions" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Users");
                  setFilteredRoles(
                    [...roles].sort((a, b) => {
                      const userCountA = users.filter(
                        (user) => user.role === a.role_name
                      ).length;
                      const userCountB = users.filter(
                        (user) => user.role === b.role_name
                      ).length;

                      if (userCountA < userCountB)
                        return newDirection === "asc" ? -1 : 1;
                      if (userCountA > userCountB)
                        return newDirection === "asc" ? 1 : -1;
                      return 0;
                    })
                  );
                }}
              >
                Users
                {sortedColumn === "Users" && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((role, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
                >
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {role.role_name}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {role.role_description}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {Object.values(role.permissions)?.filter(
                      (value) => value === true
                    )?.length || 0}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {
                      users.filter((user) => user.role === role.role_name)
                        .length
                    }
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell relative">
                    <button
                      className=" dark:bg-darkSecondary border rounded-lg dark:border-border p-2 hover:dark:bg-darkPrimary w-full"
                      onClick={() => toggleDropdown(index)}
                    >
                      Actions
                    </button>
                    {dropdownIndex === index && (
                      <div
                        ref={modalRef}
                        className="absolute top-11 right-0 mt-2 w-full bg-white dark:bg-darkSecondary border border-gray-200 dark:border-border rounded-lg shadow-lg p-2 z-20 flex flex-col"
                      >
                        <button
                          className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium text-left"
                          onClick={() => {
                            setSelectedRole(role) &
                              setIsEditRoleModalOpen(true) &
                              setDropdownIndex(null);
                          }}
                        >
                          Edit
                        </button>
                        {users.filter((user) => user.role === role.role_name)
                          .length < 1 ? (
                          <button
                            className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium text-left"
                            onClick={() =>
                              toast.promise(deleteRole(role.id), {
                                loading: `Deleting role...`,
                                success: <b>Role deleted successfully!</b>,
                                error: (
                                  <b>
                                    Failed to delete role. Please try again.
                                  </b>
                                ),
                              })
                            }
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
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
  );
}
