// Generic streaming skeleton for ALL /portal routes. Next.js uses the
// nearest loading.tsx, so this one boundary gives every portal page an
// instant skeleton during the dynamic data fetch (more specific routes
// like /portal/dashboard keep their own tailored skeleton). Renders
// inside ClientShell's <main> content slot — header + neutral blocks
// approximating the common page structure to avoid layout shift.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-hairline ${className}`} />;
}

export default function PortalLoading() {
  return (
    <div className="space-y-12" aria-busy="true" aria-label="Loading">
      <header className="space-y-4">
        <Bar className="h-3 w-44" />
        <Bar className="h-9 w-[min(90%,34rem)]" />
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 bg-bg-elev/40 px-6 py-7">
            <Bar className="h-2.5 w-24" />
            <Bar className="h-8 w-20" />
            <Bar className="h-2.5 w-28" />
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
            <Bar className="h-20 w-full" />
            <Bar className="h-3 w-2/3" />
          </article>
        ))}
      </section>
    </div>
  );
}
