import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { GenerateBlueprintButton } from "@/components/admin/GenerateBlueprintButton";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { getLatestBlueprintForSubmission } from "@/lib/admin/blueprints";
import {
  getSubmissionDetail,
  type SubmissionAnswer,
} from "@/lib/admin/submissions";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Submission" };
export const dynamic = "force-dynamic";

interface SubmissionDetailPageProps {
  params: Promise<{ submissionId: string }>;
}

export default async function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  const canView = await hasPermissionAny("review_questionnaire_submissions");
  if (!canView) redirect("/admin");

  const { submissionId } = await params;
  const [submission, latestBlueprint] = await Promise.all([
    getSubmissionDetail(submissionId),
    getLatestBlueprintForSubmission(submissionId),
  ]);
  if (!submission) notFound();
  const canGenerate =
    submission.status !== "draft" &&
    ((await hasPermissionAny("manage_questionnaires")) ||
      (await hasPermissionAny("approve_solution_blueprints")));

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link
            href="/admin/questionnaires/submissions"
            className="nav-link hover:text-text"
          >
            ← Submissions
          </Link>
          <span>·</span>
          <span>{submission.template_name}</span>
          <span>·</span>
          <span>v{submission.template_version}</span>
        </div>
        <h1 className="text-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          {submission.submitter_company ??
            submission.submitter_name ??
            "Anonymous submission"}
        </h1>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          {submission.submitter_name && submission.submitter_email
            ? `${submission.submitter_name} · ${submission.submitter_email}`
            : submission.submitter_email ?? "—"}
          {submission.submitter_role && ` · ${submission.submitter_role}`}
        </p>
      </header>

      {canGenerate && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-bg-elev/30 px-7 py-5">
          <div className="space-y-1">
            <Eyebrow number="00">Blueprint</Eyebrow>
            {latestBlueprint ? (
              <p className="text-[14px] text-text">
                v{latestBlueprint.version} ·{" "}
                <Link
                  href={`/admin/solution-blueprints/${latestBlueprint.id}`}
                  className="text-[var(--color-signal)] hover:underline"
                >
                  Open ↗
                </Link>
                <span className="ml-2 text-[var(--color-text-faded)]">
                  {latestBlueprint.status.replace(/_/g, " ")}
                </span>
              </p>
            ) : (
              <p className="text-[14px] text-[var(--color-text-faded)]">
                No blueprint yet — run the generator to produce one.
              </p>
            )}
          </div>
          <GenerateBlueprintButton
            submissionId={submission.id}
            hasExisting={!!latestBlueprint}
          />
        </section>
      )}

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        <Stat number="01" label="Status" value={submission.status.replace(/_/g, " ")} />
        <Stat
          number="02"
          label="Submitted"
          value={
            submission.submitted_at
              ? formatRelative(submission.submitted_at)
              : "Draft"
          }
        />
        <Stat
          number="03"
          label="Started"
          value={formatRelative(submission.started_at)}
        />
        <Stat
          number="04"
          label="Lead"
          value={
            submission.lead_id ? (
              <Link
                href={`/admin/leads/${submission.lead_id}`}
                className="text-[var(--color-signal)] hover:underline"
              >
                Open ↗
              </Link>
            ) : (
              "—"
            )
          }
        />
      </section>

      <div className="space-y-10">
        {submission.sections.map((section) => (
          <section
            key={section.id}
            className="space-y-6 rounded-2xl border border-hairline bg-bg-elev/30 p-8"
          >
            <header className="space-y-2">
              <Eyebrow number={String(section.number).padStart(2, "0")}>
                {section.title.replace(/^\d+\s*\/\s*/, "")}
              </Eyebrow>
              {section.description && (
                <p className="text-[13.5px] text-[var(--color-text-faded)]">
                  {section.description}
                </p>
              )}
            </header>

            <dl className="space-y-6 divide-y divide-hairline">
              {section.answers.map((a) => (
                <AnswerRow key={a.question_id} answer={a} />
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}

function Stat({
  number,
  label,
  value,
}: {
  number: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <article className="space-y-2 bg-bg-elev/40 px-6 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
        {number} — {label}
      </p>
      <p className="text-text capitalize">{value}</p>
    </article>
  );
}

function AnswerRow({ answer }: { answer: SubmissionAnswer }) {
  return (
    <div className="space-y-2 pt-6 first:pt-0">
      <dt className="text-[13.5px] text-text">{answer.question_label}</dt>
      <dd className="text-[14px] text-[var(--color-text-faded)]">
        <AnswerValue answer={answer} />
      </dd>
    </div>
  );
}

function AnswerValue({ answer }: { answer: SubmissionAnswer }) {
  const v = answer.value;
  if (v == null || v === "")
    return <span className="text-[var(--color-text-faint)]">—</span>;

  if (answer.question_kind === "boolean") {
    return <span className="text-text">{v === true ? "Yes" : "No"}</span>;
  }

  if (answer.question_kind === "single_select") {
    const label = answer.options.find((o) => o.value === v)?.label ?? String(v);
    return (
      <span className="rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-signal)]">
        {label}
      </span>
    );
  }

  if (answer.question_kind === "multi_select" && Array.isArray(v)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(v as string[]).map((val) => (
          <span
            key={val}
            className="rounded-full border border-hairline px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-text-faded)]"
          >
            {answer.options.find((o) => o.value === val)?.label ?? val}
          </span>
        ))}
      </div>
    );
  }

  if (typeof v === "number") {
    return <span className="font-mono tabular-nums text-text">{v}</span>;
  }

  if (typeof v === "string") {
    return <p className="whitespace-pre-line text-text">{v}</p>;
  }

  return (
    <pre className="overflow-x-auto rounded bg-bg/60 p-3 font-mono text-[12px]">
      {JSON.stringify(v, null, 2)}
    </pre>
  );
}
