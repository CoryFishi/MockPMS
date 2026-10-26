import { useState } from "react";
import { MdStraighten } from "react-icons/md";
import ModalContainer from "@components/ui/ModalContainer";
import ModalButton from "@components/ui/ModalButton";
import InputBox from "@components/ui/InputBox";
import { dist } from "@views/smartspace/mapping/model/geometry";
import type { PlanScale, Point } from "@views/smartspace/mapping/model/types";

export default function CalibrateModal({
  a,
  b,
  current,
  onDone,
  onClose,
}: {
  a: Point;
  b: Point;
  current: PlanScale | null;
  onDone: (scale: PlanScale) => void;
  onClose: () => void;
}) {
  const px = dist(a, b);
  const [feet, setFeet] = useState(current ? (px / current.pxPerFt).toFixed(1) : "");
  const value = parseFloat(feet);
  const valid = Number.isFinite(value) && value > 0;

  const submit = () => {
    if (!valid) return;
    onDone({ pxPerFt: px / value, ref: { x1: a.x, y1: a.y, x2: b.x, y2: b.y, feet: value } });
  };

  return (
    <ModalContainer
      title="Set Scale"
      icon={<MdStraighten />}
      onClose={onClose}
      mainContent={
        <div className="flex w-md flex-col gap-3 pt-5 text-sm">
          <p>How long is the line you drew, in feet? Use a dimension printed on the plan or a known building length.</p>
          <div onKeyDown={(e) => e.key === "Enter" && submit()}>
            <InputBox type="number" placeholder="Length (ft)" value={feet} onchange={(e: { target: { value: string } }) => setFeet(e.target.value)} required />
          </div>
          {valid && <p className="text-zinc-500">{(px / value).toFixed(2)} px per foot</p>}
        </div>
      }
      responseContent={
        <>
          <ModalButton onclick={onClose} text="Cancel" />
          <ModalButton onclick={submit} text="Set Scale" className={valid ? "bg-green-500 hover:bg-green-600" : "bg-zinc-400 cursor-not-allowed"} />
        </>
      }
    />
  );
}
