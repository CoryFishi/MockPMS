import { supabase } from "../supabaseClient";

export async function sendFacilityReportEmail(
  facility,
  edgeRouter,
  accessPoints,
  smartlockSummary,
  facilityDetail,
  currentWeather
) {
  const sendEmail = async () => {
    const html = (
      <tr
        style={{
          position: "relative",
          border: "1px solid #ccc",
          cursor: "pointer",
          backgroundColor: "inherit",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor =
            document.body.classList.contains("dark") ? "#1c1c1c" : "#f7f7f7")
        }
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "inherit")}
      >
        <td
          style={{ padding: "8px 16px" }}
          onClick={() => toggleRowExpansion(facility.id)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              style={{ color: "#007BFF" }}
              title={expandedRows.includes(facility.id) ? "Collapse" : "Expand"}
            >
              {expandedRows.includes(facility.id) ? "−" : "+"}
            </button>
            {facility.name}
          </div>
        </td>
        <td
          style={{ padding: "8px 16px" }}
          title={edgeRouter?.connectionStatusMessage}
        >
          <div
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            {edgeRouter?.connectionStatus === "error" ? (
              <IoIosWarning style={{ color: "#FF0000", marginRight: "8px" }} />
            ) : edgeRouter?.connectionStatus === "warning" ? (
              <IoIosWarning style={{ color: "#FFD700", marginRight: "8px" }} />
            ) : (
              <FaCheckCircle style={{ color: "#00FF00", marginRight: "8px" }} />
            )}
            {edgeRouter?.name}
          </div>
        </td>
        <td
          style={{ padding: "8px 16px" }}
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
          style={{ padding: "8px 16px" }}
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
  };
}
