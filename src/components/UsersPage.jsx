import React, { useState, useEffect } from "react";
import { FaPerson } from "react-icons/fa6";
import { useAuth } from "../context/AuthProvider";
import { supabaseAdmin } from "../supabaseClient";
import toast from "react-hot-toast";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [usersPulled, setUsersPulled] = useState(false);
  const pageCount = Math.ceil(filteredUsers.length / rowsPerPage);
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const toggleDropdown = (index) => {
    setDropdownIndex(dropdownIndex === index ? null : index);
  };
  const [selfUser, setSelfUser] = useState(user);

  async function getAllEvents() {
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
        console.error("Error deleting user:", authError);
        throw new Error("Failed to delete user from Auth.");
      }

      // Delete the user's row from the user_data table
      const { error: dataError } = await supabaseAdmin
        .from("user_data")
        .delete()
        .eq("user_id", userId);

      if (dataError) {
        console.error("Error deleting user data:", dataError);
        throw new Error("Failed to delete user data.");
      }

      // Success
      return `User ${userId} and associated data deleted successfully.`;
    } catch (err) {
      console.error("Unexpected error:", err);
      throw err; // Re-throw the error to let `toast.promise` handle it
    }
  };

  useEffect(() => {
    if (!usersPulled) getAllEvents();
  }, [user]);
  useEffect(() => {
    const filteredUsers = users.sort((a, b) => {
      if (a.created_at > b.created_at) return -1;
      if (a.created_at < b.created_at) return 1;
      return 0;
    });
    setFilteredUsers(filteredUsers);
  }, [users]);

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary mb-14 h-full">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; Users
        </div>
      </div>
      <p className="text-sm dark:text-white text-left">{Date()}</p>
      <div className="w-full px-5 py-2">
        <table className="w-full table-auto border-collapse border-gray-300 dark:border-border my-2">
          <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary w-full">
            <tr className="bg-gray-200 dark:bg-darkNavSecondary w-full">
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                User Id
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Tokens
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Favorites
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Selected
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Current Facility
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Role
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Created On
              </th>
              <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((user, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
                >
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {user.user_id}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {user.tokens.length}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {user.favorite_tokens.length}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {user.selected_tokens.length}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {user.current_facility.name || "n/a"}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                    {user.role}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                    {user.created_at}
                  </td>
                  <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell relative">
                    <button
                      className=" dark:bg-darkSecondary border rounded-lg dark:border-border p-2 hover:dark:bg-darkPrimary w-full"
                      onClick={() => toggleDropdown(index)}
                    >
                      Actions
                    </button>
                    {dropdownIndex === index && (
                      <div className="absolute top-11 right-0 mt-2 w-full bg-white dark:bg-darkSecondary border border-gray-200 dark:border-border rounded-lg shadow-lg p-2 z-20 flex flex-col">
                        <button
                          className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium text-left"
                          onClick={() => alert(`Edit ${user.user_id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium text-left"
                          onClick={() => {
                            if (selfUser.id != user.user_id) {
                              toast.promise(
                                deleteUser(user.user_id).then((result) => {
                                  if (result.success) {
                                    setUsers((prevUsers) =>
                                      prevUsers.filter(
                                        (u) => u.user_id !== user.user_id
                                      )
                                    );
                                  }
                                  return result;
                                }),
                                {
                                  loading: `Deleting ${user.user_id}...`,
                                  success: <b>{user.user_id} deleted!</b>,
                                  error: (
                                    <b>Could not delete {user.user_id}.</b>
                                  ),
                                }
                              );
                            } else {
                              alert("Can't delete your account!");
                            }
                          }}
                        >
                          Delete
                        </button>

                        <button
                          className="hover:bg-slate-100 dark:hover:bg-gray-700 px-3 py-2 text-md font-medium text-left"
                          onClick={() => alert(`View ${user.user_id}`)}
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {users.length < 1 && <p className="text-center">No users found.</p>}
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
              {currentPage * rowsPerPage > filteredUsers.length
                ? filteredUsers.length
                : currentPage * rowsPerPage}{" "}
              of {filteredUsers.length}
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
