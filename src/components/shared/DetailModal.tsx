import { TbDeviceUsb } from "react-icons/tb";
import ModalCloseButton from "@components/ui/ModalCloseButton";

export default function DetailModal({ device, onClose }) {
  if (!device) return null;

  function formatValue(value) {
    if (value == null) return "null";

    // Date object
    if (value instanceof Date) return value.toLocaleString();

    // ISO-ish date string
    if (typeof value === "string") {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime()) && /\d{4}-\d{2}-\d{2}T/.test(value)) {
        return d.toLocaleString();
      }
      return value;
    }

    if (typeof value === "boolean") return value.toString();

    if (Array.isArray(value)) return value.map(formatValue).join(", ");

    // plain object
    if (typeof value === "object") return JSON.stringify(value, null, 2);

    return String(value);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-zinc-900 dark:text-white shadow-lg max-w-5xl w-full rounded">
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            <TbDeviceUsb />
            <h2 className="ml-2 text-lg font-bold truncate max-w-[32ch]">
              {device.name || device.id} Details
            </h2>
          </div>
          <ModalCloseButton onclick={onClose} />
        </div>
        <div className="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto px-8 py-4">
          {Object.entries(device).map(([key, value]) => (
            <div key={key}>
              <strong className="text-yellow-500">{key}</strong>
              <div className="wrap-break-word">{formatValue(value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
