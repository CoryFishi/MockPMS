import { FaLock } from "react-icons/fa";

export default function SmartLockDetailModal({ lock, onClose }) {
  if (!lock) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-darkPrimary dark:text-whiterounded shadow-lg max-w-5xl w-full rounded">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            <FaLock />
            <h2 className="ml-2 text-lg font-bold">
              {lock.name || lock.id} Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 h-full px-5 cursor-pointer rounded-tr text-gray-600 dark:text-white dark:bg-gray-800 dark:hover:hover:bg-red-500 hover:bg-red-500 transition duration-300 ease-in-out"
            title="Close"
          >
            x
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto px-8 py-4">
          {Object.entries(lock).map(([key, value]) => (
            <div key={key}>
              <strong className="text-yellow-500">{key}</strong>
              <div className="break-words">
                {typeof value === "boolean"
                  ? value.toString()
                  : Array.isArray(value)
                  ? value.join(", ")
                  : value || "null"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
