import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApproveBlueprintButton } from "@/components/admin/ApproveBlueprintButton";
import { BlueprintView } from "@/components/admin/BlueprintView";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { formatRelative } from "@/lib/admin/format";
import { getBlueprintDetail } from "@/lib/admin/blueprints";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Blueprint" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ blueprintId: string }>;
}

export default async function BlueprintDetailPage({ params }: PageProps) {
  const canView = await hasPermissionAny("review_questionnaire_submissions");
  if (!canView) redirect("/admin");

  const { blueprintId } = await params;
  const blueprint = await getBlueprintDetail(blueprintId);
  if (!blueprint) notFound();

  const canApprove = await hasPermissionAny("approve_solution_blueprints");
  const alreadyApproved = blueprint.status === "approved_for_client";

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          <Link
            href="/admin/solution-blueprints"
            className="nav-link hover:text-text"
          >
            ← Blueprints
          </Link>
          <span>·</span>
          <Link
            href={`/admin/questionnaires/submissions/${blueprint.submission_id}`}
            className="nav-link hover:text-text"
          >
            View submission
          </Link>
          <span>·</span>
          <span>v{blueprint.version}</span>
        </div>
        <h1 className="text-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium leading-[1.05] tracking-[-0.02em]">
          {blueprint.submitter_company ?? blueprint.submitter_name ?? "Blueprint"}
        </h1>
        <p className="text-[14px] text-[var(--color-text-faded)]">
          {blueprint.template_name}
          {blueprint.submitter_email && ` · ${blueprint.submitter_email}`}
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-bg-elev/30 px-7 py-5">
        <div className="space-y-1">
          <Eyebrow number="00">Status</Eyebrow>
          <p className="text-[14px] text-text">
            {blueprint.status.replace(/_/g, " ")} ·{" "}
            <span className="text-[var(--color-text-faded)]">
              generated {formatRelative(blueprint.generated_at)}
            </span>
          </p>
          {blueprint.approved_at && blueprint.approved_by_name && (
            <p className="text-[11.5px] text-[var(--color-text-muted)]">
              Approved {formatRelative(blueprint.approved_at)} by{" "}
              {blueprint.approved_by_name}
            </p>
          )}
        </div>
        {canApprove && (
          <ApproveBlueprintButton
            blueprintId={blueprint.id}
            alreadyApproved={alreadyApproved}
          />
        )}
      </section>

      <BlueprintView blueprint={blueprint} audience="admin" />
    </div>
  );
}
