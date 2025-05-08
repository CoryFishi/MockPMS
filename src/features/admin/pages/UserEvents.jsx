import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import React, { useState, useEffect } from "react";
import { FaPerson } from "react-icons/fa6";
import { useAuth } from "@context/AuthProvider";
import { supabase } from "@app/supabaseClient";

export default function UserEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [eventsPulled, setEventsPulled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const [pullDate, setPullDate] = useState(null);
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
  async function getAllEvents() {
    setPullDate(Date());
    if (!user) return;
    const { data, error } = await supabase.from("user_events").select("*");

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEventsPulled(true);
      setEvents(data);
    }
  }
  useEffect(() => {
    if (!eventsPulled) getAllEvents();
  }, [user]);
  useEffect(() => {
    const filteredEvents = events.sort((a, b) => {
      if (a.created_at > b.created_at) return -1;
      if (a.created_at < b.created_at) return 1;
      return 0;
    });
    setSortedColumn("Created On");
    setFilteredEvents(filteredEvents);
  }, [events]);

  useEffect(() => {
    // Filter events based on the search query
    const filteredEvents = events.filter(
      (event) =>
        (event.id?.toString() || "").includes(searchQuery) ||
        (event.event_name?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (event.event_description?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (event.user_id?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (event.created_at?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
    );
    setFilteredEvents(filteredEvents);
  }, [searchQuery]);

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

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary">
      {/* Header */}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; User Events
        </div>
      </div>
      {/* Display date/time of when events were pulled */}
      <p className="text-sm dark:text-white text-left">{pullDate || ""}</p>
      {/* Body */}
      <div className="w-full px-5 flex flex-col rounded-lg h-fit">
        {/* Search Bar */}
        <div className="mt-5 mb-2 flex items-center justify-end text-center">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
          />
        </div>
        {/* Table */}
        <div>
          <DataTable
            columns={columns}
            data={filteredEvents}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            sortDirection={sortDirection}
            sortedColumn={sortedColumn}
            onSort={handleColumnSort}
          />
          {/* No Events Notification Text */}
          {filteredEvents.length < 1 && (
            <p className="text-center p-4 font-bold text-lg">
              No events found.
            </p>
          )}
          {/* Pagination Footer */}
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
  );
}
