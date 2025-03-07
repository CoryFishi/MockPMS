import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const { setUser, setIsPulled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setIsPulled(false);
      setUser(data.user);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-darkPrimary">
      <form
        onSubmit={handleSignIn}
        className="bg-white dark:bg-darkSecondary shadow-lg rounded-lg p-8 max-w-md w-full space-y-4 mb-16"
      >
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 text-center mb-6">
          Sign In
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
        />

        <button
          type="submit"
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-150"
        >
          Sign In
        </button>

        {error && (
          <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
        )}
        <p className="text-center dark:text-white">
          Don't have an account? Register{" "}
          <span
            className="text-blue-400 hover:cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Here
          </span>
        </p>
      </form>
    </div>
  );
}
