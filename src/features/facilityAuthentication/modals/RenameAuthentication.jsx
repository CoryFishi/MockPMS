import React, { useState, useEffect } from "react";

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
      <div className="bg-white dark:bg-darkSecondary p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Rename Authentication</h2>
        <input
          className="w-full p-2 border rounded mb-4 dark:bg-darkNavSecondary dark:text-white dark:border-border"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New name"
        />
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
