import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuestionnaireStepper } from "@/components/discovery/QuestionnaireStepper";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { getPublishedTemplateBySlug } from "@/lib/discovery/templates";
import {
  beginSubmission,
  findActiveSubmission,
  getCurrentAnswers,
} from "@/lib/discovery/actions";

export const dynamic = "force-dynamic";

interface DiscoveryPageProps {
  params: Promise<{ serviceSlug: string }>;
}

export async function generateMetadata({
  params,
}: DiscoveryPageProps): Promise<Metadata> {
  const { serviceSlug } = await params;
  const template = await getPublishedTemplateBySlug(serviceSlug);
  if (!template) return { title: "Discovery" };
  return {
    title: template.name,
    description: template.description ?? undefined,
  };
}

export default async function DiscoveryServicePage({
  params,
}: DiscoveryPageProps) {
  const { serviceSlug } = await params;
  const template = await getPublishedTemplateBySlug(serviceSlug);
  if (!template) notFound();

  // Cookies can only be set inside Server Actions or Route Handlers, so
  // the page reads-only here. If the prospect hasn't started yet, show
  // the intro card with a Begin button that POSTs into the
  // `beginSubmission` Server Action, which writes the cookie + redirects.
  const submissionId = await findActiveSubmission(serviceSlug);

  if (!submissionId) {
    return <Intro template={template} />;
  }

  const initialAnswers = await getCurrentAnswers();

  return (
    <article className="space-y-12">
      <header className="space-y-5">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link href="/discovery" className="nav-link hover:text-text">
            ← Services
          </Link>
          <span>·</span>
          <span>{template.estimated_minutes ?? 10} min</span>
        </div>
        <Eyebrow number="00">{template.intro_eyebrow ?? "Discovery"}</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          {template.intro_heading ?? template.name}
        </h1>
        {template.intro_body && (
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
            {template.intro_body}
          </p>
        )}
        <p className="text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-faint)]">
          Submission · {submissionId.slice(0, 8)}
        </p>
      </header>

      <QuestionnaireStepper template={template} initialAnswers={initialAnswers} />
    </article>
  );
}

function Intro({
  template,
}: {
  template: Awaited<ReturnType<typeof getPublishedTemplateBySlug>>;
}) {
  if (!template) return null;
  const sectionLabels = template.sections.map((s) =>
    s.title.replace(/^\d+\s*\/\s*/, ""),
  );

  return (
    <article className="space-y-12">
      <header className="space-y-5">
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link href="/discovery" className="nav-link hover:text-text">
            ← Services
          </Link>
          <span>·</span>
          <span>{template.estimated_minutes ?? 10} min</span>
        </div>
        <Eyebrow number="00">{template.intro_eyebrow ?? "Discovery"}</Eyebrow>
        <h1 className="text-display text-[clamp(2.2rem,5.5vw,3.2rem)] font-medium leading-[1.02] tracking-[-0.03em]">
          {template.intro_heading ?? template.name}
        </h1>
        {template.intro_body && (
          <p className="max-w-xl text-[15.5px] leading-relaxed text-[var(--color-text-faded)]">
            {template.intro_body}
          </p>
        )}
      </header>

      <section className="space-y-4 rounded-2xl border border-hairline bg-bg-elev/30 p-8">
        <Eyebrow number="01">What we'll ask</Eyebrow>
        <ol className="grid gap-x-8 gap-y-1.5 text-[14px] text-[var(--color-text-faded)] sm:grid-cols-2">
          {sectionLabels.map((label, idx) => (
            <li key={label}>
              <span className="font-mono text-[12px] text-[var(--color-text-muted)] mr-2">
                {String(idx + 1).padStart(2, "0")}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </section>

      <form
        action={beginSubmission}
        className="flex items-center justify-between gap-4 border-t border-hairline pt-8"
      >
        <input type="hidden" name="templateSlug" value={template.slug} />
        <p className="text-[12.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Autosaves as you type · ~{template.estimated_minutes ?? 10} min
        </p>
        <LiquidPillButton type="submit" variant="accent">
          Begin
        </LiquidPillButton>
      </form>
    </article>
  );
}
