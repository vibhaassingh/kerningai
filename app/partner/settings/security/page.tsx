import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { ConnectedAccountsCard } from "@/components/auth/ConnectedAccountsCard";
import { MfaEnrolCard } from "@/components/auth/MfaEnrolCard";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { requireUser } from "@/lib/auth/require";
import { GOOGLE_OAUTH_CONFIGURED } from "@/lib/env";
import { getCurrentMfaFactor } from "@/lib/mfa/mfa";

export const metadata = { title: "Security" };
export const dynamic = "force-dynamic";

export default async function PartnerSecuritySettingsPage() {
  const user = await requireUser();
  const factor = await getCurrentMfaFactor(user.id);
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="00">Security</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Your <span className="italic text-[var(--color-signal)]">credentials</span> and sign-in methods.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Update your password and manage the providers that can sign
          you into your Kerning partner workspace.
        </p>
      </header>

      <ChangePasswordForm />
      <MfaEnrolCard current={factor} />
      <ConnectedAccountsCard googleEnabled={GOOGLE_OAUTH_CONFIGURED} />
    </div>
  );
}
