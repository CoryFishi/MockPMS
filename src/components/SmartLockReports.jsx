import axios from "axios";
import toast from "react-hot-toast";
import React, { useEffect, useRef, useState } from "react";
import { FaLock } from "react-icons/fa";
import AllSmartLocksReport from "./reports/AllSmartLocksReport";
import AllEdgeRoutersReport from "./reports/AllEdgeRoutersReport";
import AllAccessPointsReport from "./reports/AllAccessPointsReport";
import { useAuth } from "../context/AuthProvider";
import AllSmartLocksEventsReport from "./reports/AllSmartLockEventsReport";
import AllSmartLockOnlineTimeReport from "./reports/AllSmartLockOnlineTimeReport";
import ExtendedHistoryReport from "./reports/ExtendedHistoryReport";

export default function SmartLockReports({}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSelectedFacilities, setNewSelectedFacilities] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [facilitiesWithBearers, setFacilitiesWithBearers] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [openPage, setOpenPage] = useState("AllSmartLocksReport");
  const [reportSearch, setReportSearch] = useState(false);
  const { selectedTokens } = useAuth();
  const modalRef = useRef(null);

  const [pageLoadDateTime, setPageLoadDateTime] = useState(
    new Date().toLocaleString()
  );

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

  // Function to select all selected facilities
  const selectAllFacilities = () => {
    setReportSearch(false);

    const allSelection = facilitiesWithBearers.map((facility) => facility);
    setNewSelectedFacilities(allSelection);
  };

  // Function to deselect all selected facilities
  const deselectAllFacilities = () => {
    setReportSearch(false);

    setNewSelectedFacilities([]);
  };

  // Function to get a bearer token for each facility
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

  // Facility dropdown toggle
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Facility Selection handler
  const handleFacilitySelection = (e, facility) => {
    setReportSearch(false);
    if (e.target.checked) {
      setNewSelectedFacilities((prev) => [...prev, facility]);
    } else {
      setNewSelectedFacilities((prev) =>
        prev.filter((item) => item !== facility)
      );
    }
  };
  // Get bearer tokens prior to creating rows/cards
  useEffect(() => {
    const fetchFacilitiesWithBearers = async () => {
      const updatedFacilities = await Promise.all(
        selectedTokens.map(async (facility) => {
          const bearer = await fetchBearerToken(facility);
          return { ...facility, bearer };
        })
      );
      setFacilitiesWithBearers(updatedFacilities);
      setFilteredFacilities(updatedFacilities);
    };

    // Initial fetch
    fetchFacilitiesWithBearers();
  }, [selectedTokens]);
  // Set all facilities as selected by default
  useEffect(() => {
    const initialSelection = facilitiesWithBearers.map((facility) => facility);
    setNewSelectedFacilities(initialSelection);
  }, [facilitiesWithBearers]);

  return (
    <div className="overflow-auto h-full dark:text-white dark:bg-darkPrimary text-center  mb-14">
      {/* tab title */}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <FaLock className="text-lg" />
          &ensp; SmartLock Reports
        </div>
      </div>
      <p className="text-sm dark:text-white text-left">{pageLoadDateTime}</p>
      <div className="mt-5 mb-2 flex items-center justify-end text-center mx-5">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border p-2 w-full dark:bg-darkNavSecondary rounded-sm dark:border-border"
        />
        <select
          name="report"
          id="report"
          className="ml-2 w-96 border rounded-sm dark:bg-darkNavSecondary dark:border-border text-black dark:text-white p-[10.5px]"
          onChange={(e) => setOpenPage(e.target.value) & setReportSearch(false)}
        >
          <option value="AllSmartLocksReport">All SmartLocks</option>
          <option value="AllEdgeRoutersReport">All EdgeRouters</option>
          <option value="AllAccessPointsReport">All AccessPoints</option>
          <option value="AllSmartLockEventsReport">SmartLock Events</option>
          <option value="AllSmartLockOnlineTimeReport">
            SmartLock Online Time
          </option>
          <option value="ExtendedReport">Extended Report</option>
        </select>
        <div className="ml-2 relative inline-block w-96" ref={modalRef}>
          <button
            onClick={toggleDropdown}
            className="w-full border rounded-sm dark:bg-darkNavSecondary dark:border-border text-black dark:text-white p-2"
          >
            {newSelectedFacilities.length} facilities selected
          </button>

          {isOpen && (
            <div className="absolute mt-1 w-full bg-white dark:bg-darkNavSecondary border border-gray-300 dark:border-border rounded-lg shadow-lg p-2 z-50 max-h-60 overflow-y-auto">
              <div className="w-full text-white text-left px-1 justify-between flex">
                <button
                  className="text-green-400"
                  onClick={() => selectAllFacilities()}
                >
                  Select all
                </button>
                <button
                  className="text-yellow-400"
                  onClick={() => deselectAllFacilities()}
                >
                  Deselect all
                </button>
              </div>
              {facilitiesWithBearers.map((facility) => (
                <label key={facility.api} className="flex text-left gap-2 p-2">
                  <input
                    type="checkbox"
                    value={facility.api}
                    checked={newSelectedFacilities.includes(facility)}
                    onChange={(e) => handleFacilitySelection(e, facility)}
                    className="form-checkbox text-black dark:text-white"
                  />
                  <span>{facility.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Search Button */}
        <button
          className="bg-green-500 text-white p-1 py-2 rounded-sm hover:bg-green-600 ml-3 w-44 font-bold"
          onClick={() => setReportSearch(true)}
        >
          Search
        </button>
      </div>
      {reportSearch === false && <div>Choose and search a report...</div>}
      {openPage === "AllSmartLocksReport" && reportSearch === true && (
        <AllSmartLocksReport
          selectedFacilities={newSelectedFacilities}
          searchQuery={searchQuery}
        />
      )}
      {openPage === "AllEdgeRoutersReport" && reportSearch === true && (
        <AllEdgeRoutersReport
          selectedFacilities={newSelectedFacilities}
          searchQuery={searchQuery}
        />
      )}
      {openPage === "AllAccessPointsReport" && reportSearch === true && (
        <AllAccessPointsReport
          selectedFacilities={newSelectedFacilities}
          searchQuery={searchQuery}
        />
      )}
      {openPage === "AllSmartLockEventsReport" && reportSearch === true && (
        <AllSmartLocksEventsReport
          selectedFacilities={newSelectedFacilities}
          searchQuery={searchQuery}
        />
      )}
      {openPage === "AllSmartLockOnlineTimeReport" && reportSearch === true && (
        <AllSmartLockOnlineTimeReport
          selectedFacilities={newSelectedFacilities}
          searchQuery={searchQuery}
        />
      )}
      {openPage === "ExtendedReport" && reportSearch === true && (
        <ExtendedHistoryReport
          selectedFacilities={newSelectedFacilities}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
}
