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
        Facility Report: {facilityDetail.name}
      </h1>

      <p style={{ fontSize: "16px", marginBottom: "20px" }}>
        This is the detailed report for the facility located in{" "}
        {facilityDetail.city}, {facilityDetail.state}. Below, you will find key
        information about the facility, its operational status, and the current
        weather conditions.
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
          Facility Details
        </h2>
        <p>
          <strong>Facility Name:</strong> {facilityDetail.name}
        </p>
        <p>
          <strong>Property Number:</strong> {facilityDetail.propertyNumber}
        </p>
        <p>
          <strong>Address:</strong> {facilityDetail.addressLine1}
          {facilityDetail.addressLine2
            ? `, ${facilityDetail.addressLine2}`
            : ""}
          , {facilityDetail.city}, {facilityDetail.state}{" "}
          {facilityDetail.postalCode}, {facilityDetail.country}
        </p>
        <p>
          <strong>Phone Number:</strong> {facilityDetail.phoneNumber}
        </p>
      </div>

      <div
        style={{
          padding: "15px",
          backgroundColor: "#eaf9ea",
          border: "1px solid #b3d7f2",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ fontSize: "18px", color: "#007bff", marginBottom: "10px" }}
        >
          Current Weather Conditions
        </h2>
        <p>
          <strong>Location:</strong> {currentWeather.location.name},{" "}
          {currentWeather.location.region}, {currentWeather.location.country}
        </p>
        <p>
          <strong>Temperature:</strong> {currentWeather.current.temp_f}°F (
          {currentWeather.current.temp_c}°C)
        </p>
        <p>
          <strong>Condition:</strong> {currentWeather.current.condition.text}{" "}
          <img
            src={currentWeather.current.condition.icon}
            alt="Weather icon"
            style={{ verticalAlign: "middle" }}
          />
        </p>
        <p>
          <strong>Humidity:</strong> {currentWeather.current.humidity}%
        </p>
        <p>
          <strong>Wind:</strong> {currentWeather.current.wind_mph} mph (
          {currentWeather.current.wind_kph} kph) from{" "}
          {currentWeather.current.wind_dir}
        </p>
        <p>
          <strong>Last Updated:</strong> {currentWeather.current.last_updated}
        </p>
      </div>

      <div
        style={{
          padding: "15px",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ fontSize: "18px", color: "#007bff", marginBottom: "10px" }}
        >
          Operational Status
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f4f4f4" }}>
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
      </div>

      <p style={{ fontSize: "14px", color: "#666" }}>
        For more information, please refer to the detailed facility dashboard.
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
