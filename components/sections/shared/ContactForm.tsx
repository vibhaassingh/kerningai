"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FIELDS = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Work email", type: "email", required: true },
  { name: "company", label: "Company", type: "text", required: false },
  { name: "role", label: "Role", type: "text", required: false },
] as const;

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Something went wrong");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="flex h-full min-h-[420px] flex-col items-start justify-center"
        >
          <p className="text-display text-[clamp(2rem,4.5vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.03em]">
            Message received.
            <br />
            <span className="italic text-[var(--color-signal)]">
              We'll be in touch.
            </span>
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={onSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-12"
        >
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute h-0 w-0 -z-10 opacity-0"
            aria-hidden
          />

          <div className="grid gap-10 md:grid-cols-2">
            {FIELDS.map((field) => (
              <FormField key={field.name} {...field} />
            ))}
          </div>

          <FormTextarea
            name="message"
            label="Tell us what you're working on"
            required
          />

          {error && (
            <p className="text-[14px] text-[var(--color-text)]">{error}</p>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-[var(--color-hairline)] pt-6">
            <p className="text-[13px] text-[var(--color-text-muted)]">
              We reply within 24 hours.
            </p>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="nav-link text-[15px] tracking-[0.01em] text-[var(--color-text)] disabled:opacity-60"
            >
              {status === "submitting" ? "Sending…" : "Send message →"}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function FormField({
  name,
  label,
  type,
  required,
}: {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
        {label}
        {required && <span className="ml-1 text-[var(--color-text)]">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        className="mt-3 w-full border-b border-[var(--color-hairline-strong)] bg-transparent py-3 text-[15px] text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-text)]"
      />
    </label>
  );
}

function FormTextarea({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
        {label}
        {required && <span className="ml-1 text-[var(--color-text)]">*</span>}
      </span>
      <textarea
        name={name}
        required={required}
        rows={5}
        className="mt-3 w-full resize-none border-b border-[var(--color-hairline-strong)] bg-transparent py-3 text-[15px] leading-[1.55] text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-text)]"
      />
    </label>
  );
}
