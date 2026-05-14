"use client";

import { useCallback, useId } from "react";

import { cn } from "@/lib/cn";
import type { QuestionnaireQuestion } from "@/lib/discovery/templates";

interface QuestionRendererProps {
  question: QuestionnaireQuestion;
  value: unknown;
  onChange: (next: unknown) => void;
  onCommit: () => void;
  saving?: boolean;
  error?: string | null;
}

/**
 * Routes to the right input by `question.kind`. Six kinds shipped in
 * Phase 3a; the remainder fall back to a long_text renderer with a
 * "shipping in a later phase" note so progress isn't blocked.
 */
export function QuestionRenderer(props: QuestionRendererProps) {
  switch (props.question.kind) {
    case "short_text":
      return <ShortText {...props} />;
    case "long_text":
      return <LongText {...props} />;
    case "single_select":
      return <SingleSelect {...props} />;
    case "multi_select":
      return <MultiSelect {...props} />;
    case "boolean":
      return <BooleanField {...props} />;
    case "number":
      return <NumberField {...props} />;
    default:
      return <LongText {...props} />;
  }
}

function FieldShell({
  label,
  help,
  required,
  saving,
  error,
  children,
  htmlFor,
}: {
  label: string;
  help: string | null;
  required: boolean;
  saving?: boolean;
  error?: string | null;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label
          htmlFor={htmlFor}
          className="flex items-baseline gap-2 text-[13.5px] text-text"
        >
          <span>{label}</span>
          {required && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
              required
            </span>
          )}
        </label>
        {help && (
          <p className="text-[12.5px] text-[var(--color-text-muted)]">{help}</p>
        )}
      </div>
      {children}
      <div className="flex h-4 items-center text-[11px] uppercase tracking-[0.12em]">
        {error ? (
          <span className="text-[var(--color-signal)]">{error}</span>
        ) : saving ? (
          <span className="text-[var(--color-text-faint)]">Saving…</span>
        ) : null}
      </div>
    </div>
  );
}

function ShortText(p: QuestionRendererProps) {
  const id = useId();
  const current = typeof p.value === "string" ? p.value : "";
  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
      htmlFor={id}
    >
      <input
        id={id}
        type="text"
        value={current}
        placeholder={p.question.placeholder ?? ""}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onCommit}
        className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[16px] text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)]"
      />
    </FieldShell>
  );
}

function LongText(p: QuestionRendererProps) {
  const id = useId();
  const current = typeof p.value === "string" ? p.value : "";
  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
      htmlFor={id}
    >
      <textarea
        id={id}
        rows={4}
        value={current}
        placeholder={p.question.placeholder ?? ""}
        onChange={(e) => p.onChange(e.target.value)}
        onBlur={p.onCommit}
        className="w-full resize-none bg-transparent border-0 border-b border-hairline pb-2 text-[15.5px] leading-relaxed text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)]"
      />
    </FieldShell>
  );
}

function NumberField(p: QuestionRendererProps) {
  const id = useId();
  const current =
    typeof p.value === "number" ? String(p.value) : typeof p.value === "string" ? p.value : "";
  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
      htmlFor={id}
    >
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={current}
        placeholder={p.question.placeholder ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") p.onChange(null);
          else p.onChange(Number(raw));
        }}
        onBlur={p.onCommit}
        className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[16px] text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)] tabular-nums"
      />
    </FieldShell>
  );
}

function BooleanField(p: QuestionRendererProps) {
  const current = p.value === true ? "yes" : p.value === false ? "no" : null;
  const set = useCallback(
    (next: boolean) => {
      p.onChange(next);
      // Boolean fires immediately — commit right away.
      setTimeout(() => p.onCommit(), 0);
    },
    [p],
  );
  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <div className="flex gap-2">
        <Toggle active={current === "yes"} onClick={() => set(true)} label="Yes" />
        <Toggle active={current === "no"} onClick={() => set(false)} label="No" />
      </div>
    </FieldShell>
  );
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "bg-[var(--color-signal)]/20 text-[var(--color-signal)] border border-[var(--color-signal)]"
          : "border border-hairline-strong text-[var(--color-text-faded)] hover:text-text hover:border-[var(--color-text-muted)]",
      )}
    >
      {label}
    </button>
  );
}

function SingleSelect(p: QuestionRendererProps) {
  const current = typeof p.value === "string" ? p.value : "";
  const pick = useCallback(
    (next: string) => {
      p.onChange(next);
      setTimeout(() => p.onCommit(), 0);
    },
    [p],
  );
  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <div className="flex flex-wrap gap-2">
        {p.question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => pick(opt.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors",
              current === opt.value
                ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)] border border-[var(--color-signal)]"
                : "border border-hairline-strong text-[var(--color-text-faded)] hover:border-[var(--color-text-muted)] hover:text-text",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </FieldShell>
  );
}

function MultiSelect(p: QuestionRendererProps) {
  const current = Array.isArray(p.value) ? (p.value as string[]) : [];
  const toggle = useCallback(
    (val: string) => {
      const next = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val];
      p.onChange(next);
      setTimeout(() => p.onCommit(), 0);
    },
    [current, p],
  );
  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <div className="flex flex-wrap gap-2">
        {p.question.options.map((opt) => {
          const on = current.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors",
                on
                  ? "bg-[var(--color-signal)]/15 text-[var(--color-signal)] border border-[var(--color-signal)]"
                  : "border border-hairline-strong text-[var(--color-text-faded)] hover:border-[var(--color-text-muted)] hover:text-text",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}
