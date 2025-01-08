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
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        color: "#333",
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f4f4f4" }}>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>
            Facility Name
          </th>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>
            Edge Router
          </th>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>
            Online APs
          </th>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>
            Offline APs
          </th>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>
            Okay Status
          </th>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>
            Warning Status
          </th>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>
            Error Status
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
            <a
              href={
                facility.environment === "cia-stg-1.aws."
                  ? `https://portal.${facility.environment}insomniaccia.com/facility/${facility.id}/dashboard`
                  : `https://portal.insomniaccia${facility.environment}.com/facility/${facility.id}/dashboard`
              }
              style={{ color: "#007bff", textDecoration: "none" }}
              target="_blank"
            >
              {facility.name}
            </a>
          </td>
          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
            <span
              style={{
                display: "inline-block",
                marginRight: "8px",
                color:
                  edgeRouter?.connectionStatus === "error"
                    ? "red"
                    : edgeRouter?.connectionStatus === "warning"
                    ? "orange"
                    : "green",
              }}
            >
              &#9679;
            </span>
            {edgeRouter?.name}
          </td>
          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
            {Array.isArray(accessPoints)
              ? accessPoints.filter((ap) => !ap.isDeviceOffline).length
              : 0}
          </td>
          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
            {Array.isArray(accessPoints)
              ? accessPoints.filter((ap) => ap.isDeviceOffline).length
              : 0}
          </td>
          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
            {smartlockSummary?.okCount}
          </td>
          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
            {smartlockSummary?.warningCount}
          </td>
          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
            {smartlockSummary?.errorCount}
          </td>
        </tr>
      </tbody>
    </table>
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
