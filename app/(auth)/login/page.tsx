import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { GOOGLE_OAUTH_CONFIGURED } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Kerning AI workspace.",
};

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ returnTo?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo, reset } = await searchParams;
  return (
    <AuthCard
      number="01"
      eyebrow="Workspace access"
      heading={
        <>
          Sign in to <span className="italic text-[var(--color-signal)]">your</span> workspace.
        </>
      }
      description={
        reset === "ok"
          ? "Password updated. Sign in with your new credentials."
          : "Email and password for admin staff and client teams. Use Google if your account has it linked."
      }
      footer={
        <span>
          Don't have an account? Your Kerning contact will send an invite. Prospects exploring solutions: start at{" "}
          <a href="/start" className="nav-link text-text">
            /start
          </a>
          .
        </span>
      }
    >
      <LoginForm returnTo={returnTo} googleEnabled={GOOGLE_OAUTH_CONFIGURED} />
    </AuthCard>
  );
}
