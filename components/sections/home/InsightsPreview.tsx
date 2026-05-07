import Link from "next/link";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getAllInsights } from "@/lib/mdx";

export async function InsightsPreview() {
  const posts = await getAllInsights();
  const latest = posts.slice(0, 3);

  return (
    <section className="border-t border-[var(--color-hairline)] bg-[var(--color-bg)] py-24 md:py-40">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <div className="flex items-end justify-between gap-6">
          <Eyebrow number="07">Insights</Eyebrow>
          <Link
            href="/insights"
            className="nav-link hidden text-[14px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] md:inline-block"
          >
            All insights →
          </Link>
        </div>

        <h2 className="text-display mt-12 max-w-4xl text-[clamp(2.4rem,5.5vw,5rem)] font-medium leading-[1] tracking-[-0.035em]">
          Field notes from{" "}
          <span className="italic text-[var(--color-signal)]">
            the operating layer.
          </span>
        </h2>

        <ul className="mt-24 divide-y divide-[var(--color-hairline)]">
          {latest.map((post, i) => (
            <li key={post.slug}>
              <Link
                href={`/insights/${post.slug}`}
                className="group grid items-baseline gap-6 py-10 md:grid-cols-12 md:py-12"
              >
                <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:col-span-7">
                  <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                    {post.tags?.[0] ?? "Insight"} · {post.author}
                  </p>
                  <h3 className="text-display mt-4 text-[clamp(1.6rem,2.8vw,2.4rem)] font-medium leading-[1.05] tracking-[-0.025em]">
                    <span className="bg-[length:0%_1px] bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px]">
                      {post.title}
                    </span>
                  </h3>
                </div>
                <p className="text-[14px] leading-[1.55] text-[var(--color-text-muted)] md:col-span-3">
                  {post.summary}
                </p>
                <p className="font-mono text-[11px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-1 md:justify-self-end md:text-right">
                  {post.readTime} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
