import { useState } from "react";
import { IoCloseCircle } from "react-icons/io5";
import PropTypes from "prop-types";

InputBox.propTypes = {
  value: PropTypes.string.isRequired,
  onchange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool,
};

export default function InputBox({
  value,
  onchange,
  placeholder,
  type = "text",
  required = false,
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
        className="w-full px-3 py-3 pr-8 border border-zinc-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:bg-darkPrimary dark:border-border"
      />
      {/* Floating label */}
      <label
        className={`absolute left-3 px-1 transition-all duration-200 bg-white dark:bg-darkPrimary
        ${
          shouldFloat
            ? "text-xs -top-2 text-yellow-400"
            : "text-base top-3 text-zinc-500"
        }
        pointer-events-none`}
      >
        {placeholder} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Clear button */}
      {value && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
          onClick={() => onchange({ target: { value: "" } })}
        >
          <IoCloseCircle size={18} />
        </button>
      )}
    </div>
  );
}
