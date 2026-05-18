// Generic streaming skeleton for ALL /admin routes (nearest-boundary
// rule). More specific routes like /admin/command-center keep their own
// tailored skeleton. Renders inside AdminShell's <main> content slot.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-hairline ${className}`} />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-12" aria-busy="true" aria-label="Loading">
      <header className="space-y-4">
        <Bar className="h-3 w-44" />
        <Bar className="h-9 w-[min(90%,34rem)]" />
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 bg-bg-elev/40 px-6 py-5">
            <Bar className="h-2.5 w-24" />
            <Bar className="h-7 w-16" />
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-hairline px-6 py-4 last:border-b-0"
          >
            <div className="space-y-2">
              <Bar className="h-3.5 w-48" />
              <Bar className="h-2.5 w-28" />
            </div>
            <Bar className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
