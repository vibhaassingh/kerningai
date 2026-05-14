import Link from "next/link";

import { formatRelative } from "@/lib/admin/format";
import type { SignalEvent } from "@/lib/portal/live-ops";

interface SignalRowProps {
  event: SignalEvent;
}

const KIND_TAG: Record<SignalEvent["kind"], string> = {
  agent_recommendation: "Agent",
  energy_anomaly: "Energy",
  incident: "Incident",
  corrective_action: "Compliance",
  audit: "Audit",
};

export function SignalRow({ event }: SignalRowProps) {
  const body = (
    <div className="grid gap-4 px-6 py-4 sm:grid-cols-[88px_120px_1fr_120px] sm:items-center">
      <time className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {formatRelative(event.occurred_at)}
      </time>
      <span
        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
          event.severity === "high" || event.severity === "critical_approval" || event.severity === "blocked"
            ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)]"
            : "border border-hairline text-[var(--color-text-faded)]"
        }`}
      >
        {KIND_TAG[event.kind]}
      </span>
      <div className="space-y-0.5">
        <p className="text-text">{event.title}</p>
        {event.detail && (
          <p className="line-clamp-1 text-[12.5px] text-[var(--color-text-faded)]">
            {event.detail}
          </p>
        )}
      </div>
      <span className="text-right text-[11.5px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
        {event.site_name ?? "—"}
      </span>
    </div>
  );
  if (event.href) {
    return (
      <Link
        href={event.href}
        className="block border-b border-hairline transition-colors last:border-b-0 hover:bg-bg-elev/60"
      >
        {body}
      </Link>
    );
  }
  return (
    <div className="border-b border-hairline last:border-b-0">{body}</div>
  );
}
