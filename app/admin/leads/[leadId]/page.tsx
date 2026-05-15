import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AddLeadNoteForm } from "@/components/admin/AddLeadNoteForm";
import { ConvertLeadForm } from "@/components/admin/ConvertLeadForm";
import { ConvertLeadToPartnerForm } from "@/components/admin/ConvertLeadToPartnerForm";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import {
  getLeadDetail,
  listLeadActivities,
  listPipelineStages,
} from "@/lib/admin/leads";
import { formatRelative } from "@/lib/admin/format";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Lead" };
export const dynamic = "force-dynamic";

interface LeadDetailProps {
  params: Promise<{ leadId: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailProps) {
  const canView = await hasPermissionAny("view_leads");
  if (!canView) redirect("/admin");

  const { leadId } = await params;
  const [lead, activities, stages] = await Promise.all([
    getLeadDetail(leadId),
    listLeadActivities(leadId),
    listPipelineStages(),
  ]);

  if (!lead) notFound();

  const isConverted = !!lead.client_id;
  const convertedToPartner = lead.client_type === "partner";
  const canConvert = !isConverted && (await hasPermissionAny("manage_clients"));

  const slugSuggestion = (lead.company_name ?? lead.contact_name)
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link
            href="/admin/leads"
            className="nav-link hover:text-text"
          >
            ← Leads
          </Link>
          <span>·</span>
          <span>{lead.source.replace(/_/g, " ")}</span>
        </div>
        <h1 className="text-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          {lead.company_name ?? lead.contact_name}
        </h1>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          {lead.contact_name}
          {lead.contact_role && ` · ${lead.contact_role}`} ·{" "}
          <a
            href={`mailto:${lead.contact_email}`}
            className="hover:text-[var(--color-signal)]"
          >
            {lead.contact_email}
          </a>
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <article className="space-y-3 bg-bg-elev/40 px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
            01 — Stage
          </p>
          <LeadStatusSelect
            leadId={lead.id}
            current={lead.status}
            stages={stages}
          />
        </article>
        <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
            02 — Owner
          </p>
          <p className="text-text">
            {lead.owner_name ?? (
              <span className="text-[var(--color-text-faint)]">Unassigned</span>
            )}
          </p>
        </article>
        <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
            03 — Score
          </p>
          <p className="text-stat text-[1.4rem] font-medium text-text tabular-nums">
            {lead.score ?? "—"}
          </p>
        </article>
        <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
            04 — Created
          </p>
          <p className="text-text">{formatRelative(lead.created_at)}</p>
        </article>
      </section>

      {lead.intent_summary && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="05">What they said</Eyebrow>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-text-faded)]">
            {lead.intent_summary}
          </p>
        </section>
      )}

      {isConverted && lead.client_name && (
        <section className="rounded-2xl border border-[var(--color-signal-deep)]/30 bg-bg-elev/30 p-8">
          <Eyebrow number="06">Converted</Eyebrow>
          <h2 className="mt-3 text-display text-[1.4rem] tracking-[-0.02em]">
            This lead became a {convertedToPartner ? "partner" : "client"}:{" "}
            <Link
              href={
                convertedToPartner
                  ? `/admin/partners/${lead.client_id}`
                  : `/admin/clients/${lead.client_id}`
              }
              className="italic text-[var(--color-signal)] hover:underline"
            >
              {lead.client_name}
            </Link>
          </h2>
        </section>
      )}

      {canConvert && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Eyebrow number="06">Convert</Eyebrow>
          <h2 className="mt-3 text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
            Promote this lead to a{" "}
            <span className="italic text-[var(--color-signal)]">client</span>{" "}
            or <span className="italic text-[var(--color-signal)]">partner</span>.
          </h2>
          <p className="mt-2 text-[14px] text-[var(--color-text-faded)]">
            A client gets an org + default settings + sites. A partner is a
            referral channel that can follow the workflow canvas of projects
            it introduces. Pick one — a lead converts once.
          </p>
          <div className="mt-8 space-y-10">
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Convert to client
              </p>
              <ConvertLeadForm
                leadId={lead.id}
                defaultName={lead.company_name ?? lead.contact_name}
                defaultSlug={slugSuggestion}
              />
            </div>
            <div className="space-y-3 border-t border-hairline pt-10">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                Convert to partner
              </p>
              <ConvertLeadToPartnerForm
                leadId={lead.id}
                defaultName={lead.company_name ?? lead.contact_name}
                defaultSlug={slugSuggestion}
              />
            </div>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <Eyebrow number="07">Activity</Eyebrow>

        <div className="rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <AddLeadNoteForm leadId={lead.id} />
        </div>

        <ol className="relative space-y-6 border-l border-hairline pl-6">
          {activities.length === 0 && (
            <li className="text-[13px] text-[var(--color-text-muted)]">
              No activity recorded yet.
            </li>
          )}
          {activities.map((a) => (
            <li key={a.id} className="relative space-y-1">
              <span
                aria-hidden
                className="absolute -left-[27px] top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-signal)]"
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12px] text-[var(--color-text-muted)]">
                <span className="font-mono uppercase tracking-[0.1em]">
                  {a.kind.replace(/_/g, " ")}
                </span>
                <span>·</span>
                <span>{a.actor_name ?? "system"}</span>
                <span>·</span>
                <time dateTime={a.created_at}>{formatRelative(a.created_at)}</time>
              </div>
              {a.body && (
                <p className="whitespace-pre-line text-[14px] text-[var(--color-text-faded)]">
                  {a.body}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
