"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";

import { cn } from "@/lib/cn";
import { uploadQuestionnaireFile } from "@/lib/discovery/actions";
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
 * Routes to the right input by `question.kind`. Phase 3c brings the
 * full 22-kind catalogue: most route to a dedicated renderer; a few
 * (site_count, user_count, deployment_preference, data_sensitivity,
 * budget_range, timeline_expectation) are config-driven variants of
 * existing renderers, so they share components.
 */
export function QuestionRenderer(props: QuestionRendererProps) {
  switch (props.question.kind) {
    case "short_text":
      return <ShortText {...props} />;
    case "long_text":
      return <LongText {...props} />;
    case "single_select":
    case "deployment_preference":
    case "data_sensitivity":
    case "budget_range":
    case "timeline_expectation":
      return <SingleSelect {...props} />;
    case "multi_select":
      return <MultiSelect {...props} />;
    case "integration_selector":
      return <IntegrationSelector {...props} />;
    case "boolean":
      return <BooleanField {...props} />;
    case "number":
    case "site_count":
    case "user_count":
      return <NumberField {...props} />;
    case "currency":
      return <CurrencyField {...props} />;
    case "date":
      return <DateField {...props} />;
    case "file":
      return <FileField {...props} />;
    case "consent":
      return <ConsentField {...props} />;
    case "contact_details":
      return <ContactDetailsField {...props} />;
    case "priority_ranking":
      return <PriorityRanking {...props} />;
    case "matrix":
      return <MatrixField {...props} />;
    case "repeating_group":
      return <RepeatingGroupField {...props} />;
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
  const current = useMemo(
    () => (Array.isArray(p.value) ? (p.value as string[]) : []),
    [p.value],
  );
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

// ===========================================================================
// Phase 3c renderers — currency, date, file, consent, contact_details,
// integration_selector, priority_ranking
// ===========================================================================

function CurrencyField(p: QuestionRendererProps) {
  const id = useId();
  const config = p.question.config as { currency?: string } | undefined;
  const symbol =
    (config?.currency ?? "EUR") === "USD"
      ? "$"
      : (config?.currency ?? "EUR") === "INR"
        ? "₹"
        : "€";
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
      <div className="flex items-baseline gap-2 border-b border-hairline pb-2 transition-colors focus-within:border-[var(--color-signal)]">
        <span className="text-[16px] text-[var(--color-text-muted)]">{symbol}</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          value={current}
          placeholder={p.question.placeholder ?? "0"}
          onChange={(e) => {
            const raw = e.target.value;
            p.onChange(raw === "" ? null : Number(raw));
          }}
          onBlur={p.onCommit}
          className="w-full bg-transparent text-[16px] text-text placeholder:text-[var(--color-text-faint)] outline-none tabular-nums"
        />
      </div>
    </FieldShell>
  );
}

function DateField(p: QuestionRendererProps) {
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
        type="date"
        value={current}
        onChange={(e) => p.onChange(e.target.value || null)}
        onBlur={p.onCommit}
        className="bg-transparent border-0 border-b border-hairline pb-2 text-[16px] text-text outline-none transition-colors focus:border-[var(--color-signal)]"
      />
    </FieldShell>
  );
}

function FileField(p: QuestionRendererProps) {
  const id = useId();
  // Real byte upload to the `questionnaire-uploads` Storage bucket via
  // the service-role server action (handles anonymous prospects + upserts
  // the answer). Value is { name, size, path, bucket, uploaded_at }.
  const current =
    (p.value as
      | { name?: string; size?: number; path?: string }
      | null) ?? null;
  const [pending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);

  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help ?? "Attach a file (PDF, image, doc — up to 50 MB)."}
      required={p.question.required}
      saving={p.saving || pending}
      error={p.error ?? uploadError}
      htmlFor={id}
    >
      <input
        id={id}
        type="file"
        disabled={pending}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setUploadError(null);
          const fd = new FormData();
          fd.set("questionId", p.question.id);
          fd.set("file", f);
          startTransition(async () => {
            const result = await uploadQuestionnaireFile(undefined, fd);
            if (result.ok && result.data) {
              p.onChange(result.data.file);
            } else {
              setUploadError(result.ok ? "Upload failed." : result.error);
            }
          });
        }}
        className="block w-full text-[13px] text-[var(--color-text-faded)] file:mr-3 file:rounded-full file:border file:border-hairline file:bg-transparent file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-[var(--color-text-faded)] hover:file:border-[var(--color-signal)] hover:file:text-[var(--color-signal)] disabled:opacity-50"
      />
      {pending && (
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
          Uploading…
        </p>
      )}
      {!pending && current?.path && (
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
          Uploaded · {current.name}
          {current.size ? ` · ${Math.round(current.size / 1024)}KB` : ""}
        </p>
      )}
    </FieldShell>
  );
}

