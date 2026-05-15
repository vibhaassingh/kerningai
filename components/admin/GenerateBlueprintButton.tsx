"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { generateBlueprintForSubmission } from "@/lib/admin/blueprint-actions";
import type { ActionResult } from "@/lib/auth/actions";

interface GenerateBlueprintButtonProps {
  submissionId: string;
  hasExisting: boolean;
}

const initialState: ActionResult<{ blueprintId: string }> = { ok: false, error: "" };

export function GenerateBlueprintButton({
  submissionId,
  hasExisting,
}: GenerateBlueprintButtonProps) {
  const [state, formAction, pending] = useActionState(
    generateBlueprintForSubmission,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.blueprintId) {
      router.push(`/admin/solution-blueprints/${state.data.blueprintId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="submissionId" value={submissionId} />
      <LiquidPillButton type="submit" variant="accent" disabled={pending}>
        {pending
          ? "Generating…"
          : hasExisting
            ? "Regenerate blueprint"
            : "Generate blueprint"}
      </LiquidPillButton>
      {!state.ok && state.error && (
        <p className="text-[12px] text-[var(--color-signal)]" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
