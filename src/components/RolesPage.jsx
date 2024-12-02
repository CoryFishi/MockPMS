import React, { useRef, useState, useEffect } from "react";
import { FaPerson } from "react-icons/fa6";
import { useAuth } from "../context/AuthProvider";
import { supabaseAdmin, supabase } from "../supabaseClient";
import toast from "react-hot-toast";

import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";
import EditUser from "./modals/EditUser";
import CreateRole from "./modals/CreateRole";

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
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);

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

  async function getUsers() {
    if (!user) return;
    const { data, error } = await supabaseAdmin.from("roles").select("*");

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setRolesPulled(true);
      setRoles(data);
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
      setFilteredRoles((prevFilteredUsers) =>
        prevFilteredUsers.filter((user) => user.user_id !== userId)
      );
      return `User ${userId} and associated data deleted successfully.`;
    } catch (err) {
      console.error("Unexpected error:", err);
      throw err; // Re-throw the error to let `toast.promise` handle it
    }
  };

  useEffect(() => {
    if (!rolesPulled) getUsers();
  }, [user]);

  useEffect(() => {
    const filteredUsers = roles.sort((a, b) => {
      if (a.created_at > b.created_at) return -1;
      if (a.created_at < b.created_at) return 1;
      return 0;
    });
    setFilteredRoles(filteredUsers);
  }, [roles]);

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary mb-14 h-full">
      {isEditUserModalOpen && (
        <EditUser
          setIsEditUserModalOpen={setIsEditUserModalOpen}
          selectedUser={selectedRole}
          setUsers={setRoles}
          users={roles}
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
          &ensp; Users
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
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Role
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Description
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Permissions
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
                              setIsEditUserModalOpen(true) &
                              setDropdownIndex(null);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {roles.length < 1 && <p className="text-center">No users found.</p>}
        {/* Modal footer/pagination */}
        <div className="flex justify-between items-center px-2 py-5 mx-1">
          <div className="flex gap-3">
            <div>
              <select
                className="border rounded ml-2 dark:bg-darkSecondary dark:border-border"
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
              {currentPage * rowsPerPage > filteredRoles.length
                ? filteredRoles.length
                : currentPage * rowsPerPage}{" "}
              of {filteredRoles.length}
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
  );
}
