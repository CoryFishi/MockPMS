import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function RegisterComp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      alert("Password reset email sent. Please check your inbox.");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setMessage(null);
    } else if (!data.user) {
      setError(
        "User may already exist. Please check your email to confirm or try logging in."
      );
      setMessage(null);
    } else {
      setMessage(
        "Sign-up successful! Please check your email to confirm. Once confirmed please login."
      );
      setError(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-darkPrimary">
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

      {message && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center dark:text-white z-30">
          <div className="bg-white p-4 rounded-sm shadow-lg max-w-sm w-full dark:bg-darkSecondary">
            <h1 className="font-bold text-center text-3xl">Success!</h1>
            <p className="text-center text-blue-500 mt-3">{message}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-sm w-full hover:cursor-pointer hover:bg-blue-600 hover:scale-105 transition duration-150"
              onClick={() => setMessage(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSignUp}
        className="bg-white dark:bg-darkNavSecondary shadow-lg rounded-lg p-8 max-w-md w-full space-y-4 mb-16"
      >
        <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200 text-center mb-6">
          Sign Up
        </h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-white w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full py-2 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 hover:scale-105 transition duration-150"
        >
          Sign Up
        </button>

        <p className="text-center dark:text-white">
          Already have an account? Sign In{" "}
          <span
            className="text-blue-400 hover:cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Here
          </span>
        </p>
        <p className="text-sm text-center dark:text-white">
          <span
            className="text-blue-400 hover:cursor-pointer"
            onClick={() => handleForgotPassword()}
          >
            Forgot your password?
          </span>
        </p>
      </form>
    </div>
  );
}
