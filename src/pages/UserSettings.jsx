import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import NotFound from "../components/NotFound";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import PaginationFooter from "../components/PaginationFooter";
import { BiCheckCircle, BiCircle } from "react-icons/bi";

export default function UserSettings({ darkMode, toggleDarkMode }) {
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [events, setEvents] = useState([]);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventsPulled, setEventsPulled] = useState(false);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchPreference = async () => {
      const { data, error } = await supabase
        .from("user_data")
        .select("automated_reports")
        .eq("user_email", user.email)
        .single();

      if (data?.automated_reports?.smartlockOverview) {
        setEnabled(true);
      }
    };

    fetchPreference();
  }, [user]);

  const toggle = async () => {
    setLoading(true);
    const newPref = { smartlockOverview: !enabled };

    const { error } = await supabase
      .from("user_data")
      .update({ automated_reports: newPref })
      .eq("user_email", user.email);

    if (!error) setEnabled(!enabled);
    setLoading(false);
  };
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
          <div className="flex-1 overflow-y-auto px-5 flex flex-col items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2 text-center rounded-sm max-w-7xl mx-auto">
              <div className="dark:bg-darkNavSecondary rounded-sm p-5 border shadow-md dark:border-border">
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
                    className="w-full bg-zinc-100 dark:bg-darkPrimary m-1 rounded-sm text-black dark:text-white p-3 hover:text-slate-400 dark:hover:text-slate-400 hover:cursor-pointer"
                    onClick={() => handleLogout()}
                  >
                    Logout
                  </button>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center text-center h-full dark:bg-darkNavSecondary rounded-sm p-5 border shadow-md dark:border-border">
                <h1 className="text-2xl py-2">Update Password</h1>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword1}
                  onChange={(e) => setNewPassword1(e.target.value)}
                  className="h-11 w-full max-w-64 rounded-sm m-2 border align-middle px-2 dark:border-border dark:bg-darkPrimary"
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                  className="h-11 w-full max-w-64 rounded-sm m-2 border align-middle px-2 dark:border-border dark:bg-darkPrimary"
                />
                <button
                  className="bg-zinc-100 dark:bg-darkPrimary m-1 rounded-sm text-black dark:text-white p-3 hover:text-slate-400 dark:hover:text-slate-400 hover:cursor-pointer"
                  onClick={() => handlePasswordChange()}
                >
                  Change Password
                </button>
              </div>
              <div className="flex flex-col h-full dark:bg-darkNavSecondary rounded-sm p-5 border shadow-md dark:border-border">
                <div className="flex flex-col max-w-5xl">
                  <h1 className="text-2xl py-2">Email Preferences</h1>
                  <div className="flex-col flex justify-center max-w-5xl gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggle}
                        disabled={loading}
                        className={`px-2 py-2 rounded-full text-2xl cursor-pointer ${
                          enabled
                            ? "text-green-600 hover:bg-green-200"
                            : "text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {enabled ? <BiCheckCircle /> : <BiCircle />}
                      </button>
                      <label>SmartLock Overview Emails</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full mt-2">
              <h1 className="text-2xl text-center">User Events</h1>
              <table className="w-full table-auto border-collapse pb-96">
                <thead className="sticky top-[-1px] z-10 select-none">
                  <tr className="bg-zinc-200 dark:bg-darkNavSecondary">
                    <th
                      className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                      onClick={() => {
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
                        setSortDirection(newDirection);
                        setSortedColumn("Created On");
                        setFilteredEvents(
                          [...events].sort((a, b) => {
                            if (a.created_at < b.created_at)
                              return newDirection === "asc" ? -1 : 1;
                            if (a.created_at > b.created_at)
                              return newDirection === "asc" ? 1 : -1;
                            return 0;
                          })
                        );
                      }}
                    >
                      Created On
                      {sortedColumn === "Created On" && (
                        <span className="ml-2">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                      onClick={() => {
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
                        setSortDirection(newDirection);
                        setSortedColumn("Event");
                        setFilteredEvents(
                          [...events].sort((a, b) => {
                            if (
                              a.event_name.toLowerCase() <
                              b.event_name.toLowerCase()
                            )
                              return newDirection === "asc" ? -1 : 1;
                            if (
                              a.event_name.toLowerCase() >
                              b.event_name.toLowerCase()
                            )
                              return newDirection === "asc" ? 1 : -1;
                            return 0;
                          })
                        );
                      }}
                    >
                      Event
                      {sortedColumn === "Event" && (
                        <span className="ml-2">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th
                      className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                      onClick={() => {
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
                        setSortDirection(newDirection);
                        setSortedColumn("Description");
                        setFilteredEvents(
                          [...events].sort((a, b) => {
                            if (
                              a.event_description.toLowerCase() <
                              b.event_description.toLowerCase()
                            )
                              return newDirection === "asc" ? -1 : 1;
                            if (
                              a.event_description.toLowerCase() >
                              b.event_description.toLowerCase()
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
                      className="px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 dark:hover:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                      onClick={() => {
                        const newDirection =
                          sortDirection === "asc" ? "desc" : "asc";
                        setSortDirection(newDirection);
                        setSortedColumn("Success");
                        setFilteredEvents(
                          [...events].sort((a, b) => {
                            if (a.completed < b.completed)
                              return newDirection === "asc" ? -1 : 1;
                            if (a.completed > b.completed)
                              return newDirection === "asc" ? 1 : -1;
                            return 0;
                          })
                        );
                      }}
                    >
                      Success
                      {sortedColumn === "Success" && (
                        <span className="ml-2">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
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
                        className="hover:bg-zinc-100 dark:hover:bg-darkNavSecondary"
                      >
                        <td className="border-y border-zinc-300 dark:border-border px-4 py-2">
                          {event.created_at}
                        </td>
                        <td className="border-y border-zinc-300 dark:border-border px-4 py-2">
                          {event.event_name}
                        </td>
                        <td className="border-y border-zinc-300 dark:border-border px-4 py-2 hidden sm:table-cell">
                          {event.event_description}
                        </td>
                        <td className="border-y border-zinc-300 dark:border-border px-4 py-2 hidden sm:table-cell">
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
              <div className="px-2 py-5 mx-1">
                <PaginationFooter
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  items={filteredEvents}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <NotFound />
      )}
    </div>
  );
}
