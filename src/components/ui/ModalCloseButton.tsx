import { IoClose } from "react-icons/io5";

export default function ModalCloseButton({ onclick }: { onclick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => onclick()}
      title="Close"
      aria-label="Close"
      className="bg-zinc-100 h-full px-5 cursor-pointer rounded-tr text-zinc-600 dark:text-white dark:bg-zinc-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition duration-300 ease-in-out"
    >
      <IoClose className="text-lg" />
    </button>
  );
}
