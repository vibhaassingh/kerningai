import { redirect } from "next/navigation";

import { CmsPostForm } from "@/components/admin/CmsPostForm";
import { CmsStatusButtons } from "@/components/admin/CmsStatusButtons";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { hasPermissionAny } from "@/lib/auth/require";
import { listAllCmsPosts } from "@/lib/cms/posts";
import { getResolvedInsights } from "@/lib/cms/resolver";

export const metadata = { title: "CMS" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  draft: "text-[var(--color-text-muted)]",
  published: "text-[var(--color-signal)]",
  archived: "text-[var(--color-text-faint)]",
};

export default async function CmsPage() {
  if (!(await hasPermissionAny("manage_cms"))) redirect("/admin");

  const [posts, resolved] = await Promise.all([
    listAllCmsPosts(),
    getResolvedInsights(),
  ]);
  const codeCount = resolved.filter((r) => r.source === "code").length;
  const dbLiveCount = resolved.filter((r) => r.source === "db").length;

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <Eyebrow number="01">CMS</Eyebrow>
        <h1 className="text-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.05] tracking-[-0.03em]">
          Dual-mode <span className="italic text-[var(--color-signal)]">content</span>.
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-text-faded)]">
          Code MDX is authoritative; DB posts add new slugs only. {codeCount}{" "}
          code article{codeCount === 1 ? "" : "s"}, {dbLiveCount} live DB post
          {dbLiveCount === 1 ? "" : "s"} on the public site right now.
        </p>
      </header>

      <section className="space-y-4">
        <Eyebrow number="02">DB posts</Eyebrow>
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-bg-elev/30 px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">
            No DB posts yet. Create one below.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-hairline bg-bg-elev/30">
            {posts.map((p) => (
              <li
                key={p.id}
                className="grid gap-3 border-b border-hairline px-5 py-4 last:border-b-0 sm:grid-cols-[1.5fr_0.6fr_1fr]"
              >
                <div className="space-y-0.5">
                  <p className="text-[14px] text-text">{p.title}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    /{p.slug}
                  </p>
                </div>
                <p
                  className={`self-center font-mono text-[10.5px] uppercase tracking-[0.14em] ${STATUS_TONE[p.status]}`}
                >
                  {p.status}
                </p>
                <div className="self-center">
                  <CmsStatusButtons postId={p.id} status={p.status} />
                </div>
                <details className="sm:col-span-3">
                  <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faded)] hover:text-text">
                    Edit
                  </summary>
                  <div className="pt-3">
                    <CmsPostForm post={p} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <Eyebrow number="03">New post</Eyebrow>
        <CmsPostForm />
      </section>
    </div>
  );
}
