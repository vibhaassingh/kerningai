// Streaming skeleton for the Command Center. Without this boundary the
// force-dynamic page leaves the main pane empty until server data
// resolves, then snaps in — a visible flash on every visit. The skeleton
// mirrors the page layout so there is no content shift when data lands.

function Bar({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-hairline ${className}`} />
  );
}

export default function CommandCenterLoading() {
  return (
    <div className="space-y-14" aria-busy="true" aria-label="Loading command center">
      <header className="space-y-4">
        <Bar className="h-3 w-40" />
        <Bar className="h-10 w-[min(90%,42rem)]" />
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 bg-bg-elev/40 px-6 py-7">
            <Bar className="h-2.5 w-24" />
            <Bar className="h-9 w-20" />
            <Bar className="h-2.5 w-28" />
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <article className="space-y-5 rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Bar className="h-3 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2">
              <div className="space-y-2">
                <Bar className="h-3.5 w-44" />
                <Bar className="h-2.5 w-28" />
              </div>
              <Bar className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </article>
        <article className="space-y-4 rounded-2xl border border-hairline bg-bg-elev/30 p-8">
          <Bar className="h-3 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Bar className="h-3 w-32" />
                <Bar className="h-3 w-10" />
              </div>
              <Bar className="h-[3px] w-full" />
            </div>
          ))}
        </article>
      </section>

      <section className="space-y-4">
        <Bar className="h-3 w-40" />
        <div className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[180px_1fr_240px] items-center gap-4 border-b border-hairline px-6 py-4 last:border-b-0"
            >
              <Bar className="h-3 w-28" />
              <div className="space-y-2">
                <Bar className="h-3 w-40" />
                <Bar className="h-2.5 w-24" />
              </div>
              <Bar className="ml-auto h-3 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
