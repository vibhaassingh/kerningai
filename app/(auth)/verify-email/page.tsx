import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Verify your email",
};

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <AuthCard
      number="04"
      eyebrow="Confirm address"
      heading={
        <>
          Check your <span className="italic text-[var(--color-signal)]">inbox</span>.
        </>
      }
      description="We've sent a verification link. Click it to confirm your email and finish setting up your workspace."
      footer={
        <span>
          Wrong email?{" "}
          <Link href="/login" className="nav-link text-text">
            Sign in
          </Link>{" "}
          and update it from settings.
        </span>
      }
    >
      <p className="text-[13px] text-[var(--color-text-muted)]">
        No email after a few minutes? Check spam, or request a new link
        by signing in.
      </p>
    </AuthCard>
  );
}
