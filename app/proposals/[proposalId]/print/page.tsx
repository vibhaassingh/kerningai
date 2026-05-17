import { notFound } from "next/navigation";

import { ProposalView } from "@/components/admin/ProposalView";
import { PrintButton } from "@/components/proposal/PrintButton";
import { getProposalDetail } from "@/lib/admin/proposals";

export const metadata = { title: "Proposal — Print" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ proposalId: string }>;
}

export default async function ProposalPrintPage({ params }: PageProps) {
  const { proposalId } = await params;
  // RLS gates this: internal staff see any proposal; client members see
  // theirs once sent. Anonymous / unrelated users get nothing.
  const proposal = await getProposalDetail(proposalId);
  if (!proposal) notFound();

  return (
    <main className="proposal-print mx-auto min-h-screen max-w-4xl px-6 py-12 print:py-0">
      <header className="mb-10 flex items-start justify-between gap-6">
        <div className="space-y-1">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
            Kerning AI · Proposal
          </p>
          <h1 className="text-display text-[1.8rem] tracking-[-0.02em] text-text">
            {proposal.title}
          </h1>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            v{proposal.version} · {proposal.status.replace("_", " ")}
            {proposal.valid_until ? ` · valid until ${proposal.valid_until}` : ""}
          </p>
        </div>
        <PrintButton />
      </header>

      <div className="[&_section]:break-inside-avoid">
        <ProposalView proposal={proposal} audience="client" />
      </div>

      <footer className="mt-12 border-t border-hairline pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        Kerning AI — confidential. Prepared for the named client only.
      </footer>
    </main>
  );
}
