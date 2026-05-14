import { notFound, redirect } from "next/navigation";

import { BlueprintView } from "@/components/admin/BlueprintView";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { getBlueprintDetail } from "@/lib/admin/blueprints";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Blueprint" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

export default async function PortalBlueprintPage({ params }: PageProps) {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const { blueprintId } = await params;
  const blueprint = await getBlueprintDetail(blueprintId);

  // RLS keeps non-approved blueprints invisible. If we got nothing back,
  // either it doesn't exist for this client or it isn't approved yet.
  if (!blueprint) notFound();
  if (
    blueprint.status !== "approved_for_client" ||
    blueprint.organization_id !== ctx.organizationId
  ) {
    notFound();
  }

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="00">Your blueprint</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          The plan we built for{" "}
          <span className="italic text-[var(--color-signal)]">
            {ctx.organizationName}
          </span>
          .
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Based on the discovery you completed. Review with your team —
          we'll refine the scope on the next call.
        </p>
        {blueprint.approved_at && (
          <p className="text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Approved {formatRelative(blueprint.approved_at)} · v{blueprint.version}
          </p>
        )}
      </header>

      <BlueprintView blueprint={blueprint} audience="client" />
    </div>
  );
}
