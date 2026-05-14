import { redirect } from "next/navigation";

import { ModuleStub } from "@/components/portal/ModuleStub";
import { hasPermissionAny } from "@/lib/auth/require";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Integrations" };
export const dynamic = "force-dynamic";

export default async function PortalIntegrationsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("view_integrations"))) redirect("/portal/dashboard");

  return (
    <ModuleStub
      number="11"
      eyebrow="Integrations"
      heading={
        <>
          What's <span className="italic text-[var(--color-signal)]">connected</span>.
        </>
      }
      description="Every connector, webhook endpoint, and API key your workspace owns. Phase 4c lights up the live config UI and sync log viewer."
      existing={[
        { label: "Webhook receiver", value: "Ready" },
        { label: "API key vault", value: "Ready" },
        { label: "Connectors live", value: "0" },
      ]}
      comingNext={[
        "Connector catalog (ERP / POS / BMS / IoT / Email / Calendar)",
        "Credential vault with rotation reminders",
        "Sync schedule + retry policy per connector",
        "Webhook event viewer + redelivery",
        "Per-key rate-limit visualisation",
      ]}
    />
  );
}
