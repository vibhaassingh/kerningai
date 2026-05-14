import type { Metadata } from "next";
import Link from "next/link";

import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";
import { AuthCard } from "@/components/auth/AuthCard";
import { hashInviteToken } from "@/lib/auth/invites";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Accept invite",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const service = createServiceClient();
  const tokenHash = hashInviteToken(token);

  const { data, error } = await service.rpc("find_invite_by_token_hash" as never, {
    p_token_hash: tokenHash,
  });

  type Row = {
    invite_id: string;
    email: string;
    organization_name: string;
    role_name: string;
    status: "pending" | "accepted" | "revoked" | "expired";
    expires_at: string;
  };

  const row = (data as unknown as Row[] | null)?.[0];

  if (error || !row) {
    return (
      <AuthCard
        number="05"
        eyebrow="Invite issue"
        heading={
          <>
            That invite <span className="italic text-[var(--color-signal)]">isn't valid</span>.
          </>
        }
        description="It may have been revoked, already used, or never existed. Ask your Kerning contact to send a new one."
        footer={
          <Link href="/login" className="nav-link text-text">
            Back to sign in
          </Link>
        }
      >
        <p className="text-[13px] text-[var(--color-text-muted)]">
          If you arrived here from an email link, copy the link to your
          inbox manager and re-open it to make sure it wasn't truncated.
        </p>
      </AuthCard>
    );
  }

  const expired = new Date(row.expires_at) < new Date();

  if (row.status !== "pending" || expired) {
    const statusLabel = expired ? "expired" : row.status;
    return (
      <AuthCard
        number="05"
        eyebrow="Invite issue"
        heading={
          <>
            This invite has{" "}
            <span className="italic text-[var(--color-signal)]">{statusLabel}</span>.
          </>
        }
        description="Ask your Kerning contact to issue a new invite if you still need access."
        footer={
          <Link href="/login" className="nav-link text-text">
            Back to sign in
          </Link>
        }
      >
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Invite for {row.email} as <strong>{row.role_name}</strong> at{" "}
          {row.organization_name}.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      number="05"
      eyebrow="Workspace invite"
      heading={
        <>
          Join{" "}
          <span className="italic text-[var(--color-signal)]">
            {row.organization_name}
          </span>{" "}
          on Kerning AI.
        </>
      }
      description={`You've been added as ${row.role_name}. Choose a password and you're in.`}
      footer={
        <span>
          Wrong account?{" "}
          <Link href="/login" className="nav-link text-text">
            Sign in
          </Link>{" "}
          with an existing email instead.
        </span>
      }
    >
      <AcceptInviteForm token={token} email={row.email} />
    </AuthCard>
  );
}
