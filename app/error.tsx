"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--color-bg)] px-6 text-center text-[var(--color-text)]">
      <div>
        <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
          Something went wrong
        </p>
        <h1 className="text-display mt-8 text-[clamp(3rem,11vw,9rem)] font-medium leading-[0.92] tracking-[-0.04em]">
          Something{" "}
          <span className="italic text-[var(--color-signal)]">
            misfired.
          </span>
        </h1>
        <p className="mx-auto mt-10 max-w-md text-[15px] leading-[1.6] text-[var(--color-text-muted)]">
          We've logged the issue. Try again, or head back home.
        </p>
        <button
          onClick={reset}
          className="nav-link mt-12 text-[15px] tracking-[0.01em] text-[var(--color-text)]"
        >
          Try again →
        </button>
      </div>
    </main>
  );
}
