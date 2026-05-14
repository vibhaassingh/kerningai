import { redirect } from "next/navigation";

import { ModuleStub } from "@/components/portal/ModuleStub";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function PortalReportsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  return (
    <ModuleStub
      number="10"
      eyebrow="Reports"
      heading={
        <>
          Decision-grade <span className="italic text-[var(--color-signal)]">reports</span>.
        </>
      }
      description="Executive summaries, audit packs, energy and emissions exports — all rendered against the same governed metric layer the floor uses."
      existing={[
        { label: "Monthly operating", value: "Ready" },
        { label: "Audit pack", value: "Ready" },
        { label: "ESG / Scope 2", value: "Q4" },
      ]}
      comingNext={[
        "PDF + CSV exports via Vercel Cron",
        "Scheduled board-ready monthly report email",
        "Custom report builder against the metric layer",
        "Signature requests for compliance attestations",
      ]}
    />
  );
}
