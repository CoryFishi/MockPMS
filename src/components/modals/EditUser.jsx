import axios from "axios";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../supabaseClient";

export default function EditUser({ setIsEditUserModalOpen, selectedUser }) {
  const { user, currentFacility } = useAuth();
  const [newUserData, setNewUserData] = useState(selectedUser);

  return (
    // Background Filter
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded shadow-lg dark:bg-darkPrimary">
        {/* Header Container */}
        <div className="px-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <h2 className="mx-2 text-lg font-bold text-center items-center">
              Editing user {selectedUser.user_id}
            </h2>
          </div>
        </div>
        {/* Content Container */}
        <div className="px-5 py-3">
          <label className="block mb-2">Email:</label>
          <h1 className="ml-2">{newUserData.email || "No email present"}</h1>
          <label className="block my-2">Created On:</label>
          <h1 className="ml-2">{newUserData.created_at || "Never created"}</h1>
          <label className="block my-2">Role:</label>
          <select
            value={newUserData.role}
            className="border border-gray-300 rounded px-3 py-2 w-full dark:bg-darkSecondary dark:border-border"
            onChange={(e) =>
              setNewUserData((prevData) => ({
                ...prevData,
                role: e.target.value,
              }))
            }
          >
            <option value="admin">admin</option>
            <option value="cae">cae</option>
            <option value="qa">qa</option>
            <option value="user">user</option>
          </select>
          <label className="block my-2">Current Facility:</label>
          <div className="flex justify-between">
            <h1 className="ml-2">
              {newUserData.curent_facility?.name || "No facility selected"}
            </h1>
            <div>
              <button>Edit</button>
              {newUserData.current_facility.length > 0 && (
                <button>Delete</button>
              )}
            </div>
          </div>
          <label className="block my-2">Tokens:</label>
          <div className="border min-h-10 max-h-24 overflow-y-auto">
            {newUserData.tokens.map((token) => (
              <div key={token.api}>{token.api}</div>
            ))}
          </div>
          <label className="block my-2">Favorite Facilities:</label>
          <div className="border min-h-10 max-h-24 overflow-y-auto">
            {newUserData.favorite_tokens.map((token) => (
              <div key={token.api}>{token.api}</div>
            ))}
          </div>
          <label className="block my-2">Selected Facilities:</label>
          <div className="border min-h-10 max-h-24 overflow-y-auto">
            {newUserData.selected_tokens.map((token) => (
              <div key={token.api}>{token.api}</div>
            ))}
          </div>
          {/* Button Container */}
          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-400 px-4 py-2 rounded mr-2 hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={() => setIsEditUserModalOpen(false)}
            >
              Cancel
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
