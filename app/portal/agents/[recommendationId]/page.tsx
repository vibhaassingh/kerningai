import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AgentDecisionForm } from "@/components/portal/AgentDecisionForm";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";
import { getRecommendationDetail } from "@/lib/portal/agents";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Recommendation" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ recommendationId: string }>;
}

export default async function RecommendationPage({ params }: PageProps) {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const { recommendationId } = await params;
  const rec = await getRecommendationDetail(recommendationId);
  if (!rec) notFound();

  const canDecide =
    rec.status === "pending" && (await hasPermissionAny("approve_agent_actions"));

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link href="/portal/agents/inbox" className="nav-link hover:text-text">
            ← Inbox
          </Link>
          <span>·</span>
          <span>{rec.template_name ?? rec.template_slug.replace(/_/g, " ")}</span>
          {rec.asset_name && (
            <>
              <span>·</span>
              <Link
                href={rec.asset_id ? `/portal/maintenance/assets/${rec.asset_id}` : "#"}
                className="nav-link hover:text-text"
              >
                {rec.asset_name}
              </Link>
            </>
          )}
          {rec.site_name && (
            <>
              <span>·</span>
              <span>{rec.site_name}</span>
            </>
          )}
        </div>
        <h1 className="text-display text-[clamp(1.8rem,4vw,2.4rem)] font-medium leading-[1.1] tracking-[-0.02em]">
          {rec.title}
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          {rec.summary}
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Cell number="01" label="Status">
          <p className="text-text capitalize">{rec.status.replace(/_/g, " ")}</p>
        </Cell>
        <Cell number="02" label="Risk level">
          <p className="text-text capitalize">{rec.risk_level.replace(/_/g, " ")}</p>
        </Cell>
        <Cell number="03" label="Confidence">
          <p className="text-stat text-[1.6rem] font-medium leading-none text-text tabular-nums">
            {rec.confidence != null ? `${Math.round(rec.confidence * 100)}%` : "—"}
          </p>
        </Cell>
        <Cell number="04" label="Expires">
          <p className="text-text">
            {rec.expires_at ? formatRelative(rec.expires_at) : "—"}
          </p>
        </Cell>
      </section>

      <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8 space-y-5">
        <Eyebrow number="05">Proposed action</Eyebrow>
        <p className="text-[16px] leading-relaxed text-text">{rec.proposed_action}</p>
        {rec.expected_impact && (
          <p className="border-t border-hairline pt-4 text-[14px] text-[var(--color-text-faded)]">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Expected impact:
            </span>{" "}
            {rec.expected_impact}
          </p>
        )}
      </section>

      {rec.evidence.length > 0 && (
        <section className="space-y-4">
          <Eyebrow number="06">Evidence</Eyebrow>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {rec.evidence.map((e) => (
              <li key={e.label} className="space-y-1.5 bg-bg-elev/40 px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                  {e.label}
                </p>
                <p className="text-text">{e.value}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rec.reasoning && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8 space-y-3">
          <Eyebrow number="07">Reasoning</Eyebrow>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-faded)]">
            {rec.reasoning}
          </p>
        </section>
      )}

      {canDecide ? (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8 space-y-5">
          <Eyebrow number="08">Decide</Eyebrow>
          <p className="text-[13.5px] text-[var(--color-text-faded)]">
            Approving records the decision in the action ledger. The
            agent will not act on rejected recommendations.
          </p>
          <AgentDecisionForm recommendationId={rec.id} />
        </section>
      ) : (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8 space-y-3">
          <Eyebrow number="08">Decision</Eyebrow>
          <p className="text-[14px] text-text capitalize">
            {rec.status.replace(/_/g, " ")}
            {rec.decided_at && (
              <span className="text-[var(--color-text-faded)]">
                {" "}
                · {formatRelative(rec.decided_at)}
              </span>
            )}
            {rec.decided_by_name && (
              <span className="text-[var(--color-text-faded)]">
                {" "}
                · {rec.decided_by_name}
              </span>
            )}
          </p>
          {rec.decision_reason && (
            <p className="text-[13.5px] text-[var(--color-text-faded)]">
              {rec.decision_reason}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Cell({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-3 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      {children}
    </article>
  );
}
