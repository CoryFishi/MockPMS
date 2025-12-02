import { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";

export default function RenameAuthentication({
  isOpen,
  onClose,
  onSubmit,
  token,
}) {
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (token) setNewName(token.name || "");
  }, [token]);

  const handleSubmit = () => {
    if (!newName.trim()) return;
    onSubmit({ ...token, name: newName.trim() });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-sm dark:bg-darkPrimary shadow-md w-full max-w-md">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            <FaEdit />
            <h2 className="ml-2 text-lg font-bold">
              Rename {token.name || "Authentication"}
            </h2>
          </div>
          <button
            onClick={() => onClose()}
            className="bg-gray-100 h-full px-5 cursor-pointer rounded-tr text-gray-600 dark:text-white dark:bg-gray-800 dark:hover:hover:bg-red-500 hover:bg-red-500 transition duration-300 ease-in-out"
          >
            x
          </button>
        </div>
        <div className="px-5 py-3 flex flex-col gap-2">
          <input
            className="border border-gray-300 rounded-sm px-3 py-2 w-full mb-2 dark:bg-darkSecondary dark:border-border"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New name"
          />
          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-400 px-4 py-2 rounded-sm mr-2 hover:cursor-pointer hover:bg-gray-500 font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-green-500 text-white hover:cursor-pointer px-4 py-2 rounded-sm hover:bg-green-600 font-bold transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
