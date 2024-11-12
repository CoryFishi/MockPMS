import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthProvider";
import NotFound from "../components/NotFound";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { IoWarning } from "react-icons/io5";

export default function Dashboard({ darkMode, toggleDarkMode }) {
  const [dashboardMenu, setDashboardMenu] = useState(true);
  const { user } = useAuth();
  const { tokens } = useAuth();
  const [isWarningToastDisplayed, setIsWarningToastDisplayed] = useState(false);
  const navigate = useNavigate();
  const [toaster, setToast] = useState(null);

  useEffect(() => {
    if (tokens > 0) toaster.remove();
    if (isWarningToastDisplayed) return;
    if (tokens < 1 && user) {
      setIsWarningToastDisplayed(true);
      const toastId = toast.custom(
        (t) => (
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5">
            <div className="flex-1 w-0 p-4">
              <div
                className="flex items-center hover:cursor-pointer"
                onClick={() => navigate("/settings") & toast.dismiss(t.id)}
              >
                <div className="flex-shrink-0 flex items-center justify-center">
                  <IoWarning className="text-4xl" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Management Dashboard
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Looks like you have yet to authenticate any facilities.
                    Click <span className="text-blue-500">here</span> to
                    authenticate a facility.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ),
        { duration: 30000 }
      );

      setToast(toastId);
    }
  }, [tokens, isWarningToastDisplayed, navigate]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      {user ? (
        <div>
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <div className="flex flex-1">
            <DashboardLayout dashboardMenu={dashboardMenu} />
          </div>
        </div>
      ) : (
        <div>
          <Navbar
            setDashboardMenu={setDashboardMenu}
            dashboardMenu={dashboardMenu}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <NotFound />
        </div>
      )}
    </div>
  );
}
