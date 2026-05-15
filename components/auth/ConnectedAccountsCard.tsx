import { listConnectedAccounts } from "@/lib/auth/actions";
import { Eyebrow } from "@/components/primitives/Eyebrow";

import { ConnectedAccountsActions } from "@/components/auth/ConnectedAccountsActions";

interface ConnectedAccountsCardProps {
  googleEnabled: boolean;
}

export async function ConnectedAccountsCard({
  googleEnabled,
}: ConnectedAccountsCardProps) {
  const snapshot = await listConnectedAccounts();

  return (
    <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
      <header className="space-y-2">
        <Eyebrow number="02">Connected accounts</Eyebrow>
        <h2 className="text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          Sign-in methods.
        </h2>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          Keep at least one active. You can't remove the only way you
          have to sign in.
        </p>
      </header>

      <ul className="mt-8 space-y-4">
        <Row
          provider="Password"
          status={snapshot.hasPassword ? "Active" : "Not set"}
          detail={
            snapshot.hasPassword
              ? "Use your email and password to sign in."
              : "Set a password to enable email/password sign-in."
          }
        />
        <Row
          provider="Google"
          status={snapshot.google?.linked ? "Linked" : googleEnabled ? "Not linked" : "Disabled"}
          detail={
            snapshot.google?.linked
              ? snapshot.google.email ?? "Linked"
              : googleEnabled
                ? "Link Google to sign in faster from any device."
                : "Google sign-in is not configured for this workspace."
          }
        />
      </ul>

      {googleEnabled && (
        <div className="mt-8 border-t border-hairline pt-6">
          <ConnectedAccountsActions
            googleLinked={Boolean(snapshot.google?.linked)}
            hasPassword={snapshot.hasPassword}
          />
        </div>
      )}
    </section>
  );
}

function Row({
  provider,
  status,
  detail,
}: {
  provider: string;
  status: string;
  detail: string;
}) {
  const isActive = status === "Active" || status === "Linked";
  return (
    <li className="flex items-start justify-between gap-6 border-b border-hairline pb-4 last:border-b-0">
      <div className="space-y-1">
        <p className="text-[14px] text-text">{provider}</p>
        <p className="text-[12px] text-[var(--color-text-faded)]">{detail}</p>
      </div>
      <span
        className={
          isActive
            ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
            : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]"
        }
      >
        {status}
      </span>
    </li>
  );
}
