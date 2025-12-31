import { RiTestTubeFill } from "react-icons/ri";
import { useAuth } from "@context/AuthProvider";
import { useState, useRef, useEffect, use } from "react";
import InputBox from "@components/UI/InputBox";
import PaginationFooter from "@components/shared/PaginationFooter";
import DataTable from "@components/shared/DataTable";
import DetailModal from "@components/shared/DetailModal";
import { FaCheckCircle } from "react-icons/fa";
import { RiErrorWarningFill } from "react-icons/ri";
import { IoIosWarning } from "react-icons/io";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function SmartSpaceTester() {
  const { selectedTokens } = useAuth();
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [smartMotionData, setSmartMotionData] = useState([]);
  const [filteredSmartMotion, setFilteredSmartMotion] =
    useState(smartMotionData);
  const [selectedMotion, setSelectedMotion] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [pollingValue, setPollingValue] = useState(5);
  const [lastPollTime, setLastPollTime] = useState(null);

  const modalRef = useRef(null);
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  const [searchQuery, setSearchQuery] = useState("");

  // Close modal if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false); // Close the modal
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

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
      setFilteredSmartMotion([...smartMotionData]);
      return;
    }

    setFilteredSmartMotion(
      [...filteredSmartMotion].sort((a, b) => {
        const aVal = accessor(a);
        const bVal = accessor(b);
        return newDirection === "asc"
          ? aVal.localeCompare?.(bVal) ?? aVal - bVal
          : bVal.localeCompare?.(aVal) ?? bVal - aVal;
      })
    );
  };
  const fetchBearerToken = async (facility) => {
    try {
      var tokenStageKey = "";
      var tokenEnvKey = "";
      if (facility.environment === "cia-stg-1.aws.") {
        tokenStageKey = "cia-stg-1.aws.";
      } else {
        tokenEnvKey = facility.environment;
      }
      const data = {
        grant_type: "password",
        username: facility.api,
        password: facility.apiSecret,
        client_id: facility.client,
        client_secret: facility.clientSecret,
      };

      const response = await axios.post(
        `https://auth.${tokenStageKey}insomniaccia${tokenEnvKey}.com/auth/token`,
        data,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error(`Error fetching token for ${facility.name}:`, error);
      toast.error(`Failed to fetch token for ${facility.name}`);
      return null;
    }
  };

  const fetchInitialSmartMotionData = async (facility) => {
    const bearer = await fetchBearerToken(facility);
    if (!bearer) return;
    const { id, environment } = facility;
    const tokenPrefix =
      environment === "cia-stg-1.aws." ? "cia-stg-1.aws." : "";
    const tokenSuffix = environment === "cia-stg-1.aws." ? "" : environment;
    try {
      const response = await axios.get(
        `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/smartmotionstatus`,
        {
          headers: {
            Authorization: `Bearer ${bearer}`,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const data = response.data;
      const formattedData = data.map((item) => ({
        name: item.name,
        currentSensorState: item.sensorState,
        overallStatusMessage: item.overallStatusMessage,
        overallStatus: item.overallStatus,
        hasDetectedMotion: item.sensorState === "Motion" ? true : false,
        lastUpdateTimestampDisplay: new Date(
          item.lastUpdateTimestamp
        ).toLocaleString(),
      }));
      return formattedData;
    } catch (error) {
      console.error(
        `Error fetching SmartMotion data for ${facility.name}:`,
        error
      );
      toast.error(`Failed to fetch SmartMotion data for ${facility.name}`);
      return [];
    }
  };

  const fetchNewSmartMotionData = async (facility) => {
    const bearer = await fetchBearerToken(facility);
    if (!bearer) return;
    const { id, environment } = facility;
    const tokenPrefix =
      environment === "cia-stg-1.aws." ? "cia-stg-1.aws." : "";
    const tokenSuffix = environment === "cia-stg-1.aws." ? "" : environment;
    try {
      const response = await axios.get(
        `https://accesscontrol.${tokenPrefix}insomniaccia${tokenSuffix}.com/facilities/${id}/smartmotionstatus`,
        {
          headers: {
            Authorization: `Bearer ${bearer}`,
            accept: "application/json",
            "api-version": "2.0",
          },
        }
      );
      const data = response.data;
      const formattedData = data.map((item) => {
        const existingItem = smartMotionData.find(
          (existing) => existing.name === item.name
        );
        return {
          name: item.name,
          currentSensorState: item.sensorState,
          overallStatusMessage: item.overallStatusMessage,
          overallStatus: item.overallStatus,
          hasDetectedMotion:
            existingItem?.hasDetectedMotion === true ||
            item.sensorState === "Motion",
          lastUpdateTimestampDisplay: new Date(
            item.lastUpdateTimestamp
          ).toLocaleString(),
        };
      });
      return formattedData;
    } catch (error) {
      console.error(
        `Error fetching SmartMotion data for ${facility.name}:`,
        error
      );
      toast.error(`Failed to fetch SmartMotion data for ${facility.name}`);
      return [];
    }
  };

  const fetchNewSmartMotionEventData = async (facility) => {
    const bearer = await fetchBearerToken(facility);
    if (!bearer) return;
    const { id, environment } = facility;
    const tokenPrefix =
      environment === "cia-stg-1.aws." ? "cia-stg-1.aws." : "";
    const tokenSuffix = environment === "cia-stg-1.aws." ? "" : environment;
    try {
      const now = Math.floor(Date.now() / 1000);
      const twoMinutesAgo = now - 120;

      const response = await axios.get(
        `https://accessevent.${tokenPrefix}insomniaccia${tokenSuffix}.com/combinedevents/facilities/${facility.id}?uq=&vq=&etq=27&etq=28
        &minDate=${twoMinutesAgo}&maxDate=${now}&hideMetadata=true`,
        {
          headers: {
            Authorization: `Bearer ${bearer}`,
            accept: "application/json",
            "api-version": "3.0",
          },
        }
      );
      const data = response.data;
      for (const event of data) {
        const motion = smartMotionData.find((m) => m.name === event.deviceName);
        if (motion) {
          motion.hasDetectedMotion = true;
        }
      }
    } catch (error) {
      console.error(
        `Error fetching SmartMotion event data for ${facility.name}:`,
        error
      );
      toast.error(
        `Failed to fetch SmartMotion event data for ${facility.name}`
      );
      return [];
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      accessor: (r) => r.name,
      render: (r) => (
        <div className="w-full flex items-center justify-center">
          <div className="truncate max-w-[32ch] flex items-center text-center justify-center">
            {r.name}
          </div>
        </div>
      ),
    },
    {
      key: "sensorState",
      label: "Sensor State",
      accessor: (r) => r.currentSensorState,
      render: (r) => <span>{r.currentSensorState}</span>,
    },
    {
      key: "hasDetectedMotion",
      label: "Detected Motion",
      accessor: (r) => (r.hasDetectedMotion ? "Yes" : "No"),
      render: (r) => {
        const Icon = r.hasDetectedMotion
          ? RiErrorWarningFill
          : RiErrorWarningFill;

        const color = r.hasDetectedMotion ? "text-green-500" : "text-red-500";

        return (
          <div className={`inline-flex items-center gap-2 ${color}`}>
            <Icon className="text-xl" />
            <span className="flex flex-col text-left">
              {r.hasDetectedMotion ? "Yes" : "No"}
            </span>
          </div>
        );
      },
    },
    {
      key: "lastUpdateTimestampDisplay",
      label: "Last Update",
      accessor: (r) => r.lastUpdateTimestampDisplay,
    },
  ];

  const handleRowClick = (row) => {
    setSelectedMotion(row);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    if (!isTesting) {
      setSmartMotionData([]);
      setFilteredSmartMotion([]);
      return;
    }

    const beginPolling = async () => {
      const data = await fetchInitialSmartMotionData(selectedFacility);
      setSmartMotionData(data);
      setFilteredSmartMotion(data);
      setLastPollTime(new Date());
    };

    const refreshSmartMotion = async () => {
      const data = await fetchNewSmartMotionData(selectedFacility);
      fetchNewSmartMotionEventData(selectedFacility);
      setSmartMotionData(data);
      setFilteredSmartMotion(data);
      setLastPollTime(new Date());
    };

    beginPolling();
    const intervalId = setInterval(refreshSmartMotion, pollingValue * 1000);

    return () => clearInterval(intervalId);
  }, [isTesting, pollingValue, selectedFacility]);

  return (
    <div
      className={`h-full dark:text-white dark:bg-zinc-900 relative overflow-auto`}
    >
      {isDetailModalOpen && (
        <DetailModal
          device={selectedMotion}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
      {/* Header */}
      <div className="flex h-12 bg-zinc-200 items-center dark:border-zinc-700 dark:bg-zinc-950">
        <div className="ml-5 flex items-center text-sm">
          <RiTestTubeFill className="text-lg" />
          &ensp; SmartMotion Tester
        </div>
      </div>
      <div className="w-full gap-2 flex p-2 items-center">
        <InputBox
          placeholder="Search reports..."
          value={searchQuery}
          onchange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
        <div className="ml-2 relative inline-block w-96" ref={modalRef}>
          <button
            onClick={toggleDropdown}
            className="w-full border rounded-sm dark:bg-zinc-900 dark:border-zinc-700 text-black dark:text-white p-2 hover:cursor-pointer"
          >
            {selectedFacility ? selectedFacility.name : "Select Facility"}
          </button>
          {isOpen && (
            <div className="absolute mt-1 w-full items-center justify-center text-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg p-2 z-50 max-h-60 overflow-y-auto">
              {selectedTokens.map((facility) => (
                <label
                  key={facility.name}
                  className="flex gap-2 p-2 hover:cursor-pointer w-full text-center items-center justify-center hover:bg-zinc-400 dark:hover:bg-zinc-800 rounded"
                  onClick={() =>
                    setSelectedFacility(facility) & setIsOpen(false)
                  }
                >
                  <span>{facility.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <button
          className={`w-96 border rounded-sm dark:border-zinc-700 text-black dark:text-white p-2 hover:cursor-pointer ${
            isTesting
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } disabled:opacity-50 disabled:hover:cursor-not-allowed`}
          disabled={!selectedFacility}
          onClick={() => setIsTesting(!isTesting)}
          title={
            !selectedFacility
              ? "Select a facility to start testing"
              : isTesting
              ? "Stop Testing"
              : "Start Testing"
          }
        >
          {isTesting ? "Stop Testing" : "Start Testing"}
        </button>
      </div>
      <div className="w-full px-2 flex items-center justify-between mb-2">
        <p className="text-left text-sm ml-2">
          Events pulled every
          <select
            className="border rounded-sm mx-2 dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
            id="secondValue"
            value={pollingValue}
            onChange={(e) => {
              setPollingValue(Number(e.target.value));
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
          </select>
          seconds
        </p>
        <p>
          {lastPollTime
            ? `${lastPollTime.toLocaleTimeString()}`
            : "Never updated"}
        </p>
      </div>
      {isTesting ? (
        <>
          <div className="h-[73vh] overflow-y-auto text-center">
            <DataTable
              columns={columns}
              data={filteredSmartMotion}
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
              items={filteredSmartMotion}
            />
          </div>
        </>
      ) : (
        <div className="text-center mt-10 text-lg">
          SmartMotion testing is currently stopped. Click "Start Testing" to
          begin.
        </div>
      )}
    </div>
  );
}
