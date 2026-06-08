import { useState } from "react";
import { IoIosCreate } from "react-icons/io";
import ModalContainer from "@components/UI/ModalContainer";
import ModalButton from "@components/UI/ModalButton";
import InputBox from "@components/UI/InputBox";

export interface FillVacantConfig {
  email: string;
  phone: string;
  accessCode: string;
  randomCode: boolean;
}

export default function FillVacantModal({
  setIsModalOpen,
  handleSubmit,
}: {
  setIsModalOpen: (_open: boolean) => void;
  handleSubmit: (_config: FillVacantConfig) => void;
}) {
  const [email, setEmail] = useState(null);
  const [phone, setPhone] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [randomCode, setRandomCode] = useState(true);

  return (
    <ModalContainer
      title="Fill Vacant Units w/ Temporary Tenants"
      icon={<IoIosCreate />}
      mainContent={
        <div className="flex flex-col gap-4 pt-3 w-80">
          <p className="text-xs text-red-400">
            This will create a Temporary Tenant in every currently vacant unit.
          </p>
          <InputBox
            placeholder="Email"
            value={email}
            onchange={(e) => setEmail(e.target.value)}
          />
          <InputBox
            placeholder="Phone Number"
            value={phone}
            onchange={(e) => setPhone(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <input
              id="randomCode"
              type="checkbox"
              checked={randomCode}
              onChange={(e) => setRandomCode(e.target.checked)}
              className="accent-yellow-400 w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="randomCode"
              className="text-sm cursor-pointer select-none"
            >
              Random gate code per unit
            </label>
          </div>
          {!randomCode && (
            <InputBox
              placeholder="Gate Code (shared across all units)"
              value={accessCode}
              onchange={(e) => setAccessCode(e.target.value)}
              type="number"
            />
          )}
        </div>
      }
      responseContent={
        <div className="flex justify-end">
          <ModalButton onclick={() => setIsModalOpen(false)} text="Cancel" />
          <ModalButton
            onclick={() => handleSubmit({ email, phone, accessCode, randomCode })}
            text="Fill Vacant Units"
            className="bg-blue-500 hover:bg-blue-600"
          />
        </div>
      }
      onClose={() => setIsModalOpen(false)}
    />
  );
}
