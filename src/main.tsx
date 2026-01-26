import ReactDOM from "react-dom/client";
import App from "@app/App.tsx";
import "@app/index.css";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "@context/AuthProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <Router>
      <App />
    </Router>
  </AuthProvider>
);
