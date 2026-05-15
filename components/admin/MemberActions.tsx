"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  adminResetPassword,
  setMembershipRole,
  setMembershipStatus,
} from "@/lib/admin/member-actions";

interface MemberActionsProps {
  membershipId: string;
  userId: string;
  email: string;
  organizationId: string;
  currentRoleSlug: string;
  status: "active" | "suspended" | "pending";
  isSelf: boolean;
  roleOptions: { slug: string; name: string }[];
}

export function MemberActions({
  membershipId,
  userId,
  email,
  organizationId,
  currentRoleSlug,
  status,
  isSelf,
  roleOptions,
}: MemberActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [role, setRole] = useState(currentRoleSlug);

  if (isSelf) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        You
      </span>
    );
  }

  function run(
    action: (
      p: undefined,
      fd: FormData,
    ) => Promise<{ ok: boolean; error?: string }>,
    fd: FormData,
    okMsg: string,
  ) {
    setErr(null);
    setMsg(null);
    startTransition(async () => {
      const r = await action(undefined, fd);
      if (!r.ok) {
        setErr(r.error ?? "Failed.");
        return;
      }
      setMsg(okMsg);
      router.refresh();
    });
  }

  function resetPw() {
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("email", email);
    fd.set("organizationId", organizationId);
    run(adminResetPassword, fd, "Reset email sent");
  }

  function toggleStatus() {
    const fd = new FormData();
    fd.set("membershipId", membershipId);
    fd.set("organizationId", organizationId);
    fd.set("status", status === "suspended" ? "active" : "suspended");
    run(
      setMembershipStatus,
      fd,
      status === "suspended" ? "Reactivated" : "Suspended",
    );
  }

  function changeRole(next: string) {
    setRole(next);
    if (next === currentRoleSlug) return;
    const fd = new FormData();
    fd.set("membershipId", membershipId);
    fd.set("organizationId", organizationId);
    fd.set("roleSlug", next);
    run(setMembershipRole, fd, "Role updated");
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
        <select
          value={role}
          disabled={pending}
          onChange={(e) => changeRole(e.target.value)}
          aria-label="Change role"
          className="rounded-md border border-hairline bg-bg px-2 py-1 text-[11px] text-text disabled:opacity-50"
        >
          {roleOptions.map((r) => (
            <option key={r.slug} value={r.slug} className="bg-bg">
              {r.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={resetPw}
          disabled={pending}
          className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] underline-offset-2 transition-colors hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          Reset password
        </button>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={pending}
          className={`text-[11px] uppercase tracking-[0.12em] underline-offset-2 transition-colors disabled:opacity-50 ${
            status === "suspended"
              ? "text-[var(--color-text-muted)] hover:text-[var(--color-signal)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-canvas-pain)]"
          }`}
        >
          {pending
            ? "Working…"
            : status === "suspended"
              ? "Reactivate"
              : "Suspend"}
        </button>
      </div>
      {msg && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          {msg}
        </span>
      )}
      {err && (
        <span className="text-[11px] text-[var(--color-canvas-pain)]">
          {err}
        </span>
      )}
    </div>
  );
}
