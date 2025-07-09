import PropTypes from "prop-types";

SmartLockExport.propTypes = {
  facilitiesInfo: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      edgeRouterStatus: PropTypes.bool.isRequired,
      onlineAccessPointsCount: PropTypes.number.isRequired,
      offlineAccessPointsCount: PropTypes.number.isRequired,
      okCount: PropTypes.number.isRequired,
      warningCount: PropTypes.number.isRequired,
      errorCount: PropTypes.number.isRequired,
      offlineCount: PropTypes.number.isRequired,
      lowestBattery: PropTypes.number.isRequired,
      lowestSignal: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default function SmartLockExport({ facilitiesInfo }) {
  // Export function
  const exportTable = () => {
    // Convert the data to CSV format
    const headers = [
      "Name",
      "Edge Router Status",
      "Online Access Points Count",
      "Offline Access Points Count",
      "Okay SmartLocks",
      "Warning SmartLocks",
      "Error SmartLocks",
      "Offline SmartLocks",
      "Lowest Battery SmartLock",
      "Lowest Signal SmartLock",
    ];
    // Create rows
    const csvRows = [
      headers.join(","), // Add headers to rows
      ...facilitiesInfo.map((facility) =>
        [
          facility.name,
          facility.edgeRouterStatus === true ? "Offline" : "Online",
          facility.onlineAccessPointsCount,
          facility.offlineAccessPointsCount,
          facility.okCount,
          facility.warningCount,
          facility.errorCount,
          facility.offlineCount,
          facility.lowestBattery,
          facility.lowestSignal,
        ].join(",")
      ),
    ];

    // Create a blob from the CSV rows
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create a link to download the file
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "SmartLockFacilities.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    // Export Button
    <p
      className="text-black dark:text-white p-1 py-2 rounded-sm font-bold hover:text-slate-400 dark:hover:text-slate-400 hover:cursor-pointer mr-5"
      onClick={exportTable}
    >
      Export
    </p>
  );
}
