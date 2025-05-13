import React from "react";
import ReactDOM from "react-dom/client";
import App from "@app/App.jsx";
import "@app/index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "@context/AuthProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <Router>
      <App />
    </Router>
  </AuthProvider>
);
