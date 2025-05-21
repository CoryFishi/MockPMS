import { useState } from "react";

export default function InputBox({
  value,
  onchange,
  placeholder,
  type = "text",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const shouldFloat = isFocused || value;

  return (
    <div className="relative w-full">
      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={onchange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder=""
        className="w-full px-3 py-3 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-darkSecondary dark:border-border"
      />
      {/* Floating label*/}
      <label
        className={`absolute left-3 px-1 transition-all duration-200 bg-white dark:bg-darkSecondary
        ${
          shouldFloat
            ? "text-xs -top-2 text-blue-600"
            : "text-base top-3 text-gray-500"
        }
        pointer-events-none`}
      >
        {placeholder}
      </label>
    </div>
  );
}
