import { supabase } from "../supabaseClient";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { FaExternalLinkAlt, FaCheckCircle } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";

export async function sendFacilityReportEmail(
  user,
  facility,
  edgeRouter,
  accessPoints,
  smartlockSummary,
  facilityDetail,
  currentWeather
) {
  const html = ReactDOMServer.renderToString(
    <tr className="hover:bg-gray-100 dark:hover:bg-darkNavSecondary relative border border-gray-300 dark:border-border">
      <td className="px-4 py-2">
        <div className="flex items-center gap-2 cursor-pointer">
          <button className="text-blue-500">+</button>
          {facility.name}
          <FaExternalLinkAlt
            className="text-blue-300 group-hover:text-blue-500"
            title={
              facility.environment === "cia-stg-1.aws."
                ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`
            }
            onClick={(e) => {
              e.stopPropagation();
              e.prev;
              const baseUrl =
                facility.environment === "cia-stg-1.aws."
                  ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                  : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`;
              window.open(baseUrl, "_blank");
            }}
          />
        </div>
      </td>
      <td className="px-4 py-2" title={edgeRouter?.connectionStatusMessage}>
        <div className="inline-flex items-center gap-1">
          {edgeRouter?.connectionStatus === "error" ? (
            <IoIosWarning className="text-red-500 mr-2" />
          ) : edgeRouter?.connectionStatus === "warning" ? (
            <IoIosWarning className="text-yellow-500 mr-2" />
          ) : (
            <FaCheckCircle className="text-green-500 mr-2" />
          )}
          {edgeRouter?.name}
        </div>
      </td>
      <td
        className="px-4 py-2"
        title={
          Array.isArray(accessPoints)
            ? `${accessPoints
                .filter((ap) => ap.isDeviceOffline === false)
                .map((ap) => ap.name)
                .join(", ")}\n${Math.round(
                (accessPoints.filter((ap) => ap.isDeviceOffline === false)
                  .length /
                  accessPoints.length) *
                  100
              )}% Online`
            : ""
        }
      >
        {Array.isArray(accessPoints)
          ? accessPoints.filter((ap) => ap.isDeviceOffline === false).length
          : 0}
      </td>

      <td
        className="px-4 py-2"
        title={
          Array.isArray(accessPoints)
            ? `${accessPoints
                .filter((ap) => ap.isDeviceOffline === true)
                .map((ap) => ap.name)
                .join(", ")}\n${Math.round(
                (accessPoints.filter((ap) => ap.isDeviceOffline === true)
                  .length /
                  accessPoints.length) *
                  100
              )}% Offline`
            : ""
        }
      >
        {Array.isArray(accessPoints)
          ? accessPoints.filter((ap) => ap.isDeviceOffline === true).length
          : 0}
      </td>

      <td
        className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
        onClick={() => openSmartLockModal("good")}
        title={
          Math.round(
            (smartlockSummary?.okCount /
              (smartlockSummary?.okCount +
                smartlockSummary?.warningCount +
                smartlockSummary?.errorCount)) *
              100
          ) +
          "%" +
          " Okay Status"
        }
      >
        {smartlockSummary?.okCount}
      </td>
      <td
        className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
        onClick={() => openSmartLockModal("warning")}
        title={
          Math.round(
            (smartlockSummary?.warningCount /
              (smartlockSummary?.okCount +
                smartlockSummary?.warningCount +
                smartlockSummary?.errorCount)) *
              100
          ) +
          "%" +
          " Warning Status"
        }
      >
        {smartlockSummary?.warningCount}
      </td>
      <td
        className="px-4 py-2 hover:bg-gray-300 dark:hover:bg-gray-600 hover:cursor-pointer"
        onClick={() => openSmartLockModal("error")}
        title={
          Math.round(
            (smartlockSummary?.errorCount /
              (smartlockSummary?.okCount +
                smartlockSummary?.warningCount +
                smartlockSummary?.errorCount)) *
              100
          ) +
          "%" +
          " Error Status"
        }
      >
        {smartlockSummary?.errorCount}
      </td>
    </tr>
  );

  try {
    const response = await fetch("/.netlify/functions/sendEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.email,
        subject: "Facility Detailed Report",
        html,
      }),
    });

    // Check if response is JSON
    if (response.ok) {
      const data = await response.json();
      console.log("Email sent:", data);
    } else {
      const errorText = await response.text(); // Read error as text
      console.error("Error:", errorText);
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}
