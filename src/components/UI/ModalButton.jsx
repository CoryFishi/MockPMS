export default function ModalButton({ onclick, text, className }) {
  return (
    <button
      className={`bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-sm mr-2 hover:cursor-pointer font-bold transition duration-300 ease-in-out transform hover:scale-105 text-white ${className}`}
      onClick={() => onclick()}
      type="button"
      aria-label="modal button"
    >
      {text || "No Text"}
    </button>
  );
}
