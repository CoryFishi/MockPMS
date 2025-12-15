import PaginationFooter from "@components/shared/PaginationFooter";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import DataTable from "@components/shared/DataTable";
import DetailModal from "@components/shared/DetailModal";

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

  const fetchSmartLockEvents = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }

      const response = await axios.get(
        `https://accessevent.${tokenStageKey}insomniaccia${tokenEnvKey}.com/combinedevents/facilities/${facility.id}?uq=&vq=&etq=1&etq=2&etq=3&etq=4&etq=5&etq=6&etq=7&etq=8&etq=9&etq=10&etq=11&etq=12&etq=13&etq=14&etq=15&etq=16&etq=17&etq=18&etq=19&etq=20&etq=21&etq=22&etq=23&etq=24&etq=25&minDate=${pastDayValue}&maxDate=${currentTime}&hideMetadata=true`,
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

  const fetchDataForSelectedFacilities = async () => {
    setSmartlockEvents([]); // Clear existing data
    const fetchPromises = selectedFacilities.map(async (facility) => {
      const smartlockData = await fetchSmartLockEvents(facility);
      return smartlockData;
    });

    const allSmartlockData = await Promise.all(fetchPromises);

    // Flatten the array and update state with all smartlocks
    const flattenedData = allSmartlockData.flat();
    setSmartlockEvents(flattenedData);
  };

  useEffect(() => {
    fetchDataForSelectedFacilities();
  }, [selectedFacilities, dayValue]);

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
