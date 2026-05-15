import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { getResolvedInsights } from "@/lib/cms/resolver";
import { CTA } from "@/components/sections/home/CTA";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Field notes from the operating layer — practical AI for hospitality and beyond.",
};

// ISR: code MDX stays static; DB (CMS) posts refresh every 5 minutes.
export const revalidate = 300;

export default async function InsightsIndexPage() {
  const posts = await getResolvedInsights();

  return (
    <>
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <Eyebrow number="01">Insights</Eyebrow>

          <h1 className="text-display mt-12 text-[clamp(3rem,10vw,11rem)] font-medium leading-[0.92] tracking-[-0.04em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>Notes from</span>
            </MaskedReveal>
            <MaskedReveal delay={0.08} stiffness={200} damping={22}>
              <span className="italic text-[var(--color-signal)]">
                the floor.
              </span>
            </MaskedReveal>
          </h1>
        </div>
      </section>

      <section className="bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
          <ul className="divide-y divide-[var(--color-hairline)] border-y border-[var(--color-hairline)]">
            {posts.map((post, i) => (
              <li key={post.slug}>
                <Link
                  href={`/insights/${post.slug}`}
                  className="group grid items-baseline gap-6 py-12 md:grid-cols-12 md:py-16"
                >
                  <span className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="md:col-span-7">
                    <p className="font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
                      {post.tags?.[0] ?? "Insight"} · {post.author}
                    </p>
                    <h2 className="text-display mt-4 text-[clamp(1.8rem,3.4vw,3rem)] font-medium leading-[1.05] tracking-[-0.025em]">
                      <span className="bg-[length:0%_1px] bg-[linear-gradient(currentColor,currentColor)] bg-[position:0_100%] bg-no-repeat pb-1 transition-[background-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-[length:100%_1px]">
                        {post.title}
                      </span>
                    </h2>
                    <p className="mt-4 max-w-2xl text-[14px] leading-[1.55] text-[var(--color-text-muted)]">
                      {post.summary}
                    </p>
                  </div>
                  <div className="text-right font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)] md:col-span-3">
                    <p>
                      {new Date(post.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-2">{post.readTime} min read</p>
                  </div>
                  <span
                    aria-hidden
                    className="text-[18px] text-[var(--color-text-muted)] transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-text)] md:col-span-1 md:justify-self-end"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CTA />
    </>
  );
}
