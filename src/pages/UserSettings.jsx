import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import NotFound from "../components/NotFound";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import {
  BiChevronLeft,
  BiChevronRight,
  BiChevronsLeft,
  BiChevronsRight,
} from "react-icons/bi";

export default function UserSettings({ darkMode, toggleDarkMode }) {
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [events, setEvents] = useState([]);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventsPulled, setEventsPulled] = useState(false);
  const pageCount = Math.ceil(filteredEvents.length / rowsPerPage);

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
    } else {
      console.log("Inserted event:", data);
    }
  }
  async function getAllEvents() {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_events")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEventsPulled(true);
      setEvents(data);
    }
  }
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
      await addEvent("User Logout", `${user.email} Logged Out`, false);
    } else {
      await addEvent("User Logout", `${user.email} Logged Out`, true);
      navigate("/login");
      setTokens([]);
      setCurrentFacility({});
      setFavoriteTokens([]);
      setSelectedTokens([]);
    }
  };
  const handlePasswordChange = async () => {
    if (newPassword1 !== newPassword2) {
      toast.error("Passwords do not match...");
      return;
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword1,
    });

    if (error) {
      toast.error(error.message);
      await addEvent(
        "Changed Password",
        `${user.email} changed their password`,
        false
      );
    } else {
      await addEvent(
        "Changed Password",
        `${user.email} changed their password`,
        true
      );
      toast.success("Password changed successfully!");
      setNewPassword1("");
      setNewPassword2("");
    }
  };
  useEffect(() => {
    if (!eventsPulled) getAllEvents();
  }, [user]);
  useEffect(() => {
    const filteredEvents = events.sort((a, b) => {
      if (a.created_at > b.created_at) return -1;
      if (a.created_at < b.created_at) return 1;
      return 0;
    });
    setFilteredEvents(filteredEvents);
  }, [events]);

  return (
    <div className="dark:text-white dark:bg-darkPrimary min-h-screen w-full flex flex-col font-roboto">
      {user ? (
        <div className="flex flex-col h-screen">
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          {/* Main content container with scrolling */}
          <div className="flex-1 overflow-y-auto px-5 flex flex-col items-center">
            <div className="flex gap-5 mt-2 text-center rounded max-w-2xl justify-evenly">
              <div className="dark:bg-darkNavSecondary rounded p-5 border shadow-md dark:border-border">
                <div className="flex flex-col items-center justify-center text-center gap-5">
                  <h1 className="text-2xl mt-2">Account Information</h1>
                  <div>
                    <span className="font-bold">Email:</span>{" "}
                    {user?.email || "null"}
                  </div>
                  <div>
                    <span className="font-bold">Role:</span> {role || "null"}
                  </div>
                  <div>
                    <span className="font-bold">Last Sign-In:</span>{" "}
                    {user.last_sign_in_at || "null"}
                  </div>
                </div>
                <div className="w-full mt-5">
                  <button
                    className="w-96 bg-gray-100 dark:bg-darkPrimary m-1 rounded text-black dark:text-white p-3 hover:text-slate-400 hover:dark:text-slate-400 hover:cursor-pointer"
                    onClick={() => handleLogout()}
                  >
                    Logout
                  </button>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center text-center h-full dark:bg-darkNavSecondary rounded p-5 border shadow-md dark:border-border">
                <div className="flex flex-col items-center justify-center text-center max-w-5xl">
                  <h1 className="text-2xl py-2">Update Password</h1>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword1}
                    onChange={(e) => setNewPassword1(e.target.value)}
                    className="text-black h-11 rounded m-2 border align-middle px-2"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    className="text-black h-11 rounded m-2 border align-middle px-2"
                  />
                  <button
                    className="bg-gray-100 dark:bg-darkPrimary m-1 rounded text-black dark:text-white p-3 hover:text-slate-400 hover:dark:text-slate-400 hover:cursor-pointer"
                    onClick={() => handlePasswordChange()}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
            <div className="w-full mt-5">
              <h1 className="text-2xl text-center">User Events</h1>
              <table className="w-full table-auto border-collapse border-gray-300 dark:border-border my-2">
                <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary w-full">
                  <tr className="bg-gray-200 dark:bg-darkNavSecondary w-full">
                    <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                      Created On
                    </th>
                    <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                      Event
                    </th>
                    <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                      Description
                    </th>
                    <th className="border border-gray-300 dark:border-border px-4 py-2 hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents
                    .slice(
                      (currentPage - 1) * rowsPerPage,
                      currentPage * rowsPerPage
                    )
                    .map((event, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary"
                      >
                        <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                          {event.created_at}
                        </td>
                        <td className="border-y border-gray-300 dark:border-border px-4 py-2">
                          {event.event_name}
                        </td>
                        <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                          {event.event_description}
                        </td>
                        <td className="border-y border-gray-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                          {event.completed ? "true" : "false"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {events.length < 1 && (
                <p className="text-center">No events found.</p>
              )}
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
                    {currentPage === 1
                      ? 1
                      : (currentPage - 1) * rowsPerPage + 1}{" "}
                    -{" "}
                    {currentPage * rowsPerPage > filteredEvents.length
                      ? filteredEvents.length
                      : currentPage * rowsPerPage}{" "}
                    of {filteredEvents.length}
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
      ) : (
        <div>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <NotFound />
        </div>
      )}
    </div>
  );
}
