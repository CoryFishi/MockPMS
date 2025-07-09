import toast from "react-hot-toast";
import { useState } from "react";
import { IoIosCreate } from "react-icons/io";
import { supabase } from "@app/supabaseClient";
import PropTypes from "prop-types";

EditRole.propTypes = {
  setIsEditRoleModalOpen: PropTypes.func.isRequired, // Function to close the modal
  setRoles: PropTypes.func.isRequired, // Function to update the roles list in the parent component
  selectedRole: PropTypes.object.isRequired, // The role data to be edited
};

export default function EditRole({
  setIsEditRoleModalOpen,
  setRoles,
  selectedRole,
}) {
  // Store the unit number to be created
  const [roleName, setRoleName] = useState(selectedRole.role_name);
  const [roleDesc, setRoleDesc] = useState(selectedRole.role_description);
  const [rolePermissions, setRolePermissions] = useState(
    selectedRole.permissions
  );
  const [error, setError] = useState("");

  const handleEditRole = async () => {
    try {
      setError("");
      if (!roleName) {
        setError("Missing a role name!");
        return Promise.reject(new Error("Missing a role name!"));
      }
      if (!roleDesc) {
        setError("Missing a role description!");
        return Promise.reject(new Error("Missing a role description!"));
      }

      const { data, error } = await supabase
        .from("roles")
        .update({
          role_name: roleName,
          role_description: roleDesc,
          permissions: rolePermissions,
        })
        .eq("id", selectedRole.id)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data }; // Return a success result
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message }; // Return an error result
    }
  };

  return (
    // Background Filter
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      {/* Modal Container */}
      <div className="bg-white rounded-sm shadow-lg dark:bg-darkPrimary min-w-96">
        {/* Header Container */}
        <div className="pl-2 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex text-center items-center">
            <IoIosCreate />
            <h2 className="ml-2 text-lg font-bold text-center items-center">
              Editing Role
            </h2>
          </div>
        </div>
        {/* Content Container */}
        <div className="px-5 py-3">
          {/* Error Container */}
          <p className="text-red-500 text-center">{error}</p>
          {/* Role Name */}
          <label className="block">Role Name</label>
          <input
            type="text"
            className="border border-gray-300 rounded-sm px-3 py-2 w-full dark:bg-darkSecondary dark:border-border"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter role name..."
          />
          {/* Role Description */}
          <label className="block mt-2">Role Description</label>
          <input
            type="text"
            className="border border-gray-300 rounded-sm px-3 py-2 w-full dark:bg-darkSecondary dark:border-border"
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
            placeholder="Enter role description..."
          />
          {/* Role Permissions */}
          <label className="block mt-2">Role Permissions</label>
          {/* Authentication Platform */}
          <div className="grid grid-cols-3 gap-1 mt-2">
            {Object.keys(rolePermissions).map((key) => {
              if (key === "authenticationPlatform") {
                return (
                  <label
                    key={key}
                    className="inline-flex items-center mt-2 hover:cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-yellow-500"
                      checked={rolePermissions[key]}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setRolePermissions((prev) => {
                          const updatedPermissions = { ...prev };

                          // Update the main authenticationPlatform checkbox
                          updatedPermissions[key] = isChecked;

                          // If unchecked, set all related permissions to false
                          if (!isChecked) {
                            Object.keys(prev).forEach((subKey) => {
                              if (
                                subKey.startsWith("authenticationPlatform") &&
                                subKey !== key
                              ) {
                                updatedPermissions[subKey] = false;
                              }
                            });
                          }

                          return updatedPermissions;
                        });
                      }}
                    />
                    <span className="ml-2">{key}</span>
                  </label>
                );
              }
              // Render the sub-items for "authenticationPlatform" only if the main checkbox is checked
              if (
                key.startsWith("authenticationPlatform") &&
                key !== "authenticationPlatform"
              ) {
                if (rolePermissions.authenticationPlatform) {
                  return (
                    <label
                      key={key}
                      className="inline-flex items-center mt-2 hover:cursor-pointer"
                    >
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
                  );
                } else {
                  // Don't render sub-items if the main checkbox is unchecked
                  return null;
                }
              }
            })}
          </div>
          {/* PMS Platform */}
          <div className="grid grid-cols-3 gap-1 mt-2">
            {Object.keys(rolePermissions).map((key) => {
              if (key === "pmsPlatform") {
                return (
                  <label
                    key={key}
                    className="inline-flex items-center mt-2 hover:cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-yellow-500"
                      checked={rolePermissions[key]}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setRolePermissions((prev) => {
                          const updatedPermissions = { ...prev };

                          // Update the main pmsPlatform checkbox
                          updatedPermissions[key] = isChecked;

                          // If unchecked, set all related permissions to false
                          if (!isChecked) {
                            Object.keys(prev).forEach((subKey) => {
                              if (
                                subKey.startsWith("pmsPlatform") &&
                                subKey !== key
                              ) {
                                updatedPermissions[subKey] = false;
                              }
                            });
                          }

                          return updatedPermissions;
                        });
                      }}
                    />
                    <span className="ml-2">{key}</span>
                  </label>
                );
              }
              // Render the sub-items for "pmsPlatform" only if the main checkbox is checked
              if (key.startsWith("pmsPlatform") && key !== "pmsPlatform") {
                if (rolePermissions.pmsPlatform) {
                  return (
                    <label
                      key={key}
                      className="inline-flex items-center mt-2 hover:cursor-pointer"
                    >
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
                  );
                } else {
                  // Don't render sub-items if the main checkbox is unchecked
                  return null;
                }
              }
            })}
          </div>
          {/* SmartLock Platform */}
          <div className="grid grid-cols-3 gap-1 mt-2">
            {Object.keys(rolePermissions).map((key) => {
              if (key === "smartlockPlatform") {
                return (
                  <label
                    key={key}
                    className="inline-flex items-center mt-2 hover:cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-yellow-500 hover:cursor-pointer"
                      checked={rolePermissions[key]}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setRolePermissions((prev) => {
                          const updatedPermissions = { ...prev };

                          // Update the main smartlockPlatform checkbox
                          updatedPermissions[key] = isChecked;

                          // If unchecked, set all related permissions to false
                          if (!isChecked) {
                            Object.keys(prev).forEach((subKey) => {
                              if (
                                subKey.startsWith("smartlockPlatform") &&
                                subKey !== key
                              ) {
                                updatedPermissions[subKey] = false;
                              }
                            });
                          }

                          return updatedPermissions;
                        });
                      }}
                    />
                    <span className="ml-2">{key}</span>
                  </label>
                );
              }
              // Render the sub-items for "smartlockPlatform" only if the main checkbox is checked
              if (
                key.startsWith("smartlockPlatform") &&
                key !== "smartlockPlatform"
              ) {
                if (rolePermissions.smartlockPlatform) {
                  return (
                    <label
                      key={key}
                      className="inline-flex items-center mt-2 hover:cursor-pointer"
                    >
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
                  );
                } else {
                  // Don't render sub-items if the main checkbox is unchecked
                  return null;
                }
              }
            })}
          </div>

          {/* Button Container */}
          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-400 hover:cursor-pointer px-4 py-2 rounded-sm mr-2 hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={() => setIsEditRoleModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 hover:cursor-pointer text-white px-4 py-2 rounded-sm hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105"
              onClick={() =>
                toast.promise(
                  handleEditRole().then((result) => {
                    if (result.success) {
                      setRoles((prevRoles) =>
                        prevRoles.map((role) =>
                          role.id === result.data[0].id ? result.data[0] : role
                        )
                      );
                      setIsEditRoleModalOpen(false);
                    }
                    return result;
                  }),
                  {
                    loading: `Updating ${roleName}...`,
                    success: <b>{roleName} successfully updated!</b>,
                    error: (error) => (
                      <b>{error?.message || `Could not update ${roleName}.`}</b>
                    ),
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
