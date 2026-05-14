import { redirect } from "next/navigation";

import { ModuleStub } from "@/components/portal/ModuleStub";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function PortalDocumentsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  return (
    <ModuleStub
      number="11"
      eyebrow="Documents"
      heading={
        <>
          Every <span className="italic text-[var(--color-signal)]">document</span>, in one place.
        </>
      }
      description="Contracts, SOWs, runbooks, audit evidence, SOPs. Storage is wired to Supabase Storage buckets with per-org RLS; the upload + browse UI ships next."
      existing={[
        { label: "Storage buckets", value: "7" },
        { label: "Contracts bucket", value: "Ready" },
        { label: "Compliance evidence", value: "Ready" },
      ]}
      comingNext={[
        "Drag-drop upload with signed-URL provisioning",
        "Folder navigation + permission-per-folder",
        "Document version history",
        "DocuSign / e-signature handoff for SOWs",
      ]}
    />
  );
}
