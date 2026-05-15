import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { listPublishedTemplates } from "@/lib/discovery/templates";

export const metadata: Metadata = {
  title: "Choose a service",
};

export const dynamic = "force-dynamic";

export default async function DiscoveryPickerPage() {
  const templates = await listPublishedTemplates();

  return (
    <div className="space-y-12">
      <header className="space-y-5">
        <Eyebrow number="00">Discovery · pick a service</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Which fits <span className="italic text-[var(--color-signal)]">closest</span>?
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Each questionnaire is shaped for a specific kind of system.
          If you're between two, pick the broader one — we can refine
          later.
        </p>
      </header>

      <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2">
        {templates.map((t, idx) => (
          <li key={t.id}>
            <Link
              href={`/discovery/${t.slug}`}
              className="group flex h-full flex-col gap-4 bg-bg-elev/40 p-8 transition-colors hover:bg-bg-elev/70"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                {String(idx + 1).padStart(2, "0")} — {t.service.replace(/_/g, " ")}
              </p>
              <h2 className="text-display text-[1.5rem] tracking-[-0.02em] text-text">
                {t.name}
              </h2>
              <p className="flex-1 text-[14px] leading-relaxed text-[var(--color-text-faded)]">
                {t.description}
              </p>
              <p className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                <span>{t.estimated_minutes ?? 10} min · 9 sections</span>
                <span className="text-text group-hover:text-[var(--color-signal)]">
                  Start ↗
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {templates.length === 0 && (
        <p className="text-[14px] text-[var(--color-text-muted)]">
          No questionnaires published yet. Contact{" "}
          <Link href="/contact" className="nav-link text-text">
            hello@kerningai.eu
          </Link>{" "}
          and we'll route the discovery manually.
        </p>
      )}
    </div>
  );
}