function ConsentField(p: QuestionRendererProps) {
  const id = useId();
  const checked = p.value === true;
  const config = p.question.config as { terms_url?: string } | undefined;
  return (
    <FieldShell
      label={p.question.label}
      help={null}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-text">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            p.onChange(e.target.checked);
            setTimeout(() => p.onCommit(), 0);
          }}
          className="mt-1 h-4 w-4 cursor-pointer accent-[var(--color-signal)]"
        />
        <span>
          {p.question.help ?? "I agree to the terms"}{" "}
          {config?.terms_url && (
            <a
              href={config.terms_url}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-signal)] underline"
            >
              read terms ↗
            </a>
          )}
        </span>
      </label>
    </FieldShell>
  );
}

function ContactDetailsField(p: QuestionRendererProps) {
  const current = (p.value as { name?: string; email?: string; phone?: string } | null) ?? {};
  const update = (patch: Partial<typeof current>) => {
    p.onChange({ ...current, ...patch });
  };
  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <div className="space-y-2.5">
        <input
          type="text"
          value={current.name ?? ""}
          placeholder="Full name"
          onChange={(e) => update({ name: e.target.value })}
          onBlur={p.onCommit}
          className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[15px] text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)]"
        />
        <input
          type="email"
          value={current.email ?? ""}
          placeholder="email@company.com"
          onChange={(e) => update({ email: e.target.value })}
          onBlur={p.onCommit}
          className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[15px] text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)]"
        />
        <input
          type="tel"
          value={current.phone ?? ""}
          placeholder="Phone (optional)"
          onChange={(e) => update({ phone: e.target.value })}
          onBlur={p.onCommit}
          className="w-full bg-transparent border-0 border-b border-hairline pb-2 text-[15px] text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)]"
        />
      </div>
    </FieldShell>
  );
}

