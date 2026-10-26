import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import toast from "react-hot-toast";
import { FaCopy } from "react-icons/fa";
import { supabaseAdmin } from "@lib/supabaseClient";
import { addEvent } from "@hooks/supabase";
import { useAuth } from "@context/AuthProvider";
import ModalContainer from "@components/ui/ModalContainer";
import ModalButton from "@components/ui/ModalButton";
import SelectOption from "@components/ui/SelectOption";

type Field = "tokens" | "favorite_tokens" | "selected_tokens";

const FIELDS: { key: Field; label: string }[] = [
  { key: "tokens", label: "Tokens" },
  { key: "favorite_tokens", label: "Favorite Facilities" },
  { key: "selected_tokens", label: "Selected Facilities" },
];

// Identity used to skip duplicates when merging
const itemKey = (field: Field, item: any) =>
  field === "tokens" ? `${item.api}::${item.environment}` : `${item.id}`;

const mergeLists = (field: Field, target: any[], source: any[]) => {
  const existing = new Set(target.map((item) => itemKey(field, item)));
  return [
    ...target,
    ...source.filter((item) => !existing.has(itemKey(field, item))),
  ];
};

export default function CopyUserData({
  setIsCopyUserDataModalOpen,
  sourceUser,
  users,
  setUsers,
}: {
  setIsCopyUserDataModalOpen: Dispatch<SetStateAction<boolean>>;
  sourceUser: any;
  users: any[];
  setUsers: Dispatch<SetStateAction<any[]>>;
}) {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [fields, setFields] = useState<Record<Field, boolean>>({
    tokens: true,
    favorite_tokens: true,
    selected_tokens: true,
  });

  const targetUser = users.find((u) => u.user_id === targetUserId);
  const selectedFields = FIELDS.filter((f) => fields[f.key]);

  const targetOptions = users
    .filter((u) => u.user_id !== sourceUser.user_id)
    .map((u) => ({ id: u.user_id, name: u.user_email || u.user_id }));

  // Resulting count per field for the chosen target, shown as a preview
  const preview = useMemo(() => {
    if (!targetUser) return null;
    return FIELDS.map(({ key }) => {
      const source = sourceUser[key] || [];
      const target = targetUser[key] || [];
      const result =
        mode === "replace" ? source : mergeLists(key, target, source);
      return { key, before: target.length, after: result.length };
    });
  }, [targetUser, sourceUser, mode]);

  const copyUserData = async () => {
    if (!targetUserId) throw new Error("No target user selected.");
    if (selectedFields.length === 0) throw new Error("Nothing to copy.");

    const columns = selectedFields.map((f) => f.key).join(",");
    const description = `${user.email} copied ${selectedFields
      .map((f) => f.label)
      .join(", ")} from ${sourceUser.user_email} to ${
      targetUser.user_email
    } (${mode})`;

    try {
      // Read both rows fresh so we don't overwrite changes made since the table loaded
      const { data: rows, error: fetchError } = await supabaseAdmin
        .from("user_data")
        .select(`user_id,${columns}`)
        .in("user_id", [sourceUser.user_id, targetUserId]);
      if (fetchError) throw fetchError;

      const source = rows.find((r: any) => r.user_id === sourceUser.user_id);
      const target = rows.find((r: any) => r.user_id === targetUserId);
      if (!source || !target) throw new Error("User data not found.");

      const update: Record<string, any> = {
        last_update_at: new Date().toISOString(),
      };
      for (const { key } of selectedFields) {
        update[key] =
          mode === "replace"
            ? source[key] || []
            : mergeLists(key, target[key] || [], source[key] || []);
      }

      const { error } = await supabaseAdmin
        .from("user_data")
        .update(update)
        .eq("user_id", targetUserId);
      if (error) throw error;

      addEvent("Copy User Data", description, true);
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.user_id === targetUserId ? { ...u, ...update } : u
        )
      );
      setIsCopyUserDataModalOpen(false);
    } catch (error) {
      addEvent("Copy User Data", description, false);
      console.error("Error copying user data:", error);
      throw error;
    }
  };

  const handleSubmit = () => {
    if (!targetUserId) return toast.error("Select a user to copy to.");
    if (selectedFields.length === 0)
      return toast.error("Select at least one list to copy.");
    if (
      mode === "replace" &&
      !confirm(
        `This will overwrite ${targetUser.user_email}'s ${selectedFields
          .map((f) => f.label)
          .join(", ")}. Continue?`
      )
    )
      return;

    toast.promise(copyUserData(), {
      loading: `Copying to ${targetUser.user_email}...`,
      success: <b>Copied to {targetUser.user_email}!</b>,
      error: <b>Could not copy to {targetUser.user_email}.</b>,
    });
  };

  return (
    <ModalContainer
      title="Copy User Data"
      icon={<FaCopy />}
      onClose={() => setIsCopyUserDataModalOpen(false)}
      mainContent={
        <div className="flex flex-col gap-4 pt-4 w-[28rem]">
          {/* Source */}
          <div>
            <label className="block font-bold">From:</label>
            <p className="ml-2">{sourceUser.user_email || sourceUser.user_id}</p>
          </div>
          {/* Target */}
          <SelectOption
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            options={targetOptions}
            placeholder="Copy to"
            required
          />
          {/* Lists */}
          <div>
            <label className="block font-bold mb-1">Copy:</label>
            {FIELDS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 ml-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="cursor-pointer accent-yellow-500"
                  checked={fields[key]}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                />
                {label} ({sourceUser[key]?.length || 0})
              </label>
            ))}
          </div>
          {/* Mode */}
          <div>
            <label className="block font-bold mb-1">Mode:</label>
            <label className="flex items-center gap-2 ml-2 cursor-pointer">
              <input
                type="radio"
                className="cursor-pointer accent-yellow-500"
                checked={mode === "merge"}
                onChange={() => setMode("merge")}
              />
              Merge — add to the target&apos;s existing lists, skipping duplicates
            </label>
            <label className="flex items-center gap-2 ml-2 cursor-pointer">
              <input
                type="radio"
                className="cursor-pointer accent-yellow-500"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              Replace — overwrite the target&apos;s lists
            </label>
          </div>
          {/* Preview */}
          {preview && (
            <div className="text-sm rounded-sm border border-zinc-300 dark:border-zinc-700 p-2">
              <p className="font-bold mb-1">
                Result for {targetUser.user_email}:
              </p>
              {preview
                .filter((p) => fields[p.key])
                .map((p) => (
                  <p key={p.key} className="ml-2">
                    {FIELDS.find((f) => f.key === p.key).label}: {p.before} →{" "}
                    {p.after}
                  </p>
                ))}
            </div>
          )}
        </div>
      }
      responseContent={
        <>
          <ModalButton
            text="Cancel"
            onclick={() => setIsCopyUserDataModalOpen(false)}
            className="bg-zinc-400 hover:bg-zinc-500"
          />
          <ModalButton
            text="Copy"
            onclick={handleSubmit}
            className="bg-green-500 hover:bg-green-600"
          />
        </>
      }
    />
  );
}
