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
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        color: "#333",
        lineHeight: "1.6",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          color: "#444",
          borderBottom: "2px solid #007bff",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}
      >
        Facility Report
      </h1>
      <p style={{ fontSize: "16px", marginBottom: "20px" }}>
        Below is the detailed report for the facility monitoring system. It
        includes information about facility statuses, edge routers, access
        points, and smart locks.
      </p>

      <div
        style={{
          padding: "15px",
          backgroundColor: "#e9f7fe",
          border: "1px solid #b3d7f2",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ fontSize: "18px", color: "#007bff", marginBottom: "10px" }}
        >
          Summary
        </h2>
        <ul style={{ listStyleType: "circle", paddingLeft: "20px" }}>
          <li>Total Facilities: 1</li>
          <li>
            Edge Routers with Issues:{" "}
            {edgeRouter?.connectionStatus === "error" ? "1" : "0"}
          </li>
          <li>
            Total Access Points:{" "}
            {Array.isArray(accessPoints) ? accessPoints.length : 0}
          </li>
          <li>
            Smart Locks with Warnings or Errors:{" "}
            {smartlockSummary?.warningCount + smartlockSummary?.errorCount || 0}
          </li>
        </ul>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "20px",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f4f4f4" }}>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Facility Name
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Edge Router
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Online APs
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Offline APs
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Okay Status
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Warning Status
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Error Status
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
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
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              <span
                style={{
                  color:
                    edgeRouter?.connectionStatus === "error"
                      ? "red"
                      : edgeRouter?.connectionStatus === "warning"
                      ? "orange"
                      : "green",
                }}
              >
                &#9679;
              </span>{" "}
              {edgeRouter?.name}
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {Array.isArray(accessPoints)
                ? accessPoints.filter((ap) => !ap.isDeviceOffline).length
                : 0}
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {Array.isArray(accessPoints)
                ? accessPoints.filter((ap) => ap.isDeviceOffline).length
                : 0}
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {smartlockSummary?.okCount}
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {smartlockSummary?.warningCount}
            </td>
            <td style={{ padding: "10px", border: "1px solid #ddd" }}>
              {smartlockSummary?.errorCount}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: "14px", color: "#666" }}>
        For more information, click on the facility name to view its dashboard.
      </p>
      <p style={{ fontSize: "16px", marginTop: "20px" }}>
        Best regards, <br />
        <strong>Your Monitoring Team</strong>
      </p>
    </div>
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
