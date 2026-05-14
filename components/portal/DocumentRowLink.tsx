"use client";

import { useState, useTransition } from "react";

import { getDocumentDownloadUrl } from "@/lib/portal/document-actions";

interface DocumentRowLinkProps {
  documentId: string;
  label: string;
}

/**
 * Renders a "Download" anchor that lazy-fetches a 60s signed URL from
 * the server, then opens it in a new tab. Avoids exposing storage paths
 * in the page HTML.
 */
export function DocumentRowLink({ documentId, label }: DocumentRowLinkProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await getDocumentDownloadUrl(documentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.open(result.data!.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-[var(--color-signal)] hover:underline disabled:opacity-50"
      >
        {pending ? "Signing…" : label}
      </button>
      {error && (
        <span className="text-[11px] text-[var(--color-signal)]">{error}</span>
      )}
    </span>
  );
}
