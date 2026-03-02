export default function GeneralButton({
  onclick,
  text,
  className = "bg-zinc-300 hover:bg-zinc-400",
} : {
  onclick: () => void;
  text: string;
  className?: string;
}) {
  return (
    <button
      className={`text-white p-1 py-2 rounded font-bold ml-3 w-44 transition duration-300 ease-in-out transform select-none hover:scale-105 hover:cursor-pointer ${className}`}
      onClick={() => onclick()}
      type="button"
      aria-label="general button"
    >
      {text || "No Text"}
    </button>
  );
}
