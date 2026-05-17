import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { GenerateProposalButton } from "@/components/admin/GenerateProposalButton";
import { ProposalBasicsForm } from "@/components/admin/ProposalBasicsForm";
import { ProposalCommercialsEditor } from "@/components/admin/ProposalCommercialsEditor";
import { ProposalPhasesEditor } from "@/components/admin/ProposalPhasesEditor";
import { ProposalRisksEditor } from "@/components/admin/ProposalRisksEditor";
import { ProposalScopeEditor } from "@/components/admin/ProposalScopeEditor";
import { ProposalStatusControls } from "@/components/admin/ProposalStatusControls";
import { ProposalView } from "@/components/admin/ProposalView";
import { hasPermissionAny } from "@/lib/auth/require";
import {
  getProposalDetail,
  listProposalsForProject,
} from "@/lib/admin/proposals";
import { getProject } from "@/lib/projects/projects";

export const metadata = { title: "Proposal" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ clientId: string; projectId: string }>;
}

export default async function ProposalPage({ params }: Props) {
  const { clientId, projectId } = await params;
  const [project, proposals, canManage] = await Promise.all([
    getProject(projectId),
    listProposalsForProject(projectId),
    hasPermissionAny("manage_proposals"),
  ]);
  if (!project) notFound();

  const latest = proposals[0] ?? null;
  const detail = latest ? await getProposalDetail(latest.id) : null;
  const editable =
    detail != null &&
    canManage &&
    (detail.status === "draft" || detail.status === "internal_review");

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Eyebrow number="01">Formal proposal</Eyebrow>
          <p className="max-w-xl text-[14px] text-[var(--color-text-faded)]">
            Derived from the project&apos;s combined workflow canvas. Edit the
            narrative and commercials, then move it through internal review and
            send it to the client.
          </p>
        </div>
        {canManage && (
          <GenerateProposalButton
            projectId={projectId}
            hasExisting={proposals.length > 0}
          />
        )}
      </section>

      {!detail && (
        <section className="rounded-2xl border border-hairline bg-bg-elev/30 px-6 py-12 text-center">
          <p className="text-[14px] text-[var(--color-text-faded)]">
            No proposal yet.{" "}
            {canManage
              ? "Generate one from the workflow canvas to get started."
              : "A proposal has not been prepared for this project."}
          </p>
          <Link
            href={`/admin/clients/${clientId}/projects/${projectId}/workflow-canvas`}
            className="mt-3 inline-block font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:text-[var(--color-signal)]"
          >
            View source workflow canvas →
          </Link>
        </section>
      )}

      {detail && (
        <>
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-bg-elev/30 px-6 py-5">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                Status
              </p>
              <p className="text-[15px] text-text">
                {detail.status.replace("_", " ")} · v{detail.version}
                {proposals.length > 1 && (
                  <span className="text-[var(--color-text-muted)]">
                    {" "}
                    ({proposals.length} versions)
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/proposals/${detail.id}/print`}
                target="_blank"
                className="rounded-full border border-hairline px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
              >
                Print / PDF
              </Link>
              {canManage && (
                <ProposalStatusControls
                  proposalId={detail.id}
                  status={detail.status}
                />
              )}
            </div>
          </section>

          {editable && (
            <section className="space-y-8 rounded-2xl border border-hairline bg-bg-elev/20 p-6">
              <div className="space-y-4">
                <Eyebrow number="02">Edit narrative</Eyebrow>
                <ProposalBasicsForm
                  proposalId={detail.id}
                  title={detail.title}
                  summary={detail.summary}
                  executiveBrief={detail.executive_brief}
                  currency={detail.currency}
                  validUntil={detail.valid_until}
                />
              </div>
              <div className="space-y-4 border-t border-hairline pt-8">
                <Eyebrow number="03">Edit commercials</Eyebrow>
                <ProposalCommercialsEditor
                  proposalId={detail.id}
                  currency={detail.currency}
                  lines={detail.commercials.map((c) => ({
                    label: c.label,
                    basis: c.basis as
                      | "fixed"
                      | "time_and_materials"
                      | "license"
                      | "subscription"
                      | "one_time",
                    quantity: c.quantity,
                    unit_rate: c.unit_rate,
                    notes: c.notes,
                  }))}
                />
              </div>
              <div className="space-y-4 border-t border-hairline pt-8">
                <Eyebrow number="04">Edit phases</Eyebrow>
                <ProposalPhasesEditor
                  proposalId={detail.id}
                  phases={detail.phases.map((p) => ({
                    name: p.name,
                    description: p.description,
                    duration_weeks: p.duration_weeks,
                    owners: p.owners,
                    deliverables: p.deliverables,
                    price: p.price,
                  }))}
                />
              </div>
              <div className="space-y-4 border-t border-hairline pt-8">
                <Eyebrow number="05">Edit scope</Eyebrow>
                <ProposalScopeEditor
                  proposalId={detail.id}
                  items={detail.scope_items.map((s) => ({
                    kind: s.kind,
                    description: s.description,
                  }))}
                />
              </div>
              <div className="space-y-4 border-t border-hairline pt-8">
                <Eyebrow number="06">Edit risks</Eyebrow>
                <ProposalRisksEditor
                  proposalId={detail.id}
                  risks={detail.risks.map((r) => ({
                    category: r.category,
                    description: r.description,
                    severity: r.severity as
                      | "low"
                      | "medium"
                      | "high"
                      | "critical",
                    mitigation: r.mitigation,
                  }))}
                />
              </div>
            </section>
          )}

          <section className="space-y-4">
            <Eyebrow number="07">Document preview</Eyebrow>
            <ProposalView proposal={detail} audience="admin" />
          </section>
        </>
      )}
    </div>
  );
}
