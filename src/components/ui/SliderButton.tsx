import React from "react";

export default function SliderButton({ onclick, value, offValue, onValue } : {
  onclick: () => void;
  value: boolean;
  offValue?: React.ReactNode;
  onValue?: React.ReactNode;
}) {
  return (
    <button
      className={`min-w-9 h-5 flex items-center rounded-full p-1 cursor-pointer ${
        value ? "bg-blue-600" : "bg-zinc-300"
      }`}
      onClick={() => onclick()}
      type="button"
      aria-label="slider button"
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-500 ease-out text-xs flex items-center justify-center ${
          value ? "translate-x-3" : ""
        }`}
      >
        {/* On/Off value will give the slider button an icon based off the value */}
        {value ? onValue || "" : offValue || ""}
      </div>
    </button>
  );
}
