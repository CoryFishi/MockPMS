export default function TableButton({
  onclick,
  text,
  className = "bg-zinc-300 hover:bg-zinc-400",
}) {
  return (
    <button
      className={`cursor-pointer text-white px-2 py-1 rounded font-bold ${className}`}
      onClick={() => onclick()}
      type="button"
      aria-label="table button"
    >
      {text || "No Text"}
    </button>
  );
}
