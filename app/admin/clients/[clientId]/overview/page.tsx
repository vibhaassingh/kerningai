import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import {
  getClientDetail,
  listClientMembers,
  listClientSites,
} from "@/lib/admin/clients";
import { formatDate, formatModule, formatRelative } from "@/lib/admin/format";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

interface OverviewProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientOverviewPage({ params }: OverviewProps) {
  const { clientId } = await params;
  const [client, sites, members] = await Promise.all([
    getClientDetail(clientId),
    listClientSites(clientId),
    listClientMembers(clientId),
  ]);
  if (!client) notFound();

  const activeMembers = members.filter((m) => m.status === "active");
  const owner = activeMembers.find((m) => m.role_slug === "client_owner");
  const lastSignIn = activeMembers
    .map((m) => m.last_login_at)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);

  return (
    <div className="space-y-12">
      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-3">
        <Card title="01 — Profile">
          <dl className="space-y-3 text-[13.5px]">
            <Row label="Slug" value={client.slug} mono />
            <Row label="Industry" value={client.industry ? formatModule(client.industry) : "—"} />
            <Row label="Region" value={client.region} />
            <Row label="Created" value={formatDate(client.created_at)} />
            <Row label="Billing email" value={client.billing_email ?? "—"} />
          </dl>
        </Card>
        <Card title="02 — Ownership">
          <dl className="space-y-3 text-[13.5px]">
            <Row label="Client owner" value={owner?.full_name ?? owner?.email ?? "Not assigned"} />
            <Row label="Owner email" value={owner?.email ?? "—"} />
            <Row label="Total members" value={activeMembers.length.toString()} />
            <Row label="Last sign-in" value={lastSignIn ? formatRelative(lastSignIn) : "—"} />
          </dl>
        </Card>
        <Card title="03 — Modules enabled">
          {client.modules_enabled.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              No modules enabled yet.
            </p>
          ) : (
            <ul className="space-y-1.5 text-[13.5px]">
              {client.modules_enabled.map((m) => (
                <li key={m} className="text-text">
                  · {formatModule(m)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <Eyebrow number="04">Latest sites</Eyebrow>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {sites.slice(0, 6).map((s) => (
            <article key={s.id} className="space-y-2 bg-bg-elev/40 px-6 py-5">
              <p className="text-text">{s.name}</p>
              <p className="text-[11.5px] text-[var(--color-text-muted)]">
                {s.city ?? s.region}
                {s.country ? ` · ${s.country}` : ""}
              </p>
            </article>
          ))}
          {sites.length === 0 && (
            <p className="bg-bg-elev/40 px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)] sm:col-span-2 lg:col-span-3">
              No sites yet for this client.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="space-y-5 bg-bg-elev/40 px-6 py-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {title}
      </p>
      {children}
    </article>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-text"
            : "text-text"
        }
      >
        {value}
      </dd>
    </div>
  );
}
