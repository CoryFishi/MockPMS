import { TbDeviceUsb } from "react-icons/tb";

export default function DetailModal({ device, onClose }) {
  if (!device) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 dark:text-whiterounded shadow-lg max-w-5xl w-full rounded">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            <TbDeviceUsb />
            <h2 className="ml-2 text-lg font-bold truncate max-w-[32ch]">
              {device.name || device.id} Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="bg-zinc-100 h-full px-5 cursor-pointer rounded-tr text-zinc-600 dark:text-white dark:bg-zinc-800 dark:hover:hover:bg-red-500 hover:bg-red-500 transition duration-300 ease-in-out"
            title="Close"
          >
            x
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto px-8 py-4">
          {Object.entries(device).map(([key, value]) => (
            <div key={key}>
              <strong className="text-yellow-500">{key}</strong>
              <div className="wrap-break-word">
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
