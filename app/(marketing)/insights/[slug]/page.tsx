import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { MaskedReveal } from "@/components/primitives/MaskedReveal";
import { getResolvedInsights, getResolvedInsight } from "@/lib/cms/resolver";
import { CTA } from "@/components/sections/home/CTA";
import { SITE_URL } from "@/lib/env";

type Params = { slug: string };

// ISR: code MDX stays static; DB (CMS) posts not in generateStaticParams
// render on-demand and refresh every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getResolvedInsights();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getResolvedInsight(slug);
  if (!post) return {};
  const url = `/insights/${slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.summary,
      url,
      siteName: "Kerning AI",
      publishedTime: post.date.toISOString(),
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

const mdxComponents = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1
      {...p}
      className="text-display mt-16 text-[clamp(1.8rem,3.4vw,2.8rem)] font-medium leading-[1.05] tracking-[-0.03em]"
    />
  ),
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      {...p}
      className="text-display mt-14 text-[clamp(1.5rem,2.6vw,2.2rem)] font-medium leading-[1.1] tracking-[-0.025em]"
    />
  ),
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      {...p}
      className="text-display mt-10 text-xl font-medium tracking-[-0.02em]"
    />
  ),
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      {...p}
      className="mt-6 text-[16px] leading-[1.7] text-[var(--color-text)]"
    />
  ),
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      {...p}
      className="mt-6 space-y-3 border-l border-[var(--color-hairline-strong)] pl-6 text-[15px] leading-[1.6] text-[var(--color-text-muted)]"
    />
  ),
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      {...p}
      className="mt-6 list-decimal space-y-3 pl-6 text-[15px] leading-[1.6] text-[var(--color-text-muted)]"
    />
  ),
  li: (p: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...p} className="leading-[1.6]" />
  ),
  strong: (p: React.HTMLAttributes<HTMLElement>) => (
    <strong {...p} className="font-medium text-[var(--color-text)]" />
  ),
  a: (p: React.HTMLAttributes<HTMLAnchorElement> & { href?: string }) => (
    <a
      {...p}
      className="text-[var(--color-text)] underline-offset-4 hover:underline"
    />
  ),
};

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getResolvedInsight(slug);
  if (!post) notFound();

  const insightUrl = `${SITE_URL}/insights/${slug}`;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Kerning AI", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Insights", item: `${SITE_URL}/insights` },
      { "@type": "ListItem", position: 3, name: post.title, item: insightUrl },
    ],
  };
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": insightUrl,
    mainEntityOfPage: insightUrl,
    headline: post.title,
    description: post.summary,
    datePublished: post.date.toISOString(),
    dateModified: post.date.toISOString(),
    author: { "@type": "Person", name: post.author },
    publisher: { "@id": `${SITE_URL}/#organization` },
    keywords: post.tags?.join(", "),
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <section className="bg-[var(--color-bg)] pt-40 md:pt-56">
        <div className="mx-auto w-full max-w-[920px] px-6 md:px-10">
          <Link
            href="/insights"
            className="nav-link mb-12 inline-block text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            ← All insights
          </Link>

          <Eyebrow>{post.tags?.[0] ?? "Insight"}</Eyebrow>

          <h1 className="text-display mt-10 text-[clamp(2.2rem,5.8vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.035em]">
            <MaskedReveal stiffness={200} damping={22}>
              <span>{post.title}</span>
            </MaskedReveal>
          </h1>

          <p className="mt-8 text-[clamp(1.05rem,1.4vw,1.3rem)] leading-[1.55] text-[var(--color-text-muted)]">
            {post.summary}
          </p>

          <p className="mt-12 flex items-center gap-3 font-mono text-[12px] tracking-[0.04em] text-[var(--color-text-muted)]">
            <span>{post.author}</span>
            <span className="text-[var(--color-text-faint)]">·</span>
            <span>
              {new Date(post.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="text-[var(--color-text-faint)]">·</span>
            <span>{post.readTime} min read</span>
          </p>
        </div>
      </section>

      <section className="bg-[var(--color-bg)] py-24 md:py-32">
        <div className="mx-auto w-full max-w-[760px] px-6 md:px-10">
          <article>
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </article>
        </div>
      </section>

      <CTA />
    </>
  );
}
