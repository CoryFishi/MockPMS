import axios from "axios";
import toast from "react-hot-toast";
import React, { useState } from "react";
import { IoIosCreate } from "react-icons/io";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../supabaseClient";

export default function CreateRole({ setIsCreateRoleModalOpen, setRoles }) {
  // Store the unit number to be created
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [rolePermissions, setRolePermissions] = useState({
    pmsPlatform: false,
    smartlockPlatform: false,
    authenticationPlatform: false,
    adminPlatform: false,
    pmsPlatformUnitCreate: false,
    pmsPlatformUnitEdit: false,
    pmsPlatformUnitDelete: false,
    pmsPlatformVisitorCreate: false,
    pmsPlatformVisitorEdit: false,
    pmsPlatformVisitorDelete: false,
    adminPlatformUsers: false,
    adminPlatformUsersCreate: false,
    adminPlatformUsersEdit: false,
    adminPlatformUsersDelete: false,
    adminPlatformRoles: false,
    adminPlatformRolesCreate: false,
    adminPlatformRolesEdit: false,
    adminPlatformRolesDelete: false,
    adminPlatformEvents: false,
    authenticationPlatformCreate: false,
    authenticationPlatformEdit: false,
    authenticationPlatformDelete: false,
    authenticationPlatformImport: false,
    authenticationPlatformExport: false,
  });

  // API call handler to create the new unit
  const handleCreateRole = async () => {};

  return (
    // Background Filter
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded shadow-lg dark:bg-darkPrimary min-w-96">
        {/* Header Container */}
        <div className="pl-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <IoIosCreate />
            <h2 className="ml-2 text-lg font-bold text-center items-center">
              Create Role
            </h2>
          </div>
        </div>
        {/* Content Container */}
        <div className="px-5 py-3">
          {/* Role Name */}
          <label className="block">Role Name</label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full dark:bg-darkSecondary dark:border-border"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter role name..."
          />
          {/* Role Description */}
          <label className="block mt-2">Role Description</label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full dark:bg-darkSecondary dark:border-border"
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
            placeholder="Enter role description..."
          />
          {/* Role Permissions */}
          <label className="block mt-2">Role Permissions</label>
          <div className="grid grid-cols-3 gap-1 mt-2">
            {Object.keys(rolePermissions).map((key) => (
              <label key={key} className="inline-flex items-center mt-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-yellow-500"
                  checked={rolePermissions[key]}
                  onChange={(e) =>
                    setRolePermissions((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                />
                <span className="ml-2">{key}</span>
              </label>
            ))}
          </div>
          {/* Button Container */}
          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-400 px-4 py-2 rounded mr-2 hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={() => setIsCreateRoleModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleCreateRole}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
