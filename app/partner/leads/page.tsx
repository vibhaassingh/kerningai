import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getCurrentPartnerOrgId, listPartnerLeads } from "@/lib/partner/partner";

export const metadata = { title: "My Leads" };
export const dynamic = "force-dynamic";

export default async function PartnerLeadsPage() {
  const partnerOrgId = await getCurrentPartnerOrgId();
  if (!partnerOrgId) return null;

  const leads = await listPartnerLeads(partnerOrgId);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Eyebrow number="01">My leads</Eyebrow>
        <h1 className="font-display text-[1.6rem] tracking-[-0.01em] text-text">
          Leads you&apos;ve referred
        </h1>
      </header>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
          No leads yet. Submit your first lead from the dashboard.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {leads.map((l) => (
            <li
              key={l.id}
              className="grid gap-2 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_140px_140px_120px]"
            >
              <div>
                <p className="text-[14px] text-text">{l.contact_name}</p>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {l.company_name}
                </p>
              </div>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-signal)]">
                {l.status}
              </p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]">
                {l.source}
              </p>
              <p className="text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]">
                {new Date(l.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
