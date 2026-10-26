import { useState } from "react";
import { RiDoorLockLine } from "react-icons/ri";
import ModalContainer from "@components/ui/ModalContainer";
import ModalButton from "@components/ui/ModalButton";
import InputBox from "@components/ui/InputBox";
import { dist } from "@views/smartspace/mapping/model/geometry";
import { unitSequence } from "@views/smartspace/mapping/model/unitNumbers";
import type { Point } from "@views/smartspace/mapping/model/types";

export interface RowOptions {
  count: number;
  firstUnit: string;
  step: number;
  group: string;
  flip: boolean;
}

export default function RowOfDoorsModal({
  a,
  b,
  pxPerFt,
  defaults,
  onDone,
  onClose,
}: {
  a: Point;
  b: Point;
  pxPerFt: number;
  defaults: { firstUnit: string; group: string };
  onDone: (options: RowOptions) => void;
  onClose: () => void;
}) {
  const [count, setCount] = useState("10");
  const [firstUnit, setFirstUnit] = useState(defaults.firstUnit);
  const [step, setStep] = useState("1");
  const [group, setGroup] = useState(defaults.group);
  const [flip, setFlip] = useState(false);

  const n = parseInt(count, 10);
  const s = parseInt(step, 10);
  const valid = Number.isInteger(n) && n >= 1 && n <= 500 && Number.isInteger(s) && s !== 0 && firstUnit.trim() !== "";
  const units = valid ? unitSequence(firstUnit.trim(), n, s) : [];
  const lengthFt = pxPerFt > 0 ? dist(a, b) / pxPerFt : null;

  const submit = () => valid && onDone({ count: n, firstUnit: firstUnit.trim(), step: s, group: group.trim(), flip });
  const text = (set: (v: string) => void) => (e: { target: { value: string } }) => set(e.target.value);

  return (
    <ModalContainer
      title="Row of Doors"
      icon={<RiDoorLockLine />}
      onClose={onClose}
      mainContent={
        <div className="flex w-md flex-col gap-4 pt-5 text-sm" onKeyDown={(e) => e.key === "Enter" && submit()}>
          <div className="flex gap-3">
            <InputBox type="number" placeholder="Number of doors" value={count} onchange={text(setCount)} required />
            <InputBox type="number" placeholder="Unit step" value={step} onchange={text(setStep)} />
          </div>
          <InputBox placeholder="First unit number" value={firstUnit} onchange={text(setFirstUnit)} required />
          <InputBox placeholder="Building / hallway" value={group} onchange={text(setGroup)} />
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} />
            Doors face the other side of the line
          </label>
          {valid && (
            <p className="text-zinc-500">
              Units {units[0]} – {units[units.length - 1]}
              {lengthFt !== null && n > 0 && ` · ${(lengthFt / n).toFixed(1)} ft per door`}
            </p>
          )}
        </div>
      }
      responseContent={
        <>
          <ModalButton onclick={onClose} text="Cancel" />
          <ModalButton onclick={submit} text="Place Locks" className={valid ? "bg-green-500 hover:bg-green-600" : "bg-zinc-400 cursor-not-allowed"} />
        </>
      }
    />
  );
}
