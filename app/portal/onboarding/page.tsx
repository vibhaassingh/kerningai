import Link from "next/link";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/primitives/Eyebrow";
import { LiquidPill } from "@/components/primitives/LiquidPill";
import { createClient } from "@/lib/supabase/server";
import { getPortalContext } from "@/lib/portal/team";

export const metadata = { title: "Onboarding" };
export const dynamic = "force-dynamic";

export default async function PortalOnboardingPage() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal");

  const supabase = await createClient();
  const { data: blueprints } = await supabase
    .from("solution_blueprints")
    .select(
      "id, version, status, complexity_score, complexity_band, summary, approved_at, generated_at, submission:questionnaire_submissions(submitter_name, submitter_company, template:questionnaire_templates(name))",
    )
    .eq("organization_id", ctx.organizationId)
    .order("generated_at", { ascending: false });

  type BP = {
    id: string;
    version: number;
    status: string;
    complexity_score: number;
    complexity_band: string;
    summary: string | null;
    approved_at: string | null;
    generated_at: string;
    submission: {
      submitter_name: string | null;
      submitter_company: string | null;
      template: { name: string } | null;
    } | null;
  };
  const rows = ((blueprints ?? []) as unknown as BP[]) ?? [];
  const approved = rows.find((r) => r.status === "approved_for_client");

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="09">Onboarding</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Your <span className="italic text-[var(--color-signal)]">discovery</span> + blueprint.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Discovery submissions and the blueprints they produce live
          here. Start a new discovery any time to scope another system
          or module.
        </p>
      </header>

      <section className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-bg-elev/30 px-7 py-5">
        <div className="space-y-1">
          <Eyebrow number="00">Start a new discovery</Eyebrow>
          <p className="text-[14px] text-[var(--color-text-faded)]">
            Same questionnaire engine as the public flow — answers attach
            to your workspace and are routed straight to your Client
            Success Manager.
          </p>
        </div>
        <LiquidPill href="/discovery" variant="accent">
          Open discovery
        </LiquidPill>
      </section>

      <section className="space-y-4">
        <Eyebrow number="01">Your blueprints</Eyebrow>
        {approved ? (
          <Link
            href={`/portal/blueprint/${approved.id}`}
            className="block rounded-2xl border border-[var(--color-signal-deep)]/40 bg-bg-elev/40 p-8 transition-colors hover:border-[var(--color-signal)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                  Approved for client · v{approved.version}
                </p>
                <p className="text-display text-[1.4rem] tracking-[-0.02em] text-text">
                  {approved.submission?.template?.name ?? "Discovery"}
                </p>
                <p className="text-[13.5px] text-[var(--color-text-faded)]">
                  {approved.summary}
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-signal)]/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                {approved.complexity_score}/100 · {approved.complexity_band.replace("_", " ")}
              </span>
            </div>
          </Link>
        ) : (
          <p className="rounded-2xl border border-dashed border-hairline bg-bg-elev/20 px-6 py-10 text-center text-[13.5px] text-[var(--color-text-muted)]">
            No approved blueprint yet. Once Kerning reviews your
            submission, the blueprint surfaces here.
          </p>
        )}

        {rows.length > 0 && (
          <ul className="space-y-2 text-[13px]">
            {rows
              .filter((r) => r.id !== approved?.id)
              .map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-bg-elev/30 px-5 py-3"
                >
                  <span className="text-[var(--color-text-faded)]">
                    v{r.version} · {r.status.replace(/_/g, " ")}
                  </span>
                  <span className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {r.complexity_score}/100 · {r.complexity_band.replace("_", " ")}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
