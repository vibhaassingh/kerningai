import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password",
};

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      number="03"
      eyebrow="Set credentials"
      heading={
        <>
          Choose a <span className="italic text-[var(--color-signal)]">new password</span>.
        </>
      }
      description="Once saved, you'll be signed out of all other sessions and returned to sign in."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
