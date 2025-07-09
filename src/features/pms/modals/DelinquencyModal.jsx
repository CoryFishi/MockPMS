import ModalButton from "@components/UI/ModalButton";
import ModalContainer from "@components/UI/ModalContainer";
import { MdUpdate } from "react-icons/md";
import { useState } from "react";
import PropTypes from "prop-types";

DelinquencyModal.propTypes = {
  setContinousDelinquency: PropTypes.func.isRequired, // Function to set continuous delinquency setting
  continousDelinquency: PropTypes.bool, // Current state of continuous delinquency setting
  handleDelinquency: PropTypes.func.isRequired, // Function to handle the delinquency update
  value: PropTypes.object.isRequired, // Unit object containing unitNumber and status
  setIsDelinquencyModalOpen: PropTypes.func.isRequired, // Function to close the modal
};

export default function DelinquencyModal({
  setContinousDelinquency,
  continousDelinquency,
  handleDelinquency,
  value,
  setIsDelinquencyModalOpen,
}) {
  const [delinquencySetting, setDelinquencySetting] = useState(
    continousDelinquency || false
  );

  return (
    <ModalContainer
      title={
        "Update Unit " +
        value.unitNumber +
        `${value.status == "Rented" ? " to Delinquent" : " to Rented"}`
      }
      icon={<MdUpdate />}
      mainContent={
        <>
          <p className="text-wrap mt-3">
            Would you like to update {value.unitNumber}{" "}
            {value.status == "Rented" ? "to Delinquent" : "to Rented"}?
          </p>
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              checked={delinquencySetting}
              onChange={(e) => setDelinquencySetting(e.target.checked)}
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
            onclick={() => setIsDelinquencyModalOpen(false)}
            text="Cancel"
          />
          <ModalButton
            onclick={() => {
              handleDelinquency(value);
              setContinousDelinquency(delinquencySetting);
              setIsDelinquencyModalOpen(false);
            }}
            text="Update"
            className={"bg-green-500 hover:bg-green-600"}
          />
        </div>
      }
    />
  );
}
