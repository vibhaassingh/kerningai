// Streaming skeleton for the client dashboard. Mirrors the page layout
// so the force-dynamic data load shows a stable skeleton instead of an
// empty pane that snaps to content on every visit.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-hairline ${className}`} />;
}

export default function PortalDashboardLoading() {
  return (
    <div className="space-y-14" aria-busy="true" aria-label="Loading dashboard">
      <header className="space-y-4">
        <Bar className="h-3 w-48" />
        <Bar className="h-10 w-[min(90%,40rem)]" />
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 bg-bg-elev/40 px-6 py-7">
            <Bar className="h-2.5 w-28" />
            <Bar className="h-9 w-16" />
            <Bar className="h-2.5 w-24" />
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <article
            key={i}
            className="space-y-4 rounded-2xl border border-hairline bg-bg-elev/30 p-8"
          >
            <Bar className="h-3 w-36" />
            <Bar className="h-24 w-full" />
            <Bar className="h-3 w-2/3" />
          </article>
        ))}
      </section>
    </div>
  );
}
