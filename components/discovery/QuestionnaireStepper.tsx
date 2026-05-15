"use client";

import { useCallback, useMemo, useState, useTransition } from "react";

import { LiquidPillButton } from "@/components/primitives/LiquidPill";
import { QuestionRenderer } from "@/components/discovery/QuestionRenderer";
import { saveAnswer, submitSubmission } from "@/lib/discovery/actions";
import type {
  QuestionnaireSection,
  QuestionnaireTemplate,
} from "@/lib/discovery/templates";
import { cn } from "@/lib/cn";

interface QuestionnaireStepperProps {
  template: QuestionnaireTemplate;
  initialAnswers: Record<string, unknown>;
}

export function QuestionnaireStepper({
  template,
  initialAnswers,
}: QuestionnaireStepperProps) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingError, setSavingError] = useState<Record<string, string | null>>({});

  const [submitPending, startSubmitTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const section: QuestionnaireSection | undefined = template.sections[sectionIdx];
  const isLast = sectionIdx === template.sections.length - 1;

  const setValue = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const commit = useCallback(
    async (questionId: string) => {
      const valueJson = JSON.stringify(answers[questionId] ?? null);
      setSavingId(questionId);
      setSavingError((prev) => ({ ...prev, [questionId]: null }));
      const fd = new FormData();
      fd.set("questionId", questionId);
      fd.set("valueJson", valueJson);
      const res = await saveAnswer(undefined, fd);
      setSavingId(null);
      if (!res.ok) {
        setSavingError((prev) => ({ ...prev, [questionId]: res.error }));
      }
    },
    [answers],
  );

  // Use a closure that reads the latest `answers` at call time.
  const commitLatest = useCallback(
    (questionId: string) => {
      void commit(questionId);
    },
    [commit],
  );

  // Validate section requireds before allowing Next.
  const sectionIsValid = useMemo(() => {
    if (!section) return true;
    for (const q of section.questions) {
      if (!q.required) continue;
      const v = answers[q.id];
      if (v == null) return false;
      if (typeof v === "string" && v.trim() === "") return false;
      if (Array.isArray(v) && v.length === 0) return false;
    }
    return true;
  }, [answers, section]);

  function onNext() {
    if (!sectionIsValid) return;
    setSectionIdx((i) => Math.min(template.sections.length - 1, i + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function onBack() {
    setSectionIdx((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onFinalSubmit(formData: FormData) {
    setSubmitError(null);
    startSubmitTransition(async () => {
      const res = await submitSubmission(undefined, formData);
      if (res && !res.ok) {
        setSubmitError(res.error);
      }
    });
  }

  if (!section) return null;

  return (
    <div className="space-y-12">
      <StepperRail
        sections={template.sections}
        current={sectionIdx}
        answers={answers}
        onJump={(i) => setSectionIdx(i)}
      />

      <header className="space-y-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          {section.title}
        </p>
        {section.description && (
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
            {section.description}
          </p>
        )}
      </header>

      <div className="space-y-10">
        {section.questions.map((q) => (
          <QuestionRenderer
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={(v) => setValue(q.id, v)}
            onCommit={() => commitLatest(q.id)}
            saving={savingId === q.id}
            error={savingError[q.id] ?? null}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-hairline pt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={sectionIdx === 0}
          className="nav-link text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] disabled:opacity-30"
        >
          ← Back
        </button>

        {!isLast ? (
          <LiquidPillButton
            type="button"
            variant="accent"
            onClick={onNext}
            disabled={!sectionIsValid}
          >
            Next section
          </LiquidPillButton>
        ) : (
          <span className="text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Last section · scroll down to submit
          </span>
        )}
      </div>

      {isLast && (
        <FinalSubmit
          submit={onFinalSubmit}
          pending={submitPending}
          error={submitError}
          sectionValid={sectionIsValid}
        />
      )}
    </div>
  );
}

function StepperRail({
  sections,
  current,
  answers,
  onJump,
}: {
  sections: QuestionnaireSection[];
  current: number;
  answers: Record<string, unknown>;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {sections.map((s, idx) => {
        const requiredCount = s.questions.filter((q) => q.required).length;
        const requiredFilled = s.questions.filter(
          (q) => q.required && hasValue(answers[q.id]),
        ).length;
        const done = requiredCount === 0 ? false : requiredFilled === requiredCount;
        const active = idx === current;
        const reachable = idx <= current || done;
        return (
          <li key={s.id}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onJump(idx)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                active
                  ? "border-[var(--color-signal)] text-[var(--color-signal)] bg-[var(--color-signal)]/10"
                  : done
                    ? "border-hairline-strong text-text"
                    : "border-hairline text-[var(--color-text-muted)]",
                !reachable && "opacity-40 cursor-not-allowed",
              )}
            >
              <span>{String(idx + 1).padStart(2, "0")}</span>
              <span className="hidden text-[10px] tracking-[0.08em] sm:inline">
                {s.title.replace(/^\d+\s*\/\s*/, "")}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function FinalSubmit({
  submit,
  pending,
  error,
  sectionValid,
}: {
  submit: (fd: FormData) => void;
  pending: boolean;
  error: string | null;
  sectionValid: boolean;
}) {
  return (
    <section className="space-y-6 rounded-2xl border border-hairline bg-bg-elev/30 p-8">
      <div className="space-y-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
          Submit
        </p>
        <h2 className="text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          Send this through to{" "}
          <span className="italic text-[var(--color-signal)]">Kerning</span>.
        </h2>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          One last thing — who should we send the blueprint to?
        </p>
      </div>

      <form
        action={(fd) => submit(fd)}
        className="grid gap-6 sm:grid-cols-2"
      >
        <Labelled label="Your name *" name="submitterName" required />
        <Labelled label="Email *" name="submitterEmail" type="email" required />
        <Labelled label="Company" name="submitterCompany" />
        <Labelled label="Your role" name="submitterRole" />

        <div className="sm:col-span-2 flex items-center justify-between gap-4 border-t border-hairline pt-6">
          {!sectionValid ? (
            <p className="text-[12.5px] text-[var(--color-signal)]" role="alert">
              Fill the required fields above before submitting.
            </p>
          ) : error ? (
            <p className="text-[12.5px] text-[var(--color-signal)]" role="alert">
              {error}
            </p>
          ) : (
            <span className="text-[12px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              We respond within two business days.
            </span>
          )}
          <LiquidPillButton
            type="submit"
            variant="accent"
            disabled={!sectionValid || pending}
          >
            {pending ? "Submitting…" : "Submit discovery"}
          </LiquidPillButton>
        </div>
      </form>
    </section>
  );
}

function Labelled({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete="off"
        className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
      />
    </label>
  );
}
