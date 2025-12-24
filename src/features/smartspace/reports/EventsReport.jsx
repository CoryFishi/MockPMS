import PaginationFooter from "@components/shared/PaginationFooter";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import DataTable from "@components/shared/DataTable";
import DetailModal from "@components/shared/DetailModal";
import GeneralButton from "@components/UI/GeneralButton";
import ModalContainer from "@components/UI/ModalContainer";

export default function EventsReport({ selectedFacilities, searchQuery }) {
  const [filteredSmartLockEvents, setFilteredSmartLockEvents] = useState([]);
  const [smartlockEvents, setSmartlockEvents] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortDirection, setSortDirection] = useState("desc");
  const [sortedColumn, setSortedColumn] = useState(null);
  const [dayValue, setDayValue] = useState(0.5);
  const currentTime = Math.floor(Date.now() / 1000);
  const pastDayValue = currentTime - dayValue * 24 * 60 * 60;
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventModalSelectedEvents, setEventModalSelectedEvents] = useState([]);

  const fetchEventsForFacility = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const gatewayPlatform =
        "&gtq=" +
        selectedEvents
          .filter(
            (event) => event.eventCategoryName === "Gateway Controller Event"
          )
          .map((event) => event.eventTypeEnum)
          .join("&gtq=");

      const edgePlatform =
        "&etq=" +
        selectedEvents
          .filter((event) => event.eventCategoryName === "Edge Router Event")
          .map((event) => event.eventTypeEnum)
          .join("&etq=");
      console.log("Selected Events:", gatewayPlatform, edgePlatform);

      const response = await axios.get(
        `https://accessevent.${tokenStageKey}insomniaccia${tokenEnvKey}.com/combinedevents/facilities/${
          facility.id
        }?uq=&vq=${gatewayPlatform !== "&gtq=" ? gatewayPlatform : ""}${
          edgePlatform !== "&etq=" ? edgePlatform : ""
        }&minDate=${pastDayValue}&maxDate=${currentTime}&hideMetadata=true`,
        {
          headers: {
            Authorization: "Bearer " + facility.bearer,
            accept: "application/json",
            "api-version": "3.0",
          },
        }
      );
      const smartLockEvents = response.data;
      return smartLockEvents;
    } catch (error) {
      console.error(`Error fetching Events for: ${facility.name}`, error);
      toast.error(`${facility.name} does not have Events`);
      return null;
    }
  };

  const fetchEventTypes = async () => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (selectedFacilities[0].environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = selectedFacilities[0].environment;
      }

      const response = await axios.get(
        `https://accessevent.${tokenStageKey}insomniaccia${tokenEnvKey}.com/combinedevents/types`,
        {
          headers: {
            Authorization: "Bearer " + selectedFacilities[0].bearer,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const eventTypes = response.data;
      console.log("Fetched Event Types:", eventTypes);
      setEventTypes(eventTypes);
      setSelectedEvents(eventTypes);
      return eventTypes;
    } catch (error) {
      console.error(`Error fetching Event Types`, error);
      return null;
    }
  };

  const fetchDataForSelectedFacilities = async () => {
    setSmartlockEvents([]); // Clear existing data
    const fetchPromises = selectedFacilities.map(async (facility) => {
      const smartlockData = await fetchEventsForFacility(facility);
      return smartlockData;
    });

    var allSmartlockData = await Promise.all(fetchPromises);
    allSmartlockData = allSmartlockData.filter((data) => data !== null);

    // Flatten the array and update state with all smartlocks
    const flattenedData = allSmartlockData.flat();
    setSmartlockEvents(flattenedData);
  };

  useEffect(() => {
    if (selectedEvents.length === 0) {
      return;
    }
    fetchDataForSelectedFacilities();
  }, [selectedFacilities, dayValue, selectedEvents]);

  useEffect(() => {
    fetchEventTypes();
  }, [selectedFacilities]);

  useEffect(() => {
    setSortedColumn("Created On");
    var sortedSmartLockEvents = [...smartlockEvents].sort((a, b) => {
      if (a.createdOn < b.createdOn) return 1;
      if (a.createdOn > b.createdOn) return -1;
      return 0;
    });
    const filteredSmartLockEvents = sortedSmartLockEvents.filter(
      (event) =>
        (event.facilityName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.deviceName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.eventCategory || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.eventType || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.eventDetails || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.createdOn || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (event.unitName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSmartLockEvents(filteredSmartLockEvents);
    setCurrentPage(1);
  }, [smartlockEvents, searchQuery]);

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
      setFilteredSmartLockEvents([...smartlockEvents]);
      return;
    }

    setFilteredSmartLockEvents(
      [...filteredSmartLockEvents].sort((a, b) => {
        const aVal = accessor(a);
        const bVal = accessor(b);
        return newDirection === "asc"
          ? aVal.localeCompare?.(bVal) ?? aVal - bVal
          : bVal.localeCompare?.(aVal) ?? bVal - aVal;
      })
    );
  };

  const columns = [
    {
      key: "facilityName",
      label: "Facility Name",
      accessor: (r) => r.facilityName,
      render: (r) => (
        <div className="w-full flex items-center justify-center">
          <div className="truncate max-w-[32ch]">{r.facilityName}</div>
        </div>
      ),
    },
    {
      key: "deviceName",
      label: "Device Name",
      accessor: (r) => r.deviceName,
      render: (r) => (
        <div className="w-full flex items-center justify-center">
          <div className="truncate max-w-[32ch]">{r.deviceName}</div>
        </div>
      ),
    },
    {
      key: "eventCategory",
      label: "Event Category",
      accessor: (r) => r.eventCategory,
    },
    {
      key: "eventType",
      label: "Event Type",
      accessor: (r) => r.eventType,
    },
    {
      key: "eventDetails",
      label: "Event Details",
      accessor: (r) => r.eventDetails,
    },
    {
      key: "createdOn",
      label: "Created On",
      accessor: (r) => r.createdOn,
    },
  ];

  const handleRowClick = (row) => {
    setSelectedEvent(row);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="w-full px-2">
      {isDetailModalOpen && (
        <DetailModal
          device={selectedEvent}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
      {isEventModalOpen && (
        <ModalContainer
          device={selectedEvents}
          onClose={() => setIsEventModalOpen(false)}
          title={`${selectedEvents.length} Selected Events Details`}
          mainContent={
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="p-1 flex w-full justify-evenly gap-10">
                <button
                  className="py-2 px-5 hover:bg-zinc-100 cursor-pointer text-green-500"
                  onClick={() => setEventModalSelectedEvents(eventTypes)}
                >
                  Select All
                </button>
                <button
                  className="py-2 px-5 hover:bg-zinc-100 cursor-pointer text-red-500"
                  onClick={() => setEventModalSelectedEvents([])}
                >
                  Deselect All
                </button>
              </div>
              <h1 className="w-full text-center text-2xl p-3 underline font-bold">
                CIA Events
              </h1>
              <div className="grid grid-cols-3 gap-2">
                {eventTypes
                  .filter(
                    (event) =>
                      event.eventCategoryName === "Gateway Controller Event"
                  )
                  .map((event, index) => (
                    <div
                      key={index}
                      className={`p-2 flex items-center gap-2 cursor-pointer hover:bg-zinc-200 select-none ${
                        eventModalSelectedEvents.includes(event)
                          ? ""
                          : "text-zinc-300"
                      }`}
                      onClick={() => {
                        if (eventModalSelectedEvents.includes(event))
                          setEventModalSelectedEvents((prevSelected) =>
                            prevSelected.filter((e) => e !== event)
                          );
                        else {
                          setEventModalSelectedEvents((prevSelected) => [
                            ...prevSelected,
                            event,
                          ]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={eventModalSelectedEvents.includes(event)}
                        readOnly
                      ></input>
                      <p>{event.name}</p>
                    </div>
                  ))}
              </div>
              <h1 className="w-full text-center text-2xl p-3 underline font-bold">
                OpenNet Events
              </h1>
              <div className="grid grid-cols-3 gap-2">
                {eventTypes
                  .filter(
                    (event) => event.eventCategoryName === "Edge Router Event"
                  )
                  .map((event, index) => (
                    <div
                      key={index}
                      className={`p-2 flex items-center gap-2 cursor-pointer hover:bg-zinc-200 select-none ${
                        eventModalSelectedEvents.includes(event)
                          ? ""
                          : "text-zinc-300"
                      }`}
                      onClick={() => {
                        if (eventModalSelectedEvents.includes(event))
                          setEventModalSelectedEvents((prevSelected) =>
                            prevSelected.filter((e) => e !== event)
                          );
                        else {
                          setEventModalSelectedEvents((prevSelected) => [
                            ...prevSelected,
                            event,
                          ]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={eventModalSelectedEvents.includes(event)}
                        readOnly
                      ></input>
                      <p>{event.name}</p>
                    </div>
                  ))}
              </div>
            </div>
          }
          responseContent={
            <div className="p-1 flex w-full justify-end gap-5">
              <button
                className="py-2 px-5 hover:bg-zinc-100 cursor-pointer rounded"
                onClick={() => setIsEventModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="py-2 px-5 hover:bg-blue-400 cursor-pointer bg-blue-500 text-white rounded"
                onClick={() => {
                  setSelectedEvents(eventModalSelectedEvents);
                  setIsEventModalOpen(false);
                }}
              >
                Save & Apply
              </button>
            </div>
          }
        />
      )}
      <div className="flex justify-between p-1 items-center">
        <p className="text-left text-sm ml-2 mb-1">
          Events shown from the last
          <select
            className="border rounded-sm mx-2 dark:bg-darkSecondary dark:border-border"
            id="dayValue"
            value={dayValue}
            onChange={(e) => {
              setDayValue(Number(e.target.value));
            }}
          >
            <option value={0.5}>0.5</option>
            <option value={7}>7</option>
            <option value={30}>30</option>
            <option value={90}>90</option>
            <option value={120}>120</option>
            <option value={180}>180</option>
          </select>
          days
        </p>
        <GeneralButton
          text={`${selectedEvents.length} Selected Events`}
          onclick={() => {
            setEventModalSelectedEvents(selectedEvents);
            setIsEventModalOpen(true);
          }}
        />
      </div>

      <div className="h-[73vh] overflow-y-auto text-center">
        <DataTable
          columns={columns}
          data={filteredSmartLockEvents}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          sortDirection={sortDirection}
          sortedColumn={sortedColumn}
          onSort={handleColumnSort}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
          onRowClick={handleRowClick}
        />
      </div>
      <div className="px-2 py-5 mx-1">
        <PaginationFooter
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          items={filteredSmartLockEvents}
        />
      </div>
    </div>
  );
}
