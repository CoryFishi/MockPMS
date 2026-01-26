import { IoIosCreate } from "react-icons/io";
import ModalButton from "@components/UI/ModalButton";
import ModalContainer from "@components/UI/ModalContainer";

export default function ScriptConfirmation({
  title,
  message,
  handleSubmit,
  setIsModalOpen,
}) {
  return (
    <ModalContainer
      title={title}
      icon={<IoIosCreate />}
      mainContent={
        <div className="flex flex-col pt-3">
          <p className="text-wrap text-xs text-red-400 mt-1">
            Are you sure you would like to {message}?
          </p>
        </div>
      }
      responseContent={
        <div className="flex justify-end">
          <ModalButton onclick={() => setIsModalOpen(false)} text="Cancel" />
          <ModalButton
            onclick={handleSubmit}
            text="Submit"
            className={"bg-green-500 hover:bg-green-600"}
          />
        </div>
      }
      onClose={()=>setIsModalOpen(false)}
    />
  );
}
