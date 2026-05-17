"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { generateProposalForProject } from "@/lib/admin/proposal-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface GenerateProposalButtonProps {
  projectId: string;
  hasExisting: boolean;
}

const initialState: ActionResult<{ proposalId: string }> = {
  ok: false,
  error: "",
};

export function GenerateProposalButton({
  projectId,
  hasExisting,
}: GenerateProposalButtonProps) {
  const [state, formAction, pending] = useActionState(
    generateProposalForProject,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="projectId" value={projectId} />
      <LiquidPillButton type="submit" variant="accent" disabled={pending}>
        {pending
          ? "Deriving from canvas…"
          : hasExisting
            ? "Regenerate from canvas (new version)"
            : "Generate proposal from canvas"}
      </LiquidPillButton>
      {!state.ok && state.error && (
        <p className="text-[12px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
