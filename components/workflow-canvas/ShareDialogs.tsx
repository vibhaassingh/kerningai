"use client";

import { useActionState, useEffect, useState } from "react";

import {
  shareCanvasWithClient,
  shareCanvasWithPartner,
} from "@/lib/workflow-canvas/canvas-actions";
import type { ActionResult } from "@/lib/auth/actions";

type ShareKind = "client" | "partner";

interface ShareButtonProps {
  kind: ShareKind;
  canvasId: string;
  organizationId: string;
  projectId: string;
}

const SHARE_LABEL: Record<ShareKind, string> = {
  client: "Share with client",
  partner: "Share with partner",
};

export function ShareButton({
  kind,
  canvasId,
  organizationId,
  projectId,
}: ShareButtonProps) {
  const action = kind === "client" ? shareCanvasWithClient : shareCanvasWithPartner;
  const [result, dispatch, pending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const [okFlash, setOkFlash] = useState(false);

  useEffect(() => {
    if (result?.ok) {
      setOkFlash(true);
      const t = setTimeout(() => setOkFlash(false), 2400);
      return () => clearTimeout(t);
    }
  }, [result]);

  return (
    <form action={dispatch} className="inline-flex items-center gap-2">
      <input type="hidden" name="canvasId" value={canvasId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
      >
        {pending ? "Sharing…" : SHARE_LABEL[kind]}
      </button>
      {okFlash && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          Shared
        </span>
      )}
      {result && !result.ok && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
          {result.error}
        </span>
      )}
    </form>
  );
}
