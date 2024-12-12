import React, { useState, useEffect } from "react";
import { FaPerson } from "react-icons/fa6";
import { useAuth } from "../context/AuthProvider";
import { supabase } from "../supabaseClient";
import PaginationFooter from "./PaginationFooter";

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

  async function getAllEvents() {
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

  return (
    <div className="overflow-auto dark:text-white dark:bg-darkPrimary mb-14">
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaPerson className="text-lg" />
          &ensp; User Events
        </div>
      </div>
      <p className="text-sm dark:text-white text-left">{Date()}</p>
      <div className="mt-2  flex items-center justify-end text-center px-5">
        <input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 w-full dark:bg-darkNavSecondary rounded dark:border-border"
        />
      </div>
      <div className="w-full px-5 py-2">
        <table className="w-full table-auto border-collapse border-gray-300 dark:border-border">
          <thead className="select-none sticky top-[-1px] z-10 bg-gray-200 dark:bg-darkNavSecondary w-full">
            <tr className="bg-gray-200 dark:bg-darkNavSecondary w-full hover:cursor-pointer">
              <th
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
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
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
                  setSortDirection(newDirection);
                  setSortedColumn("Event");
                  setFilteredEvents(
                    [...events].sort((a, b) => {
                      if (
                        a.event_name.toLowerCase() < b.event_name.toLowerCase()
                      )
                        return newDirection === "asc" ? -1 : 1;
                      if (
                        a.event_name.toLowerCase() > b.event_name.toLowerCase()
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
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
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
                className="border border-gray-300 dark:border-border px-4 py-2 text-left hover:cursor-pointer hover:bg-slate-300 hover:dark:bg-darkPrimary hover:transition hover:duration-300 hover:ease-in-out"
                onClick={() => {
                  const newDirection = sortDirection === "asc" ? "desc" : "asc";
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
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
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
        {/* No Events Notification Text */}
        {filteredEvents.length < 1 && (
          <p className="text-center p-4 font-bold text-lg">No events found.</p>
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
  );
}
