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
        className={`cursor-pointer peer w-full p-3 pb-2 bg-transparent border border-zinc-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-darkPrimary dark:border-border`}
      >
        <option value=""></option>
        {options.map((opt) => (
          <option key={opt.id || opt.name} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>

      {/* Floating Label */}
      <label
        className={`absolute left-3 px-1 transition-all duration-200 bg-white dark:bg-darkPrimary pointer-events-none
          ${
            shouldFloat
              ? "-top-2 text-xs text-yellow-400"
              : "top-3 text-base text-zinc-500"
          }
        `}
      >
        {placeholder} {required && <span className="text-red-500">*</span>}
      </label>
    </div>
  );
}
