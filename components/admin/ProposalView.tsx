import { Eyebrow } from "@/components/primitives/Eyebrow";
import type { ProposalDetail } from "@/lib/admin/proposals";

interface ProposalViewProps {
  proposal: ProposalDetail;
  audience?: "admin" | "client";
}

const SCOPE_GROUPS: {
  kind: ProposalDetail["scope_items"][number]["kind"];
  label: string;
}[] = [
  { kind: "in_scope", label: "In scope" },
  { kind: "out_of_scope", label: "Out of scope" },
  { kind: "assumption", label: "Assumptions" },
  { kind: "dependency", label: "Dependencies" },
];

const BASIS_LABEL: Record<string, string> = {
  fixed: "Fixed",
  time_and_materials: "Time & materials",
  license: "License",
  subscription: "Subscription",
  one_time: "One-time",
};

export function ProposalView({ proposal, audience = "admin" }: ProposalViewProps) {
  const totalWeeks = proposal.phases.reduce(
    (acc, p) => acc + p.duration_weeks,
    0,
  );
  const money = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: proposal.currency || "INR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-12">
      {/* Summary + commercial header */}
      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-[1.2fr_0.8fr]">
        <article className="space-y-4 bg-bg-elev/40 px-7 py-7">
          <Eyebrow number="01">Summary</Eyebrow>
          <p className="text-[15.5px] leading-relaxed text-text">
            {proposal.summary ?? "—"}
          </p>
          {proposal.executive_brief && (
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--color-text-faded)]">
              {proposal.executive_brief}
            </p>
          )}
        </article>
        <article className="space-y-5 bg-bg-elev/40 px-7 py-7">
          <Eyebrow number="02">Commercials</Eyebrow>
          <div className="space-y-1">
            <p className="text-stat text-[2.6rem] font-medium leading-none text-text tabular-nums">
              {money(proposal.total_amount)}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
              {proposal.currency} · {proposal.status.replace("_", " ")}
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              Timeline
            </p>
            <p className="text-[14px] text-text">
              {totalWeeks} weeks across {proposal.phases.length} phases
            </p>
          </div>
          {proposal.valid_until && (
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                Valid until
              </p>
              <p className="text-[14px] text-[var(--color-text-faded)]">
                {proposal.valid_until}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              Version
            </p>
            <p className="text-[14px] text-[var(--color-text-faded)]">
              v{proposal.version}
              {audience === "admin"
                ? ` · ${proposal.generated_by.replace("_", " ")}`
                : ""}
            </p>
          </div>
        </article>
      </section>

      {/* Scope */}
      <section className="space-y-4">
        <Eyebrow number="03">Scope</Eyebrow>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
          {SCOPE_GROUPS.map((g) => {
            const items = proposal.scope_items.filter((s) => s.kind === g.kind);
            if (items.length === 0) return null;
            return (
              <div key={g.kind} className="space-y-3 bg-bg-elev/40 px-6 py-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                  {g.label}
                </p>
                <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-[var(--color-text-faded)]">
                  {items.map((s) => (
                    <li key={s.id}>· {s.description}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Phases */}
      <section className="space-y-4">
        <Eyebrow number="04">Delivery phases</Eyebrow>
        <ol className="space-y-3">
          {proposal.phases.map((p) => (
            <li
              key={p.id}
              className="grid gap-4 rounded-2xl border border-hairline bg-bg-elev/30 p-6 lg:grid-cols-[150px_1fr_1fr]"
            >
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                  Phase {String(p.position).padStart(2, "0")}
                </p>
                <p className="text-text">{p.duration_weeks}w</p>
                {p.price != null && (
                  <p className="text-[12.5px] text-[var(--color-signal)] tabular-nums">
                    {money(p.price)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-text">{p.name}</p>
                {p.description && (
                  <p className="text-[13.5px] leading-relaxed text-[var(--color-text-faded)]">
                    {p.description}
                  </p>
                )}
              </div>
              <div className="space-y-3 text-[12.5px]">
                {p.owners.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                      Owners
                    </p>
                    <p className="text-[var(--color-text-faded)]">
                      {p.owners.join(" · ")}
                    </p>
                  </div>
                )}
                {p.deliverables.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                      Deliverables
                    </p>
                    <ul className="space-y-0.5 text-[var(--color-text-faded)]">
                      {p.deliverables.map((d) => (
                        <li key={d}>· {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Modules */}
      {proposal.modules.length > 0 && (
        <section className="space-y-4">
          <Eyebrow number="05">Modules in scope</Eyebrow>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
            {proposal.modules.map((m) => (
              <li key={m.id} className="space-y-3 bg-bg-elev/40 px-6 py-6">
                <header className="flex items-center justify-between gap-3">
                  <h3 className="text-display text-[1.15rem] tracking-[-0.01em] text-text">
                    {m.module_name}
                  </h3>
                  <span
                    className={
                      m.emphasis === "core"
                        ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                        : m.emphasis === "recommended"
                          ? "rounded-full border border-[var(--color-signal-deep)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)]"
                          : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]"
                    }
                  >
                    {m.emphasis}
                  </span>
                </header>
                <p className="text-[13.5px] leading-relaxed text-[var(--color-text-faded)]">
                  {m.rationale}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Risks */}
      {proposal.risks.length > 0 && (
        <section className="space-y-4">
          <Eyebrow number="06">Risk register</Eyebrow>
          <ul className="space-y-3">
            {proposal.risks.map((r) => (
              <li
                key={r.id}
                className="grid gap-4 rounded-2xl border border-hairline bg-bg-elev/30 p-6 sm:grid-cols-[160px_1fr]"
              >
                <div className="space-y-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                    {r.category}
                  </p>
                  <span
                    className={
                      r.severity === "critical" || r.severity === "high"
                        ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                        : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)]"
                    }
                  >
                    {r.severity}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-text">{r.description}</p>
                  {r.mitigation && (
                    <p className="text-[13px] leading-relaxed text-[var(--color-text-faded)]">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        Mitigation:
                      </span>{" "}
                      {r.mitigation}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Commercials */}
      <section className="space-y-4">
        <Eyebrow number="07">Commercial schedule</Eyebrow>
        <div className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-hairline text-left font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                <th className="px-5 py-3 font-normal">Item</th>
                <th className="px-5 py-3 font-normal">Basis</th>
                <th className="px-5 py-3 text-right font-normal">Qty</th>
                <th className="px-5 py-3 text-right font-normal">Unit rate</th>
                <th className="px-5 py-3 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {proposal.commercials.map((c) => (
                <tr key={c.id} className="border-b border-hairline last:border-b-0">
                  <td className="px-5 py-3 text-text">
                    {c.label}
                    {c.notes && (
                      <span className="block text-[11.5px] text-[var(--color-text-muted)]">
                        {c.notes}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-text-faded)]">
                    {BASIS_LABEL[c.basis] ?? c.basis}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-[var(--color-text-faded)]">
                    {c.quantity}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-[var(--color-text-faded)]">
                    {money(c.unit_rate)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-text">
                    {money(c.amount)}
                  </td>
                </tr>
              ))}
              {proposal.commercials.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-[13px] text-[var(--color-text-muted)]"
                  >
                    No commercial lines yet.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-hairline-strong">
                <td
                  colSpan={4}
                  className="px-5 py-4 text-right font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
                >
                  Total
                </td>
                <td className="px-5 py-4 text-right text-[1.05rem] tabular-nums text-text">
                  {money(proposal.total_amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
