import { useState } from "react";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import NotFound from "../components/NotFound";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function UserSettings({ darkMode, toggleDarkMode }) {
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      navigate("/login");
      setTokens([]);
      setCurrentFacility({});
      setFavoriteTokens([]);
      setSelectedTokens([]);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword1 !== newPassword2) {
      setError("Passwords do not match.");
      return;
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword1,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password changed successfully!");
      setNewPassword1("");
      setNewPassword2("");
    }
  };

  return (
    <div className="dark:text-white dark:bg-darkPrimary h-screen w-screen flex flex-col overflow-x-hidden overflow-hidden font-roboto">
      {user ? (
        <div>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <div className="w-full h-full px-5 flex flex-col rounded-lg overflow-y-auto">
            <div className="flex flex-col gap-5 mt-2 text-center">
              <div className="flex flex-col justify-center items-center text-center h-full">
                <div className="flex flex-col items-center justify-center text-center max-w-5xl">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword1}
                    onChange={(e) => setNewPassword1(e.target.value)}
                    className="text-black h-11 rounded m-2"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    className="text-black h-11 rounded m-2"
                  />
                  <button
                    className="bg-gray-100 dark:bg-darkSecondary m-1 rounded text-black dark:text-white p-3 hover:text-slate-400 hover:dark:text-slate-400 hover:cursor-pointer"
                    onClick={() => handlePasswordChange()}
                  >
                    Change Password
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <div>Email: {user?.email}</div>
                <div>Phone: {user.phone}</div>
                <div>Role: {role}</div>
                <div>Last Sign-In: {user.last_sign_in_at}</div>
              </div>
              <button
                className="w-96 bg-gray-100 dark:bg-darkSecondary m-1 rounded text-black dark:text-white p-3 hover:text-slate-400 hover:dark:text-slate-400 hover:cursor-pointer"
                onClick={() => handleLogout()}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <NotFound />
        </div>
      )}
    </div>
  );
}
