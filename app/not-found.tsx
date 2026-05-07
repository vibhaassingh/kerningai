import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--color-bg)] px-6 text-center text-[var(--color-text)]">
      <div>
        <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
          404 — page not found
        </p>
        <h1 className="text-display mt-8 text-[clamp(4rem,16vw,14rem)] font-medium leading-[0.92] tracking-[-0.04em]">
          Lost{" "}
          <span className="italic text-[var(--color-signal)]">signal.</span>
        </h1>
        <p className="mx-auto mt-10 max-w-md text-[15px] leading-[1.6] text-[var(--color-text-muted)]">
          The page you're looking for has drifted out of view. Let's get you
          back to firmer ground.
        </p>
        <Link
          href="/"
          className="nav-link mt-12 inline-block text-[15px] tracking-[0.01em] text-[var(--color-text)]"
        >
          Return home →
        </Link>
      </div>
    </main>
  );
}
