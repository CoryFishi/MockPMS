import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@app/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    console.log()
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      console.log("Access Token:", access_token);
      console.log("Refresh Token:", refresh_token);
      console.log("Full Hash:", hash);
      if (access_token && refresh_token) {
        setHasSession(true);
        supabase.auth.setSession({ access_token, refresh_token });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  if (!hasSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-900">
        <div className="bg-white dark:bg-zinc-800 shadow-lg rounded-lg p-8 max-w-md w-full space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200 text-center mb-6">
            Invalid or Expired Link
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-center">
            The password reset link is invalid or has expired. Please request
            a new password reset.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-zinc-800 shadow-lg rounded-lg p-8 max-w-md w-full space-y-4 mb-16"
      >
        <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200 text-center mb-6">
          Set a New Password
        </h2>
        {error && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center dark:text-white z-30">
            <div className="bg-white p-4 rounded-sm shadow-lg max-w-sm w-full dark:bg-darkSecondary">
              <h1 className="font-bold text-center text-3xl">Oh no!</h1>
              <p className="text-center text-red-500 mt-3">{error}</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-sm w-full hover:cursor-pointer hover:bg-blue-600 hover:scale-105 transition duration-150"
                onClick={() => setError(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-white w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="w-full py-2 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 hover:scale-105 transition duration-150"
        >
          Update Password
        </button>
        {message && (
          <p className="text-green-500 text-sm text-center">{message}</p>
        )}
      </form>
    </div>
  );
}
