export default function SliderButton({ onclick, value, offValue, onValue }) {
  return (
    <div
      className={`w-12 h-5 flex items-center rounded-full p-1 cursor-pointer ${
        value ? "bg-blue-600" : "bg-gray-300"
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
        {value ? onValue || "" : offValue || ""}
      </div>
    </div>
  );
}
