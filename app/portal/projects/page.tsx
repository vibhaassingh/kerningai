import Link from "next/link";

import { ClientShell } from "@/components/portal/ClientShell";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listProjectsForOrg } from "@/lib/projects/projects";
import { getUserMemberships } from "@/lib/tenancy/current-org";

export const metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  discovery: "Discovery",
  proposal: "Proposal",
  implementation: "Implementation",
  live: "Live",
  archived: "Archived",
  on_hold: "On hold",
};

export default async function PortalProjectsPage() {
  const memberships = await getUserMemberships();
  const client = memberships.find((m) => m.organizationType === "client");

  return (
    <ClientShell>
      <div className="space-y-10">
        <header className="space-y-3">
          <Eyebrow number="01">Projects</Eyebrow>
          <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
            Projects & Workflow
          </h1>
          <p className="text-[14px] text-[var(--color-text-faded)]">
            Workflow canvases the Kerning team has shared with you.
          </p>
        </header>

        {!client ? (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            Your account isn&apos;t linked to a client organisation yet.
          </p>
        ) : (
          <ProjectList orgId={client.organizationId} />
        )}
      </div>
    </ClientShell>
  );
}

async function ProjectList({ orgId }: { orgId: string }) {
  const projects = await listProjectsForOrg(orgId);

  if (projects.length === 0) {
    return (
      <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
        No projects shared yet.
      </p>
    );
  }

  return (
    <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
      {projects.map((p) => (
        <li key={p.id} className="bg-bg-elev/40 px-5 py-5">
          <Link
            href={`/portal/projects/${p.id}/overview`}
            className="block space-y-2 hover:text-[var(--color-signal)]"
          >
            <header className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[1.05rem] tracking-[-0.01em] text-text">
                {p.name}
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                {STATUS_LABEL[p.status]}
              </span>
            </header>
            {p.business_label && (
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {p.business_label}
              </p>
            )}
            {p.description && (
              <p className="text-[13px] text-[var(--color-text-faded)]">
                {p.description}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
