import Navbar from "../../components/shared/Navbar";
import NotFound from "../../components/shared/NotFound";
import PaginationFooter from "../../components/shared/PaginationFooter";
import DataTable from "../../components/shared/DataTable";
import toast from "react-hot-toast";
import { BiCheckCircle, BiCircle } from "react-icons/bi";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import { useState, useEffect } from "react";

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

  const columns = [
    {
      key: "created_at",
      label: "Created On",
      accessor: (e) => e.created_at || "",
    },
    {
      key: "event_name",
      label: "Event",
      accessor: (e) => e.event_name || "",
    },
    {
      key: "event_description",
      label: "Description",
      accessor: (e) => e.event_description || "",
    },
    {
      key: "completed",
      label: "Success",
      accessor: (e) => (e.completed ? "true" : false || ""),
    },
  ];

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
      setFilteredEvents([...events]);
      return;
    }

    const sorted = [...filteredEvents].sort((a, b) => {
      const aVal = accessor(a) ?? "";
      const bVal = accessor(b) ?? "";

      if (aVal < bVal) return newDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredEvents(sorted);
  };

  return (
    <div className="dark:text-white dark:bg-darkPrimary min-h-screen w-full flex flex-col font-roboto">
      {user ? (
        <div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 flex flex-col items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-2 text-center rounded-sm max-w-7xl mx-auto">
              {/* Account Information */}
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
              {/* Update Password */}
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
              {/* Email Preferences */}
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
                      <label
                        title={`This is sent out every week on Monday,\nand contains a summary of all the SmartLocks in your selected facilities.\nYou must select facilities under the SmartLock tab to receive this email.`}
                      >
                        SmartLock Overview Emails
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Table */}
            <div className="w-full mt-2">
              <h1 className="text-2xl text-center">User Events</h1>
              <DataTable
                columns={columns}
                data={filteredEvents}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                sortDirection={sortDirection}
                sortedColumn={sortedColumn}
                onSort={handleColumnSort}
              />
              {events.length < 1 && (
                <p className="text-center">No events found.</p>
              )}
              {/* Pagination */}
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
