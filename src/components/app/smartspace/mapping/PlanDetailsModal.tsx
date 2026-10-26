import { useState } from "react";
import { MdOutlineMap } from "react-icons/md";
import ModalContainer from "@components/ui/ModalContainer";
import ModalButton from "@components/ui/ModalButton";
import InputBox from "@components/ui/InputBox";
import type { SitePlanDetails } from "@hooks/sitePlans";

export default function PlanDetailsModal({
  title,
  initial,
  submitText,
  onSubmit,
  onClose,
}: {
  title: string;
  initial?: SitePlanDetails;
  submitText: string;
  /** Resolves when done; the modal stays open (and re-enables) if it rejects. */
  onSubmit: (details: SitePlanDetails) => Promise<void>;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<SitePlanDetails>(
    initial ?? { name: "", customer: "", address: "", notes: "" },
  );
  const [busy, setBusy] = useState(false);
  const field = (key: keyof SitePlanDetails) => (e: { target: { value: string } }) =>
    setDetails((d) => ({ ...d, [key]: e.target.value }));

  const submit = async () => {
    if (!details.name.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit({ ...details, name: details.name.trim() });
    } catch {
      setBusy(false);
    }
  };

  return (
    <ModalContainer
      title={title}
      icon={<MdOutlineMap />}
      onClose={onClose}
      mainContent={
        <div className="flex w-md flex-col gap-4 pt-5">
          <InputBox value={details.name} onchange={field("name")} placeholder="Plan name" required />
          <InputBox value={details.customer} onchange={field("customer")} placeholder="Customer" />
          <InputBox value={details.address} onchange={field("address")} placeholder="Address" />
          <textarea
            value={details.notes}
            onChange={field("notes")}
            placeholder="Notes"
            rows={4}
            className="w-full rounded-md border border-zinc-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      }
      responseContent={
        <>
          <ModalButton onclick={onClose} text="Cancel" />
          <ModalButton
            onclick={submit}
            text={busy ? "Saving..." : submitText}
            className={details.name.trim() && !busy ? "bg-green-500 hover:bg-green-600" : "bg-zinc-400 cursor-not-allowed"}
          />
        </>
      }
    />
  );
}
