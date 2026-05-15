import { redirect } from "next/navigation";

import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatDate } from "@/lib/admin/format";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

interface ReportTemplateRow {
  slug: string;
  name: string;
  description: string;
  cadence: string;
  next_run: string;
  module: string;
}

const REPORT_TEMPLATES: ReportTemplateRow[] = [
  {
    slug: "executive_monthly",
    name: "Executive monthly operating report",
    description:
      "Revenue, contribution, downtime, energy, agent-attributed savings. Board-ready PDF.",
    cadence: "Monthly",
    next_run: "First Monday of the next month",
    module: "Decision Intelligence",
  },
  {
    slug: "energy_savings",
    name: "Energy savings + emissions ledger",
    description:
      "kWh by site, peak-shave attribution, scope-2 emissions ledger, ESG-ready CSV export.",
    cadence: "Monthly",
    next_run: "Last day of the month",
    module: "Energy",
  },
  {
    slug: "audit_pack",
    name: "Compliance audit pack",
    description:
      "FSMS / ISO checklists, temperature logs, corrective actions, evidence files.",
    cadence: "Per audit run",
    next_run: "Generated when an audit closes",
    module: "Compliance",
  },
  {
    slug: "maintenance_forecast",
    name: "Maintenance forecast",
    description:
      "Asset-by-asset failure forecast, recommended work orders, spare-parts requisition.",
    cadence: "Weekly",
    next_run: "Monday 06:00 UTC",
    module: "Predictive Maintenance",
  },
  {
    slug: "agent_action_ledger",
    name: "Agent action ledger",
    description:
      "Every recommendation + decision over the period, signed by approver, audit-trail PDF.",
    cadence: "Monthly",
    next_run: "First of the next month",
    module: "Agents",
  },
];

export default async function PortalReportsPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const columns: DataTableColumn<ReportTemplateRow>[] = [
    {
      key: "name",
      header: "Report",
      cell: (r) => (
        <div className="space-y-0.5">
          <div className="text-text">{r.name}</div>
          <div className="text-[11.5px] text-[var(--color-text-muted)]">
            {r.description}
          </div>
        </div>
      ),
      className: "w-[52%]",
    },
    {
      key: "module",
      header: "Module",
      cell: (r) => (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-faded)]">
          {r.module}
        </span>
      ),
    },
    {
      key: "cadence",
      header: "Cadence",
      cell: (r) => r.cadence,
    },
    {
      key: "next",
      header: "Next run",
      cell: (r) => (
        <span className="text-[12.5px] text-[var(--color-text-faded)]">
          {r.next_run}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="10">Reports</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Decision-grade <span className="italic text-[var(--color-signal)]">reports</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Catalogue of reports your workspace can generate. PDF + CSV
          rendering runs through Vercel Cron + the metric layer. The
          generator surface ships in Phase 4d.
        </p>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Tile number="01" label="Templates available" value={REPORT_TEMPLATES.length.toString()} />
        <Tile number="02" label="Generated this month" value="0" />
        <Tile number="03" label="Last delivery" value={formatDate(null)} />
      </section>

      <DataTable
        rows={REPORT_TEMPLATES}
        columns={columns}
        rowKey={(r) => r.slug}
        emptyState="No report templates defined."
      />

      <section className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 p-8 text-[13.5px] leading-relaxed text-[var(--color-text-faded)]">
        <Eyebrow number="04">Coming next</Eyebrow>
        <ul className="mt-4 space-y-1.5">
          <li>— On-demand "Generate now" button per template</li>
          <li>— Scheduled email delivery to a chosen distribution list</li>
          <li>— PDF rendering via Vercel serverless function</li>
          <li>— Custom report builder against the metric layer</li>
        </ul>
      </section>
    </div>
  );
}

function Tile({ number, label, value }: { number: string; label: string; value: string }) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-stat text-[1.6rem] font-medium text-text">{value}</p>
    </article>
  );
}
