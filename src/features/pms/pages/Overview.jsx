import { RiDoorLockFill } from "react-icons/ri";
import { useAuth } from "@context/AuthProvider";
import axios from "axios";
import { CiCircleInfo } from "react-icons/ci";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdArrowDropDown } from "react-icons/md";
import { BiInfoCircle } from "react-icons/bi";
import { IoInformationCircle } from "react-icons/io5";

export default function Overview({
  currentFacilityName = { currentFacilityName },
}) {
  const { currentFacility } = useAuth();
  const [actiongroups, setActiongroups] = useState([]);
  const [emergency, setEmergency] = useState(false);
  const [lockdown, setLockdown] = useState(false);
  const [status, setStatus] = useState(false);
  const [devices, setDevices] = useState([]);
  const [accessPoints, setAccessPoints] = useState([]);
  const [smartlocks, setSmartlocks] = useState([]);

  const okCount = smartlocks.filter((s) => s.overallStatus == "ok").length || 0;
  const warningCount =
    smartlocks.filter((s) => s.overallStatus == "warning").length || 0;
  const errorCount =
    smartlocks.filter((s) => s.overallStatus == "error").length || 0;
  const offlineCount =
    smartlocks.filter((s) => s.isDeviceOffline == true).length || 0;

  const getActiongroups = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/actiongroups/manual`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(function (response) {
        setActiongroups(response.data);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };

  const getCIA = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const emergencyConfig = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/emergency`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(emergencyConfig)
      .then(function (response) {
        setEmergency(response.data);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
    const lockdownConfig = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/lockdown`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(lockdownConfig)
      .then(function (response) {
        setLockdown(response.data);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
    const devicesConfig = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/devices`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(devicesConfig)
      .then(function (response) {
        setDevices(response.data);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };

  const getStatus = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const config = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/status`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(function (response) {
        setStatus(response.data);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };

  const getOpenNet = async () => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const accesspointsConfig = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/edgerouterplatformdevicesstatus`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(accesspointsConfig)
      .then(function (response) {
        setAccessPoints(response.data);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
    const smartlocksConfig = {
      method: "get",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/smartlockstatus`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(smartlocksConfig)
      .then(function (response) {
        setSmartlocks(response.data || []);
        return response;
      })
      .catch(function (error) {
        throw error;
      });
  };

  const handleOpen = async (a) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const config = {
      method: "post",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/actiongroups/${a.id}/open`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(function (response) {
        toast.success(a.name + " initiated open!");
      })
      .catch(function (error) {
        throw error;
      });
  };

  const handleHold = async (a) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const config = {
      method: "post",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/actiongroups/${a.id}/hold`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(function (response) {
        toast.success(a.name + " initiated hold!");
      })
      .catch(function (error) {
        throw error;
      });
  };

  const handleClose = async (a) => {
    var tokenStageKey = "";
    var tokenEnvKey = "";
    if (currentFacility.environment === "cia-stg-1.aws.") {
      tokenStageKey = "cia-stg-1.aws.";
    } else {
      tokenEnvKey = currentFacility.environment;
    }
    const config = {
      method: "post",
      url: `https://accesscontrol.${tokenStageKey}insomniaccia${tokenEnvKey}.com/facilities/${currentFacility.id}/actiongroups/${a.id}/close`,
      headers: {
        Authorization: "Bearer " + currentFacility?.token?.access_token,
        accept: "application/json",
        "api-version": "2.0",
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(function (response) {
        toast.success(a.name + " initiated close!");
      })
      .catch(function (error) {
        throw error;
      });
  };

  useEffect(() => {
    getActiongroups();
    getCIA();
    getStatus();
    getOpenNet();
  }, []);

  return (
    <div
      className={`relative overflow-auto h-full dark:text-white dark:bg-darkPrimary`}
    >
      {/* Page Header */}
      <div className="flex h-12 bg-gray-200 items-center dark:border-border dark:bg-darkNavPrimary">
        <div className="ml-5 flex items-center text-sm">
          <RiDoorLockFill className="text-lg" />
          &ensp; Overview | {currentFacilityName}
        </div>
      </div>
      <div className="w-full px-5 flex flex-col rounded-lg h-fit gap-2">
        {/* Action Groups */}
        <h2 className="flex items-center">
          <span className="text-2xl">
            <MdArrowDropDown />
          </span>
          CIA
        </h2>
        <div className="w-full flex flex-col">
          <div
            className={`flex flex-col w-full p-3 border rounded ${
              status.gatewayControllerPlatformOverallStatus === "error"
                ? "border-red-500"
                : status.gatewayControllerPlatformOverallStatus === "warning" &&
                  "border-yellow-500"
            }`}
          >
            {status.gatewayControllerPlatformOverallStatus !== "ok" && (
              <h1
                className={`w-full pb-2 text-center ${
                  status.gatewayControllerPlatformOverallStatus === "error"
                    ? "text-red-500"
                    : status.gatewayControllerPlatformOverallStatus ===
                        "warning" && "text-yellow-500"
                }`}
              >
                {status.gatewayControllerPlatformOverallStatusMessage}
              </h1>
            )}
            <div className="flex justify-between">
              <div className="w-2/7 flex items-center justify-center">
                <div
                  className={`flex w-48 h-48 rounded-full items-center justify-center center bg-green-500 ${
                    status.gatewayControllerPlatformOverallStatus === "error"
                      ? "bg-red-500"
                      : status.gatewayControllerPlatformOverallStatus ===
                          "warning" && "bg-yellow-500"
                  }`}
                >
                  <div className="w-40 h-40 bg-white dark:bg-darkPrimary rounded-full flex flex-col items-center justify-center">
                    <h2 className="text-center">
                      Gateway <br />
                      <span className="text-sm">Platform</span>
                    </h2>
                  </div>
                </div>
              </div>
              <div className="w-1/3 gap-1 flex flex-col max-h-48 overflow-y-auto">
                {devices.map((d, index) => {
                  return (
                    <div className="p-1" key={index}>
                      <h2 className="flex items-center gap-2">
                        <span
                          className={`${
                            d.status?.isOffline
                              ? "text-red-500"
                              : "text-green-500"
                          } ${!d.isPaired && "text-yellow-500"}`}
                        >
                          <BiInfoCircle />
                        </span>
                        {d.name}
                      </h2>
                    </div>
                  );
                })}
              </div>
              <div className="w-1/3 flex flex-col gap-2 max-h-48 overflow-y-auto p-2">
                {actiongroups.map((a, index) => {
                  return (
                    <div
                      className="bg-zinc-200 dark:bg-darkNavSecondary rounded-lg flex flex-col w-full shadow-md"
                      key={index}
                    >
                      <div className="flex items-center gap-2 pt-2 px-5">
                        <CiCircleInfo />
                        <span className="font-medium">
                          {a.name || "No Name"}
                        </span>
                      </div>
                      <div className="flex items-center w-full">
                        <button
                          className="text-green-700 font-bold text-xs w-1/3 cursor-pointer p-3 hover:bg-gray-300 rounded-bl-lg"
                          onClick={() => handleOpen(a)}
                        >
                          OPEN
                        </button>
                        <button
                          className="text-blue-700 font-bold text-xs w-1/3 cursor-pointer p-3 hover:bg-gray-300"
                          onClick={() => handleHold(a)}
                        >
                          HOLD
                        </button>
                        <button
                          className="text-red-700 font-bold text-xs cursor-pointer w-1/3 p-3 hover:bg-gray-300 rounded-br-lg"
                          onClick={() => handleClose(a)}
                        >
                          CLOSE
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="bg-zinc-200 dark:bg-darkNavSecondary rounded-lg flex flex-col w-full shadow-md">
                  <div className="flex items-center gap-2 pt-2 px-5">
                    <CiCircleInfo />
                    <span className="font-medium">Emergency Mode</span>
                  </div>{" "}
                  <button
                    className={`w-full hover:bg-zinc-600 p-1 rounded-b-lg cursor-pointer ${
                      emergency ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {emergency ? "Enabled" : "Disabled"}
                  </button>
                </div>
                <div className="bg-zinc-200 dark:bg-darkNavSecondary rounded-lg flex flex-col w-full shadow-md">
                  <div className="flex items-center gap-2 pt-2 px-5">
                    <CiCircleInfo />
                    <span className="font-medium">Lockdown Mode</span>
                  </div>
                  <button
                    className={`w-full hover:bg-zinc-600 p-1 rounded-b-lg cursor-pointer ${
                      lockdown ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {lockdown ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h2 className="flex items-center">
          <span className="text-2xl">
            <MdArrowDropDown />
          </span>
          SmartLock
        </h2>
        <div className="w-full flex flex-col">
          <div
            className={`flex flex-col w-full p-3 border rounded ${
              status.edgeRouterPlatformOverallStatus === "error"
                ? "border-red-500"
                : status.edgeRouterPlatformOverallStatus === "warning" &&
                  "border-yellow-500"
            }`}
          >
            {status.edgeRouterPlatformOverallStatus !== "ok" && (
              <h1
                className={`w-full pb-2 text-center ${
                  status.edgeRouterPlatformOverallStatus === "error"
                    ? "text-red-500"
                    : status.edgeRouterPlatformOverallStatus === "warning" &&
                      "text-yellow-500"
                }`}
              >
                {status.edgeRouterPlatformOverallStatusMessage}
              </h1>
            )}
            <div className="flex justify-between">
              <div className="w-2/7 flex items-center justify-center">
                <div
                  className={`flex w-48 h-48 rounded-full items-center justify-center center bg-green-500 ${
                    status.edgeRouterPlatformOverallStatus === "error"
                      ? "bg-red-500"
                      : status.edgeRouterPlatformOverallStatus === "warning" &&
                        "bg-yellow-500"
                  }`}
                >
                  <div className="w-40 h-40 bg-white dark:bg-darkPrimary rounded-full flex flex-col items-center justify-center">
                    <h2 className="text-center">
                      OpenNet <br />
                      <span className="text-sm">Platform</span>
                    </h2>
                  </div>
                </div>
              </div>
              <div className="w-1/3 gap-1 flex flex-col max-h-48 overflow-y-auto">
                {accessPoints.map((d, index) => {
                  return (
                    <div className="p-1" key={index}>
                      <h2 className="flex items-center gap-2">
                        <span
                          className={`${
                            d.isDeviceOffline
                              ? "text-red-500"
                              : "text-green-500"
                          } ${!d.isDevicePaired && "text-yellow-500"}`}
                        >
                          <BiInfoCircle />
                        </span>
                        {d.name}
                      </h2>
                    </div>
                  );
                })}
              </div>
              <div className="w-1/3 flex flex-col gap-2 max-h-48 overflow-y-auto p-2">
                <div>{smartlocks.length} Total SmartLocks</div>
                <div className="flex items-center gap-2 text-green-500">
                  <IoInformationCircle />
                  {okCount} Okay
                </div>
                <div className="flex items-center gap-2 text-yellow-500">
                  <IoInformationCircle />
                  {warningCount} Warning
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <IoInformationCircle />
                  {errorCount} Error
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <IoInformationCircle />
                  {offlineCount} Offline
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
