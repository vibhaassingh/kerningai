import Link from "next/link";
import { notFound } from "next/navigation";

import { ProposalComments } from "@/components/proposal/ProposalComments";
import { ProposalView } from "@/components/admin/ProposalView";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import {
  getLatestProposalForProject,
  getProposalDetail,
  listProposalComments,
} from "@/lib/admin/proposals";
import { assertPartnerForProject } from "@/lib/partner/partner-canvas";

export const metadata = { title: "Proposal" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function PartnerProposalPage({ params }: Props) {
  const { projectId } = await params;
  const ctx = await assertPartnerForProject(projectId);
  if (!ctx) notFound();

  // RLS only exposes sent / decided proposals to the referring partner.
  const latest = await getLatestProposalForProject(projectId);
  const detail = latest ? await getProposalDetail(latest.id) : null;
  const comments = detail ? await listProposalComments(detail.id) : [];

  return (
    <div className="space-y-10">
      <header className="flex items-baseline justify-between gap-3">
        <div className="space-y-2">
          <Eyebrow number="01">Proposal · {ctx.client_org_name}</Eyebrow>
          <h1 className="font-display text-[1.7rem] tracking-[-0.01em] text-text">
            {ctx.name}
          </h1>
        </div>
        <Link
          href={`/partner/projects/${projectId}`}
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:text-[var(--color-signal)]"
        >
          ← Project
        </Link>
      </header>

      {!detail ? (
        <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-10 text-center text-[13px] text-[var(--color-text-muted)]">
          No proposal has been shared yet. You&apos;ll see it here once the
          Kerning team sends it to the client.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {detail.status.replace("_", " ")} · v{detail.version}
            </p>
            <Link
              href={`/proposals/${detail.id}/print`}
              target="_blank"
              className="rounded-full border border-[var(--color-signal-deep)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
            >
              Print / PDF
            </Link>
          </div>
          <ProposalView proposal={detail} audience="client" />
          <ProposalComments proposalId={detail.id} comments={comments} />
        </>
      )}
    </div>
  );
}
