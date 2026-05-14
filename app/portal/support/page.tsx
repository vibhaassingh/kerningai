import { redirect } from "next/navigation";

import { ModuleStub } from "@/components/portal/ModuleStub";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function PortalSupportPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  return (
    <ModuleStub
      number="12"
      eyebrow="Support"
      heading={
        <>
          Talk to <span className="italic text-[var(--color-signal)]">Kerning</span>.
        </>
      }
      description="Open a ticket, browse runbooks, or escalate live. The full ticket interface ships next — for now reach the team via hello@kerningai.eu."
      existing={[
        { label: "SLA target", value: "P1 · 1h" },
        { label: "On-call rotation", value: "24/7" },
        { label: "Runbooks", value: "Internal" },
      ]}
      comingNext={[
        "Ticket inbox with severity + SLA tracking",
        "Internal + client-visible thread split",
        "Attachment upload to support-attachments bucket",
        "Auto-route by client + module",
        "Public knowledge base + product changelog",
      ]}
    />
  );
}
