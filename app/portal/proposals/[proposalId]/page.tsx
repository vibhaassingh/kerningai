import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ProposalView } from "@/components/admin/ProposalView";
import { ProposalComments } from "@/components/proposal/ProposalComments";
import { ProposalDecision } from "@/components/portal/ProposalDecision";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getProposalDetail, listProposalComments } from "@/lib/admin/proposals";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Proposal" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ proposalId: string }>;
}

export default async function PortalProposalPage({ params }: PageProps) {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const { proposalId } = await params;
  const proposal = await getProposalDetail(proposalId);

  // RLS only exposes sent / decided proposals to client members. A null
  // result means it doesn't exist for this client or isn't sent yet.
  if (!proposal) notFound();
  if (proposal.organization_id !== ctx.organizationId) notFound();

  const comments = await listProposalComments(proposal.id);

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="00">Your proposal</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {proposal.title}
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Prepared for{" "}
          <span className="italic text-[var(--color-signal)]">
            {ctx.organizationName}
          </span>
          . Review with your team — your Kerning contact can walk through any
          section.
        </p>
        <Link
          href={`/proposals/${proposal.id}/print`}
          target="_blank"
          className="inline-block font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:text-[var(--color-signal)]"
        >
          Print / Save as PDF →
        </Link>
      </header>

      {proposal.status === "sent" && (
        <ProposalDecision proposalId={proposal.id} />
      )}
      {proposal.status === "accepted" && (
        <p className="rounded-2xl border border-[var(--color-signal-deep)] bg-[var(--color-signal)]/10 px-6 py-4 text-[14px] text-[var(--color-signal)]">
          You accepted this proposal. Your Kerning team is moving it into
          implementation.
        </p>
      )}
      {proposal.status === "declined" && (
        <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-6 py-4 text-[14px] text-[var(--color-text-faded)]">
          This proposal was declined. Talk to your Kerning contact if you&apos;d
          like a revised version.
        </p>
      )}

      <ProposalView proposal={proposal} audience="client" />
      <ProposalComments proposalId={proposal.id} comments={comments} />
    </div>
  );
}
