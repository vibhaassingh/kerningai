import { Eyebrow } from "@/components/primitives/Eyebrow";
import type { BlueprintDetail } from "@/lib/admin/blueprints";

interface BlueprintViewProps {
  blueprint: BlueprintDetail;
  /** When true, hides admin-only artifacts (drivers, executive metadata). */
  audience?: "admin" | "client";
}

export function BlueprintView({ blueprint, audience = "admin" }: BlueprintViewProps) {
  const totalWeeks = blueprint.phases.reduce(
    (acc, p) => acc + p.duration_weeks,
    0,
  );

  return (
    <div className="space-y-12">
      {/* Score + summary */}
      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-[1.2fr_0.8fr]">
        <article className="space-y-4 bg-bg-elev/40 px-7 py-7">
          <Eyebrow number="01">Summary</Eyebrow>
          <p className="text-[15.5px] leading-relaxed text-text">
            {blueprint.summary ?? "—"}
          </p>
          {blueprint.executive_brief && (
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-[var(--color-text-faded)]">
              {blueprint.executive_brief}
            </p>
          )}
        </article>
        <article className="space-y-5 bg-bg-elev/40 px-7 py-7">
          <Eyebrow number="02">Complexity</Eyebrow>
          <div className="space-y-1">
            <p className="text-stat text-[3.2rem] font-medium leading-none text-text tabular-nums">
              {blueprint.complexity_score}
              <span className="text-[1rem] text-[var(--color-text-muted)]">/100</span>
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
              {blueprint.complexity_band.replace("_", " ")}
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              Timeline
            </p>
            <p className="text-[14px] text-text">
              {totalWeeks} weeks across {blueprint.phases.length} phases
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
              Generated
            </p>
            <p className="text-[14px] text-[var(--color-text-faded)]">
              {audience === "admin" ? blueprint.generated_by.replace("_", " ") : "Kerning AI"}
            </p>
          </div>
        </article>
      </section>

      {/* Modules */}
      <section className="space-y-4">
        <Eyebrow number="03">Recommended modules</Eyebrow>
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-2">
          {blueprint.modules.map((m) => (
            <li
              key={m.id}
              className="space-y-3 bg-bg-elev/40 px-6 py-6"
            >
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
          {blueprint.modules.length === 0 && (
            <li className="bg-bg-elev/40 px-6 py-10 text-center text-[13px] text-[var(--color-text-muted)] lg:col-span-2">
              No modules recommended yet.
            </li>
          )}
        </ul>
      </section>

      {/* Phases */}
      <section className="space-y-4">
        <Eyebrow number="04">Implementation phases</Eyebrow>
        <ol className="space-y-3">
          {blueprint.phases.map((p) => (
            <li
              key={p.id}
              className="grid gap-4 rounded-2xl border border-hairline bg-bg-elev/30 p-6 lg:grid-cols-[140px_1fr_1fr]"
            >
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
                  Phase {String(p.position + 1).padStart(2, "0")}
                </p>
                <p className="text-text">{p.duration_weeks}w</p>
              </div>
              <div className="space-y-2">
                <p className="text-text">{p.name.replace(/^\d+\s*\/\s*/, "")}</p>
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

      {/* Integrations */}
      {blueprint.integrations.length > 0 && (
        <section className="space-y-4">
          <Eyebrow number="05">Integration map</Eyebrow>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {blueprint.integrations.map((i) => (
              <li
                key={i.id}
                className="space-y-2 bg-bg-elev/40 px-5 py-5"
              >
                <header className="flex items-center justify-between gap-3">
                  <p className="text-text">{i.system}</p>
                  <span
                    className={
                      i.risk === "high"
                        ? "rounded-full bg-[var(--color-signal)]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-signal)]"
                        : "rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]"
                    }
                  >
                    {i.risk}
                  </span>
                </header>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  {i.direction} · {i.frequency}
                </p>
                {i.notes && (
                  <p className="text-[12.5px] text-[var(--color-text-faded)]">
                    {i.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Risks */}
      <section className="space-y-4">
        <Eyebrow number="06">Risk register</Eyebrow>
        <ul className="space-y-3">
          {blueprint.risks.map((r) => (
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

      {/* Checklist */}
      <section className="space-y-4">
        <Eyebrow number="07">Onboarding checklist</Eyebrow>
        <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {blueprint.checklist.map((item) => (
            <li
              key={item.id}
              className="grid gap-4 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[120px_1fr_100px]"
            >
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                {item.category}
              </p>
              <p className="text-[14px] text-text">{item.description}</p>
              <p className="text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-faded)]">
                {item.owner}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
