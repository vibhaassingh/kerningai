import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Kerning AI password.",
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      number="02"
      eyebrow="Recover access"
      heading={
        <>
          Reset your <span className="italic text-[var(--color-signal)]">password</span>.
        </>
      }
      description="Enter the email tied to your workspace. We'll send a single-use link to set a new password."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
