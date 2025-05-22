import { useState } from "react";

export default function SelectOption({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
}) {
  const hasValue = value !== "";
  const [isFocused, setIsFocused] = useState(false);

  const shouldFloat = isFocused || hasValue;

  return (
    <div className="relative w-full">
      {/* Select Element */}
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`cursor-pointer peer w-full p-3 pb-2 bg-transparent border border-gray-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-darkSecondary dark:border-border`}
      >
        <option value="" disabled hidden></option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>

      {/* Floating Label */}
      <label
        className={`absolute left-3 px-1 transition-all duration-200 bg-white dark:bg-darkSecondary pointer-events-none
          ${
            shouldFloat
              ? "-top-2 text-xs text-blue-600"
              : "top-3 text-base text-gray-500"
          }
        `}
      >
        {placeholder} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}
