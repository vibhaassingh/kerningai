"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { approveBlueprint } from "@/lib/admin/blueprint-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface ApproveBlueprintButtonProps {
  blueprintId: string;
  alreadyApproved: boolean;
}

const initialState: ActionResult = { ok: false, error: "" };

export function ApproveBlueprintButton({
  blueprintId,
  alreadyApproved,
}: ApproveBlueprintButtonProps) {
  const [state, formAction, pending] = useActionState(
    approveBlueprint,
    initialState,
  );
  const router = useRouter();

  return (
    <form
      action={(fd) => {
        formAction(fd);
        setTimeout(() => router.refresh(), 200);
      }}
      className="flex items-center gap-3"
    >
      <input type="hidden" name="blueprintId" value={blueprintId} />
      <LiquidPillButton
        type="submit"
        variant="accent"
        disabled={alreadyApproved || pending}
      >
        {alreadyApproved
          ? "Approved"
          : pending
            ? "Approving…"
            : "Approve for client"}
      </LiquidPillButton>
      {!state.ok && state.error && (
        <p className="text-[12px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