function IntegrationSelector(p: QuestionRendererProps) {
  // Same UX as MultiSelect but with a richer card layout for long
  // catalogs (CRM, ERP, BI, etc.). Options can carry `description`
  // text from the template — used as a category subtitle here.
  const current = useMemo(
    () => (Array.isArray(p.value) ? (p.value as string[]) : []),
    [p.value],
  );
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
      help={p.question.help ?? "Pick every integration you'd like Kerning to plug into."}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {p.question.options.map((opt) => {
          const on = current.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition-colors",
                on
                  ? "border-[var(--color-signal)] bg-[var(--color-signal)]/10"
                  : "border-hairline-strong hover:border-[var(--color-text-muted)]",
              )}
            >
              <p
                className={cn(
                  "text-[13.5px]",
                  on ? "text-[var(--color-signal)]" : "text-text",
                )}
              >
                {opt.label}
              </p>
              {opt.description && (
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {opt.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}

function PriorityRanking(p: QuestionRendererProps) {
  const optionValues = useMemo(
    () => p.question.options.map((o) => o.value),
    [p.question.options],
  );
  // Stored as an ordered array of option values, highest priority first.
  const current = useMemo(() => {
    const list = Array.isArray(p.value) ? (p.value as string[]) : [];
    // Backfill any options not yet ranked at the end of the list.
    const missing = optionValues.filter((v) => !list.includes(v));
    return [...list.filter((v) => optionValues.includes(v)), ...missing];
  }, [p.value, optionValues]);

  const move = useCallback(
    (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= current.length) return;
      const next = [...current];
      [next[idx], next[target]] = [next[target], next[idx]];
      p.onChange(next);
      setTimeout(() => p.onCommit(), 0);
    },
    [current, p],
  );

  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help ?? "Rank from highest priority (1) to lowest. Use the arrows to reorder."}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <ol className="space-y-1.5">
        {current.map((val, idx) => {
          const opt = p.question.options.find((o) => o.value === val);
          return (
            <li
              key={val}
              className="flex items-center gap-3 rounded-lg border border-hairline-strong px-3 py-2"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                {idx + 1}
              </span>
              <span className="flex-1 text-[13.5px] text-text">
                {opt?.label ?? val}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${opt?.label ?? val} up`}
                  className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === current.length - 1}
                  aria-label={`Move ${opt?.label ?? val} down`}
                  className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </FieldShell>
  );
}

// ===========================================================================
// Composite types — matrix (grid) + repeating_group (array of records)
// ===========================================================================

interface AxisItem {
  value: string;
  label: string;
}

function asAxis(raw: unknown): AxisItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      if (typeof r === "string") return { value: r, label: r };
      if (r && typeof r === "object") {
        const o = r as Record<string, unknown>;
        const value = typeof o.value === "string" ? o.value : null;
        if (!value) return null;
        return {
          value,
          label: typeof o.label === "string" ? o.label : value,
        };
      }
      return null;
    })
    .filter((x): x is AxisItem => x !== null);
}

/**
 * Matrix: a rows × columns grid. config = { rows, columns, cell }.
 *   cell "select" uses config.cellOptions (or question.options).
 *   cell "text" (default) is a free text input per cell.
 * Stored as { [rowValue]: { [colValue]: string } }.
 * Degrades to a freeform textarea (string value) if rows/columns are
 * missing so a prospect is never blocked.
 */
function MatrixField(p: QuestionRendererProps) {
  const cfg = (p.question.config ?? {}) as {
    rows?: unknown;
    columns?: unknown;
    cell?: string;
    cellOptions?: unknown;
  };
  const rows = useMemo(() => asAxis(cfg.rows), [cfg.rows]);
  const cols = useMemo(() => asAxis(cfg.columns), [cfg.columns]);
  const cellKind = cfg.cell === "select" ? "select" : "text";
  const cellOptions = useMemo(() => {
    const fromCfg = asAxis(cfg.cellOptions);
    if (fromCfg.length) return fromCfg;
    return p.question.options.map((o) => ({ value: o.value, label: o.label }));
  }, [cfg.cellOptions, p.question.options]);

  const grid = useMemo(
    () =>
      p.value && typeof p.value === "object" && !Array.isArray(p.value)
        ? (p.value as Record<string, Record<string, string>>)
        : {},
    [p.value],
  );

  const setCell = useCallback(
    (rv: string, cv: string, val: string) => {
      const next: Record<string, Record<string, string>> = {
        ...grid,
        [rv]: { ...(grid[rv] ?? {}), [cv]: val },
      };
      p.onChange(next);
    },
    [grid, p],
  );

  if (rows.length === 0 || cols.length === 0) {
    // No axis config — capture freeform so the question still works.
    const current = typeof p.value === "string" ? p.value : "";
    return (
      <FieldShell
        label={p.question.label}
        help={p.question.help}
        required={p.question.required}
        saving={p.saving}
        error={p.error}
      >
        <textarea
          rows={4}
          value={current}
          placeholder={p.question.placeholder ?? "One item per line"}
          onChange={(e) => p.onChange(e.target.value)}
          onBlur={p.onCommit}
          className="w-full resize-none bg-transparent border-0 border-b border-hairline pb-2 text-[15.5px] leading-relaxed text-text placeholder:text-[var(--color-text-faint)] outline-none transition-colors focus:border-[var(--color-signal)]"
        />
      </FieldShell>
    );
  }

  return (
    <FieldShell
      label={p.question.label}
      help={p.question.help}
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="border-b border-hairline px-2 py-2 text-left" />
              {cols.map((c) => (
                <th
                  key={c.value}
                  className="border-b border-hairline px-2 py-2 text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.value}>
                <th className="border-b border-hairline px-2 py-2 text-left text-[13px] font-normal text-text">
                  {r.label}
                </th>
                {cols.map((c) => {
                  const v = grid[r.value]?.[c.value] ?? "";
                  return (
                    <td
                      key={c.value}
                      className="border-b border-hairline px-2 py-2"
                    >
                      {cellKind === "select" ? (
                        <select
                          value={v}
                          onChange={(e) =>
                            setCell(r.value, c.value, e.target.value)
                          }
                          onBlur={p.onCommit}
                          className="w-full bg-transparent text-[13px] text-text outline-none"
                        >
                          <option value="">—</option>
                          {cellOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={v}
                          onChange={(e) =>
                            setCell(r.value, c.value, e.target.value)
                          }
                          onBlur={p.onCommit}
                          className="w-full bg-transparent text-[13px] text-text outline-none"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FieldShell>
  );
}

interface RepeatingFieldDef {
  slug: string;
  label: string;
  kind: "short_text" | "number" | "single_select";
  options?: AxisItem[];
}

function asFieldDefs(raw: unknown): RepeatingFieldDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f): RepeatingFieldDef | null => {
      if (!f || typeof f !== "object") return null;
      const o = f as Record<string, unknown>;
      const slug = typeof o.slug === "string" ? o.slug : null;
      if (!slug) return null;
      const kind: RepeatingFieldDef["kind"] =
        o.kind === "number" || o.kind === "single_select"
          ? o.kind
          : "short_text";
      return {
        slug,
        label: typeof o.label === "string" ? o.label : slug,
        kind,
        options: asAxis(o.options),
      };
    })
    .filter((x): x is RepeatingFieldDef => x !== null);
}

/**
 * Repeating group: an editable array of records. config = { fields,
 * maxItems?, addLabel? }. Stored as Array<Record<fieldSlug, value>>.
 * Degrades to a single freeform note row if no fields are configured.
 */
function RepeatingGroupField(p: QuestionRendererProps) {
  const cfg = (p.question.config ?? {}) as {
    fields?: unknown;
    maxItems?: unknown;
    addLabel?: unknown;
  };
  const fields = useMemo(() => asFieldDefs(cfg.fields), [cfg.fields]);
  const maxItems =
    typeof cfg.maxItems === "number" && cfg.maxItems > 0 ? cfg.maxItems : 10;
  const addLabel =
    typeof cfg.addLabel === "string" ? cfg.addLabel : "Add row";

  const effectiveFields: RepeatingFieldDef[] =
    fields.length > 0
      ? fields
      : [{ slug: "note", label: "Note", kind: "short_text" }];

  const rows = useMemo(
    () =>
      Array.isArray(p.value)
        ? (p.value as Record<string, unknown>[])
        : [],
    [p.value],
  );

  const commit = useCallback(
    (next: Record<string, unknown>[]) => {
      p.onChange(next);
      setTimeout(() => p.onCommit(), 0);
    },
    [p],
  );

  const addRow = useCallback(() => {
    if (rows.length >= maxItems) return;
    commit([...rows, {}]);
  }, [rows, maxItems, commit]);

  const removeRow = useCallback(
    (idx: number) => commit(rows.filter((_, i) => i !== idx)),
    [rows, commit],
  );

  const setField = useCallback(
    (idx: number, slug: string, val: unknown) => {
      const next = rows.map((r, i) =>
        i === idx ? { ...r, [slug]: val } : r,
      );
      p.onChange(next);
    },
    [rows, p],
  );

  return (
    <FieldShell
      label={p.question.label}
      help={
        p.question.help ??
        "Add one entry per item. Use the controls to add or remove rows."
      }
      required={p.question.required}
      saving={p.saving}
      error={p.error}
    >
      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]">
            No entries yet.
          </p>
        )}
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid items-end gap-3 rounded-lg border border-hairline-strong px-3 py-3 sm:grid-cols-2"
          >
            {effectiveFields.map((f) => {
              const val = row[f.slug];
              return (
                <label key={f.slug} className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    {f.label}
                  </span>
                  {f.kind === "single_select" ? (
                    <select
                      value={typeof val === "string" ? val : ""}
                      onChange={(e) => setField(idx, f.slug, e.target.value)}
                      onBlur={p.onCommit}
                      className="w-full bg-transparent border-0 border-b border-hairline pb-1.5 text-[14px] text-text outline-none focus:border-[var(--color-signal)]"
                    >
                      <option value="">—</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.kind === "number" ? "number" : "text"}
                      value={
                        val == null
                          ? ""
                          : typeof val === "number"
                            ? String(val)
                            : String(val)
                      }
                      onChange={(e) =>
                        setField(
                          idx,
                          f.slug,
                          f.kind === "number"
                            ? e.target.value === ""
                              ? null
                              : Number(e.target.value)
                            : e.target.value,
                        )
                      }
                      onBlur={p.onCommit}
                      className="w-full bg-transparent border-0 border-b border-hairline pb-1.5 text-[14px] text-text outline-none focus:border-[var(--color-signal)]"
                    />
                  )}
                </label>
              );
            })}
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {rows.length < maxItems && (
          <button
            type="button"
            onClick={addRow}
            className="rounded-full border border-[var(--color-signal-deep)] px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            {addLabel}
          </button>
        )}
      </div>
    </FieldShell>
  );
}
