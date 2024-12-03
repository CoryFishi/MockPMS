import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  FaTrash,
  FaEye,
  FaPlusCircle,
  FaEdit,
  FaEyeSlash,
} from "react-icons/fa";
import EditCurrentFacility from "./EditCurrentFacility";
import AddToken from "./AddToken";
import AddFavoriteFacility from "./AddFavoriteFacility";
import AddSelectedFacility from "./AddSelectedFacility";
import { data } from "autoprefixer";

export default function EditUser({
  setIsEditUserModalOpen,
  selectedUser,
  setUsers,
}) {
  const [newUserData, setNewUserData] = useState(selectedUser);
  const [viewKey, setViewKey] = useState(null);
  const [isEditCurrentFacilityModalOpen, setIsEditCurrentFacilityModalOpen] =
    useState(false);
  const [isAddTokenFacilityModalOpen, setIsAddTokenFacilityModalOpen] =
    useState(false);
  const [isAddFavoriteFacilityModalOpen, setIsAddFavoriteFacilityModalOpen] =
    useState(false);
  const [isAddSelectedFacilityModalOpen, setIsAddSelectedFacilityModalOpen] =
    useState(false);
  const [roles, setRoles] = useState([]);

  const getRoles = async () => {
    let { data, error } = await supabase.from("roles").select("role_name");
    setRoles(data);
  };

  const updateUserData = async () => {
    try {
      const { data, error } = await supabase
        .from("user_data")
        .update(newUserData)
        .eq("user_id", newUserData.user_id);

      if (error) {
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  const handleDeleteToken = (api) => {
    setNewUserData((prevState) => ({
      ...prevState,
      tokens: prevState.tokens.filter((token) => token.api !== api),
    }));
  };

  const handleDeleteFavoriteToken = (id) => {
    setNewUserData((prevState) => ({
      ...prevState,
      favorite_tokens: prevState.favorite_tokens.filter(
        (token) => token.id !== id
      ),
    }));
  };

  const handleDeleteSelectedToken = (id) => {
    setNewUserData((prevState) => ({
      ...prevState,
      selected_tokens: prevState.selected_tokens.filter(
        (token) => token.id !== id
      ),
    }));
  };

  const handleTokenView = (token) => {
    if (token === viewKey) setViewKey(null);
    else setViewKey(token);
  };

  useEffect(() => {
    getRoles();
  }, []);

  return (
    // Background Filter
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {isEditCurrentFacilityModalOpen && (
        <EditCurrentFacility
          setIsEditCurrentFacilityModalOpen={setIsEditCurrentFacilityModalOpen}
          newUserData={newUserData}
          setNewUserData={setNewUserData}
        />
      )}
      {isAddTokenFacilityModalOpen && (
        <AddToken
          setIsAddTokenFacilityModalOpen={setIsAddTokenFacilityModalOpen}
          setNewUserData={setNewUserData}
        />
      )}
      {isAddFavoriteFacilityModalOpen && (
        <AddFavoriteFacility
          setIsAddFavoriteFacilityModalOpen={setIsAddFavoriteFacilityModalOpen}
          setNewUserData={setNewUserData}
        />
      )}
      {isAddSelectedFacilityModalOpen && (
        <AddSelectedFacility
          setIsAddSelectedFacilityModalOpen={setIsAddSelectedFacilityModalOpen}
          setNewUserData={setNewUserData}
        />
      )}
      {/* Modal Container */}
      <div className="bg-white rounded shadow-lg dark:bg-darkPrimary">
        {/* Header Container */}
        <div className="px-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <h2 className="mx-2 text-lg font-bold text-center items-center flex justify-center gap-2">
              <FaEdit /> Editing user {selectedUser.user_id}
            </h2>
          </div>
        </div>
        {/* Content Container */}
        <div className="px-5 py-3">
          {/* Email */}
          <label className="block mb-2 font-bold">Email:</label>
          <h1 className="ml-2">
            {newUserData.user_email || "No email present"}
          </h1>
          {/* Created On */}
          <label className="block my-2 font-bold">Created On:</label>
          <h1 className="ml-2">{newUserData.created_at || "Never created"}</h1>
          {/* Updated On */}
          <label className="block my-2 font-bold">Last Update:</label>
          <h1 className="ml-2">
            {newUserData.last_update_at || "Never updated"}
          </h1>
          {/* Role */}
          <label className="block my-2 font-bold">Role:</label>
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
            {Object.values(roles).map((role, index) => (
              <option key={index} value={role.role_name}>
                {role.role_name}
              </option>
            ))}
          </select>
          {/* Current Facility */}
          <label className="block my-2 font-bold">Current Facility:</label>
          <div className="flex justify-between">
            <h1>
              {newUserData.current_facility?.name || "No facility selected"}
            </h1>
            <div className="flex gap-1">
              <button
                className="hover:bg-gray-200 rounded px-1"
                onClick={() => setIsEditCurrentFacilityModalOpen(true)}
              >
                {newUserData.current_facility.name ? (
                  <FaEdit className="text-gray-500" />
                ) : (
                  <FaPlusCircle className="text-gray-500" />
                )}
              </button>
              {newUserData.current_facility.name && (
                <button
                  className="hover:bg-gray-200 rounded px-1"
                  onClick={() =>
                    setNewUserData((prevData) => ({
                      ...prevData,
                      current_facility: {},
                    }))
                  }
                >
                  <FaTrash className="text-gray-500" />
                </button>
              )}
            </div>
          </div>
          {/* Tokens */}
          <div className="flex justify-between mt-4 mb-2">
            <label className="block font-bold">Tokens:</label>
            <button
              className="hover:bg-gray-200 rounded px-1"
              onClick={() => setIsAddTokenFacilityModalOpen(true)}
            >
              <FaPlusCircle className="text-gray-500" />
            </button>
          </div>
          <div className="min-h-10 max-h-24 overflow-y-auto">
            {newUserData.tokens.map((token, index) => (
              <div
                key={index}
                className="border-collapse dark:border-border border-dotted border justify-between flex flex-col w-full"
              >
                <div className="justify-between flex w-full">
                  <p>
                    {token.environment === ""
                      ? "Production"
                      : token.environment === "-dev"
                      ? "Development"
                      : token.environment === "-qa"
                      ? "QA"
                      : token.environment === "cia-stg-1.aws."
                      ? "Staging"
                      : token.environment}{" "}
                    - {token.client}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="hover:bg-gray-200 rounded px-1"
                      onClick={() => handleTokenView(token.api)}
                    >
                      {viewKey === token.api ? (
                        <FaEyeSlash className="text-gray-500" />
                      ) : (
                        <FaEye className="text-gray-500" />
                      )}
                    </button>
                    <button
                      className="hover:bg-gray-200 rounded px-1"
                      onClick={() => handleDeleteToken(token.api)}
                    >
                      <FaTrash className="text-gray-500" />
                    </button>
                  </div>
                </div>
                {viewKey === token.api && (
                  <div className="flex flex-col">
                    <p>
                      <span className="font-bold">API - </span>
                      {token.api}
                    </p>
                    <p>
                      <span className="font-bold">API Secret - </span>
                      {token.apiSecret}
                    </p>
                    <p>
                      <span className="font-bold">Client - </span>
                      {token.client}
                    </p>
                    <p>
                      <span className="font-bold">Client Secret - </span>
                      {token.clientSecret}
                    </p>
                    <p>
                      <span className="font-bold">Environment - </span>
                      {token.environment === ""
                        ? "Production"
                        : token.environment === "-dev"
                        ? "Development"
                        : token.environment === "-qa"
                        ? "QA"
                        : token.environment === "cia-stg-1.aws."
                        ? "Staging"
                        : token.environment}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {newUserData.tokens < 1 && (
              <div className="w-full text-center p-2">No tokens saved...</div>
            )}
          </div>

          {/* Favorites */}
          <div className="flex justify-between my-2">
            <label className="block font-bold">Favorite Facilities:</label>
            <button
              className="hover:bg-gray-200 rounded px-1"
              onClick={() => setIsAddFavoriteFacilityModalOpen(true)}
            >
              <FaPlusCircle className="text-gray-500" />
            </button>
          </div>
          <div className="min-h-10 max-h-24 overflow-y-auto">
            {newUserData.favorite_tokens.map((token, index) => (
              <div
                key={index}
                className="border-collapse dark:border-border border-dotted border justify-between flex"
              >
                <p>{token.name}</p>
                <button
                  className="hover:bg-gray-200 rounded px-1"
                  onClick={() => handleDeleteFavoriteToken(token.id)}
                >
                  <FaTrash className="text-gray-500" />
                </button>
              </div>
            ))}
            {newUserData.favorite_tokens < 1 && (
              <div className="w-full text-center p-2">
                No tokens favorited...
              </div>
            )}
          </div>
          {/* Selected */}
          <div className="flex justify-between my-2">
            <label className="block font-bold">Selected Facilities:</label>
            <button
              className="hover:bg-gray-200 rounded px-1"
              onClick={() => setIsAddSelectedFacilityModalOpen(true)}
            >
              <FaPlusCircle className="text-gray-500" />
            </button>
          </div>
          <div className="min-h-10 max-h-24 overflow-y-auto">
            {newUserData.selected_tokens.map((token, index) => (
              <div
                key={index}
                className="border-collapse dark:border-border border-dotted border justify-between flex"
              >
                <p>{token.name}</p>
                <button
                  className="hover:bg-gray-200 rounded px-1"
                  onClick={() => handleDeleteSelectedToken(token.id)}
                >
                  <FaTrash className="text-gray-500" />
                </button>
              </div>
            ))}
            {newUserData.selected_tokens < 1 && (
              <div className="w-full text-center p-2">
                No tokens selected...
              </div>
            )}
          </div>
          {/* Button Container */}
          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-400 px-4 py-2 rounded mr-2 hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={() => setIsEditUserModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105"
              onClick={() =>
                toast.promise(
                  updateUserData().then((result) => {
                    if (result.success) {
                      setUsers((prevUsers) =>
                        prevUsers.map((u) =>
                          u.user_id === newUserData.user_id
                            ? { ...u, ...newUserData }
                            : u
                        )
                      );
                      setIsEditUserModalOpen(false);
                    }
                    return result;
                  }),
                  {
                    loading: `Updating ${newUserData.user_id}...`,
                    success: <b>{newUserData.user_id} successfully updated!</b>,
                    error: <b>Could not update {newUserData.user_id}.</b>,
                  }
                )
              }
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
