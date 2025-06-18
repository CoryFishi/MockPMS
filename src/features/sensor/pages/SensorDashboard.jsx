import { useEffect, useState } from "react";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BASE_URL = "https://iot.gatawa.com/api";
const USERNAME = import.meta.env.VITE_GATAWA_USERNAME || "";
const PASSWORD = import.meta.env.VITE_GATAWA_PASSWORD || "";

export default function SensorDashboard({ darkMode }) {
  const [user, setUser] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [token, setToken] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [measurementData, setMeasurementData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [neighborData, setNeighborData] = useState([]);
  const [activeTab, setActiveTab] = useState("data");

  useEffect(() => {
    const loginAndFetch = async () => {
      try {
        const loginRes = await axios.post(
          `${BASE_URL}/User/login`,
          new URLSearchParams(
            { username: USERNAME, password: PASSWORD },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json, text/plain, */*",
              },
            }
          )
        );

        const tok = loginRes.data?.token || loginRes.data;
        if (!tok) return;
        setToken(tok);

        const userRes = await axios.get(
          `${BASE_URL}/User/userinfo?token=${tok}`
        );
        setUser(userRes.data);

        const nodeRes = await axios.get(
          `${BASE_URL}/NodeNames/nodeNames?token=${tok}`
        );
        setNodes(nodeRes.data);
      } catch (error) {
        console.error("Login or fetch error:", error);
      }
    };

    loginAndFetch();
  }, []);

  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    setShowModal(true);

    try {
      const measurementRes = await axios.get(
        `${BASE_URL}/Measdata/weekdatapoints?token=${token}&node=${node.name_id}&meastype=55`
      );

      const sortedData = measurementRes.data
        .filter((p) => typeof p.measurement_value === "number")
        .sort((a, b) => new Date(a.measured_time) - new Date(b.measured_time))
        .slice(-25);
      setMeasurementData(sortedData);

      const neighborRes = await axios.get(
        `${BASE_URL}/NodeNames/getDiagnosticsPath?token=${token}&node_id=${
          node.node_id
        }&network_id=${node.network_id}&reqRand=${Math.random()}`
      );

      setNeighborData(neighborRes.data);
    } catch (error) {
      console.error("Error fetching node data:", error);
      setMeasurementData([{ error: "Failed to load measurement data." }]);
      setNeighborData([{ error: "Failed to load neighbor data." }]);
    }
  };

  return (
    <div className="overflow-auto h-full p-6 dark:text-white dark:bg-darkPrimary flex flex-col gap-1">
      <h1 className="text-xl font-bold mb-2">Sensor Dashboard</h1>
      {user && (
        <div className="mb-2 border p-4 rounded dark:border-border">
          <h2 className="text-lg font-semibold">User Info</h2>
          <p>
            <strong>Full Name:</strong> {user.fullname}
          </p>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Timezone:</strong> {user.timezone}
          </p>
          <p>
            <strong>Company:</strong> {user.company_id}
          </p>
        </div>
      )}

      <h2 className="text-lg font-semibold">Gateways</h2>
      {nodes.length === 0 ? (
        <p>Loading gateways...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
          {[...nodes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((node) => node.is_gateway === "1")
            .map((node) => (
              <div
                key={node.name_id}
                className="p-4 border rounded shadow dark:border-border"
              >
                <h3 className="text-md font-bold">{node.name}</h3>
                <p className="text-sm text-zinc-400 mb-1">
                  {node.description || "No description"}
                </p>
                <p>
                  <strong>Voltage:</strong> {node.voltage} V
                </p>
                <p>
                  <strong>Last Access:</strong> {node.last_access_time}
                </p>
                <p>
                  <strong>Location:</strong> {node.location || "N/A"}
                </p>
                <p>
                  <strong>Type:</strong>{" "}
                  {node.is_gateway === "1" ? "Gateway" : "Sensor"}
                </p>
                <p className="text-xs text-zinc-500">Node ID: {node.node_id}</p>
              </div>
            ))}
        </div>
      )}

      <h2 className="text-lg font-semibold">Nodes</h2>
      {nodes.length === 0 ? (
        <p>Loading nodes...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
          {[...nodes]
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((node) => node.is_gateway !== "1")
            .map((node) => (
              <div
                key={node.name_id}
                className="p-4 border rounded shadow bg-darksecondary dark:border-border cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => handleNodeClick(node)}
              >
                <h3 className="text-md font-bold">{node.name}</h3>
                <p className="text-sm text-zinc-400 mb-1">
                  {node.description || "No description"}
                </p>
                <p>
                  <strong>Voltage:</strong> {node.voltage} V
                </p>
                <p>
                  <strong>Last Access:</strong> {node.last_access_time}
                </p>
                <p>
                  <strong>Location:</strong> {node.location || "N/A"}
                </p>
                <p>
                  <strong>Type:</strong>{" "}
                  {node.is_gateway === "1" ? "Gateway" : "Sensor"}
                </p>
                <p className="text-xs text-zinc-500">Node ID: {node.node_id}</p>
              </div>
            ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-xl relative flex flex-col gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-5 text-2xl font-bold text-zinc-600 dark:text-zinc-300 hover:text-red-500 cursor-pointer"
            >
              ×
            </button>
            <h2 className="text-lg font-bold">{selectedNode?.name}</h2>
            {activeTab === "data" ? (
              measurementData.length > 0 && !measurementData[0].error ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={measurementData}>
                    <CartesianGrid
                      stroke={darkMode ? "#444" : "#ccc"}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="measured_time"
                      tickFormatter={(t) => t.split(" ")[1]}
                      tick={{ fill: darkMode ? "#fff" : "#000" }}
                    />
                    <YAxis tick={{ fill: darkMode ? "#fff" : "#000" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? "#1e1e1e" : "#fff",
                        color: darkMode ? "#fff" : "#000",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="measurement_value"
                      stroke={darkMode ? "#00eaff" : "#007acc"}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-red-500">No measurement data found.</p>
              )
            ) : (
              <div className="text-sm p-1 flex flex-col gap-1">
                {neighborData.length > 0 ? (
                  neighborData.map((n, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">{n.name}</span>
                      <span>→</span>
                      <span className="text-zinc-400">
                        RSSI: {n.rssi_dbm} dBm
                      </span>
                      <span className="text-zinc-500">
                        Quality: {n.nexthop_quality}, Power: {n.radio_power}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-red-500">No neighbor path data found.</p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("data")}
                className={`px-3 py-1 rounded cursor-pointer ${
                  activeTab === "data"
                    ? "bg-blue-600 hover:bg-blue-800 text-white"
                    : "bg-zinc-700 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                Measurement Data
              </button>
              <button
                onClick={() => setActiveTab("path")}
                className={`px-3 py-1 rounded cursor-pointer ${
                  activeTab === "path"
                    ? "bg-blue-600 hover:bg-blue-800 text-white"
                    : "bg-zinc-700 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                Neighbor Path
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
