import { redirect } from "next/navigation";

import { ModuleStub } from "@/components/portal/ModuleStub";
import { listAssetsForClient } from "@/lib/portal/maintenance";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Ontology Explorer" };
export const dynamic = "force-dynamic";

export default async function PortalOntologyPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const assets = await listAssetsForClient(ctx.organizationId);
  const siteCount = new Set(assets.map((a) => a.site_id).filter(Boolean)).size;

  return (
    <ModuleStub
      number="08"
      eyebrow="Ontology · operational graph"
      heading={
        <>
          Your <span className="italic text-[var(--color-signal)]">operational graph</span>.
        </>
      }
      description="Every site, asset, sensor, person, supplier, recipe, regulation and workflow as a single typed graph. Phase 4c lights up the interactive explorer; this page is the index."
      existing={[
        { label: "Sites in graph", value: siteCount.toString() },
        { label: "Assets in graph", value: assets.length.toString() },
        { label: "Sensors in graph", value: "0" },
        { label: "Active relationships", value: "—" },
        { label: "Data lineage records", value: "—" },
        { label: "Knowledge documents", value: "—" },
      ]}
      comingNext={[
        "Graph view + entity drawer with cursor-reactive layout",
        "Lineage timeline tied to ingestion jobs",
        "Knowledge-document upload + vector index",
        "Entity resolution job runner (cross-source dedupe)",
        "Schema versioning + approval workflow",
      ]}
    />
  );
}
