import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatDate, formatMoney, formatModule } from "@/lib/admin/format";
import { createClient } from "@/lib/supabase/server";
import { hasPermissionAny } from "@/lib/auth/require";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

export default async function PortalBillingPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");
  if (!(await hasPermissionAny("view_billing"))) redirect("/portal/dashboard");

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("client_settings")
    .select("industry, deployment_type, modules_enabled, mrr_cents, currency, renewal_date")
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  type S = {
    industry: string | null;
    deployment_type: string | null;
    modules_enabled: string[] | null;
    mrr_cents: number;
    currency: string;
    renewal_date: string | null;
  };
  const s = (settings as S | null) ?? {
    industry: null,
    deployment_type: null,
    modules_enabled: [],
    mrr_cents: 0,
    currency: "EUR",
    renewal_date: null,
  };

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="13">Billing</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Your <span className="italic text-[var(--color-signal)]">subscription</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Plan summary and modules currently enabled. Invoices + payment
          methods ship in the next phase.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Cell label="01 — MRR" value={formatMoney(s.mrr_cents, s.currency)} />
        <Cell label="02 — Renewal" value={formatDate(s.renewal_date)} />
        <Cell label="03 — Deployment" value={s.deployment_type ? formatModule(s.deployment_type) : "—"} />
        <Cell label="04 — Industry" value={s.industry ? formatModule(s.industry) : "—"} />
      </section>

      <section className="space-y-4">
        <Eyebrow number="02">Modules enabled</Eyebrow>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {(s.modules_enabled ?? []).map((m) => (
            <li key={m} className="bg-bg-elev/40 px-5 py-4 text-text">
              {formatModule(m)}
            </li>
          ))}
          {(!s.modules_enabled || s.modules_enabled.length === 0) && (
            <li className="bg-bg-elev/40 px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)] sm:col-span-2 lg:col-span-3">
              No modules enabled yet.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 p-8 text-[13.5px] leading-relaxed text-[var(--color-text-faded)]">
        <Eyebrow number="03">Next phase</Eyebrow>
        <ul className="mt-4 space-y-1.5">
          <li>— Invoice list + PDF download</li>
          <li>— Module / site / usage pricing toggles</li>
          <li>— Payment method management</li>
          <li>— Renewal proposal generation</li>
        </ul>
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {label}
      </p>
      <p className="text-stat text-[1.6rem] font-medium text-text">{value}</p>
    </article>
  );
}
