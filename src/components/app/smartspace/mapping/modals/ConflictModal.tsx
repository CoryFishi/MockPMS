import { MdWarningAmber } from "react-icons/md";
import ModalContainer from "@components/ui/ModalContainer";
import ModalButton from "@components/ui/ModalButton";
import type { SitePlanListRow } from "@hooks/sitePlans";

export default function ConflictModal({
  current,
  onOverwrite,
  onReload,
  onClose,
}: {
  current: SitePlanListRow;
  onOverwrite: () => void;
  onReload: () => void;
  onClose: () => void;
}) {
  return (
    <ModalContainer
      title="Plan Changed Elsewhere"
      icon={<MdWarningAmber className="text-amber-500" />}
      onClose={onClose}
      mainContent={
        <div className="w-md space-y-2 pt-5 text-sm">
          <p>
            <b>{current.updated_by_email ?? "Someone"}</b> saved this plan at{" "}
            <b>{new Date(current.updated_at).toLocaleString()}</b>, after you opened it.
          </p>
          <p>Overwrite their changes with yours, or reload their version and lose your unsaved changes?</p>
        </div>
      }
      responseContent={
        <>
          <ModalButton onclick={onClose} text="Cancel" />
          <ModalButton onclick={onReload} text="Reload" className="bg-zinc-500 hover:bg-zinc-600" />
          <ModalButton onclick={onOverwrite} text="Overwrite" className="bg-red-500 hover:bg-red-600" />
        </>
      }
    />
  );
}
