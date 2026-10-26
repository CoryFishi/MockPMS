import React from "react";
import ModalCloseButton from "@components/ui/ModalCloseButton";

export default function ModalContainer({
  title,
  icon,
  mainContent,
  responseContent,
  onClose,
} : {
  title?: string;
  icon?: React.ReactNode;
  mainContent?: React.ReactNode;
  responseContent?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    // Modal Background
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      {/* Modal Container */}
      <div
        className="bg-white dark:bg-zinc-900 dark:text-white rounded shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={title || "Modal"}
      >
        {/* Header Container */}
        <div className="pl-5 border-b-2 border-b-yellow-500 flex justify-between items-center h-10">
          <div className="flex items-center">
            {icon || ""}
            <h2 className="ml-2 text-lg font-bold">{title || "Modal Title"}</h2>
          </div>
          {responseContent ? (
            ""
          ) : (
            <ModalCloseButton onclick={onClose} />
          )}
        </div>
        {/* Content Container */}
        <div className="px-8 pb-4 max-h-[90vh] overflow-y-auto">
          {mainContent || (
            <p>No content provided. Please check the component&apos;s props.</p>
          )}
          {/* Response Container */}
          <div className="mt-4 flex justify-end">{responseContent || ""}</div>
        </div>
      </div>
    </div>
  );
}
