import ModalButton from "@components/UI/ModalButton";
import ModalContainer from "@components/UI/ModalContainer";
import { MdDeleteForever } from "react-icons/md";
import { useState } from "react";
import PropTypes from "prop-types";

DeleteModal.propTypes = {
  type: PropTypes.oneOf(["unit", "uv", "facility"]).isRequired, // Type of item to delete (unit, uv, or facility)
  setContinousDelete: PropTypes.func.isRequired, // Function to set continuous delete setting
  continousDelete: PropTypes.bool.isRequired, // Current state of continuous delete setting
  handleDelete: PropTypes.func.isRequired, // Function to handle the delete action
  value: PropTypes.object.isRequired, // Object containing details of the item to delete (e.g., unitNumber, name)
  setIsDeleteModalOpen: PropTypes.func.isRequired, // Function to close the modal
};

export default function DeleteModal({
  type,
  setContinousDelete,
  continousDelete,
  handleDelete,
  value,
  setIsDeleteModalOpen,
}) {
  const [deleteSetting, setDeleteSetting] = useState(continousDelete || false);

  return (
    <ModalContainer
      title={
        type === "unit"
          ? `Delete unit ${value.unitNumber}`
          : type === "uv"
          ? `Move out visitor from unit ${value.unitNumber}`
          : `Delete ${type}`
      }
      icon={<MdDeleteForever />}
      mainContent={
        <>
          <p className="text-wrap mt-3" onClick={() => console.log(type)}>
            Would you like to {type !== "uv" ? "delete" : "move out the tenant"}{" "}
            {type == "unit" ? value.unitNumber : value.name} from this{" "}
            {type !== "uv" ? "facility" : "unit"}?
          </p>
          <p className="text-wrap text-xs text-red-400 mt-1">
            This action cannot be undone.
          </p>
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              checked={deleteSetting}
              onChange={(e) => setDeleteSetting(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm">
              Do not ask me again for this action
            </label>
          </div>
        </>
      }
      responseContent={
        <div className="flex justify-end">
          <ModalButton
            onclick={() => setIsDeleteModalOpen(false)}
            text="Cancel"
          />
          <ModalButton
            onclick={() => {
              handleDelete(value);
              setContinousDelete(deleteSetting);
              setIsDeleteModalOpen(false);
            }}
            text="Delete"
            className={"bg-red-500 hover:bg-red-600"}
          />
        </div>
      }
    />
  );
}
