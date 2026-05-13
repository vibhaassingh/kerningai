"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Editorial underlined input — matches the ContactForm field rhythm.
 * Uppercase label, large body input, bottom hairline that shifts to
 * amber on focus.
 */
export function AuthField({
  label,
  error,
  id,
  className,
  ...rest
}: AuthFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn("block space-y-2", className)}>
      <span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        id={inputId}
        {...rest}
        className={cn(
          "w-full bg-transparent border-0 border-b border-hairline pb-2",
          "text-[16px] text-text placeholder:text-[var(--color-text-faint)]",
          "outline-none transition-colors duration-300",
          "focus:border-[var(--color-signal)]",
          error && "border-[var(--color-signal-deep)]",
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <span
          id={`${inputId}-error`}
          className="block text-[12px] text-[var(--color-signal)]"
        >
          {error}
        </span>
      )}
    </label>
  );
}
