"use client";

import { useState, useTransition } from "react";

import { getAdminDocumentDownloadUrl } from "@/lib/admin/document-actions";

interface Props {
  documentId: string;
  label?: string;
}

export function AdminDocumentDownloadLink({ documentId, label = "Download ↗" }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result = await getAdminDocumentDownloadUrl(documentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-[var(--color-signal)] hover:underline disabled:opacity-50"
      >
        {pending ? "Signing…" : label}
      </button>
      {error && <span className="text-[11px] text-[var(--color-signal)]">{error}</span>}
    </span>
  );
}
