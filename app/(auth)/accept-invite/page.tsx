import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Accept invite",
};

export const dynamic = "force-dynamic";

/**
 * Phase 1 placeholder. The full invite acceptance flow ships in Phase 1b
 * alongside the admin `inviteUser` server action. For now, the invite
 * email contains a Supabase magic-link that opens /reset-password with
 * a one-time session, where the user sets their password.
 */
export default function AcceptInvitePage() {
  return (
    <AuthCard
      number="05"
      eyebrow="Welcome"
      heading={
        <>
          You've been <span className="italic text-[var(--color-signal)]">invited</span>.
        </>
      }
      description="Open the link in your invite email to set a password and join your workspace. This page is the destination after the link is consumed."
      footer={
        <Link href="/login" className="nav-link text-text">
          Back to sign in
        </Link>
      }
    >
      <p className="text-[13px] text-[var(--color-text-muted)]">
        If you arrived here without clicking an invite link, ask your
        Kerning contact to resend it.
      </p>
    </AuthCard>
  );
}
