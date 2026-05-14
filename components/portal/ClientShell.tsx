import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { PortalBrand } from "@/components/chrome/portal/PortalBrand";
import { SidebarNav, type SidebarSection } from "@/components/chrome/portal/SidebarNav";
import { TopBar } from "@/components/chrome/portal/TopBar";
import { ROLE_LABELS } from "@/lib/rbac/labels";
import { createClient } from "@/lib/supabase/server";
import { getUserMemberships } from "@/lib/tenancy/current-org";

const PORTAL_NAV: SidebarSection[] = [
  {
    title: "01 — Today",
    items: [
      { number: "01", href: "/portal/dashboard", label: "Dashboard" },
      { number: "02", href: "/portal/live", label: "Live Operations" },
      { number: "03", href: "/portal/agents/inbox", label: "Agent Inbox" },
    ],
  },
  {
    title: "02 — Modules",
    items: [
      { number: "04", href: "/portal/maintenance", label: "Maintenance" },
      { number: "05", href: "/portal/energy", label: "Energy" },
      { number: "06", href: "/portal/compliance", label: "Compliance" },
      { number: "07", href: "/portal/decision-intelligence", label: "Decision Intelligence" },
      { number: "08", href: "/portal/ontology", label: "Ontology Explorer" },
      { number: "09", href: "/portal/projects", label: "Projects & Workflow" },
    ],
  },
  {
    title: "03 — Workspace",
    items: [
      { number: "09", href: "/portal/onboarding", label: "Onboarding" },
      { number: "10", href: "/portal/reports", label: "Reports" },
      { number: "11", href: "/portal/documents", label: "Documents" },
      { number: "12", href: "/portal/support", label: "Support" },
      { number: "13", href: "/portal/integrations", label: "Integrations" },
      { number: "14", href: "/portal/billing", label: "Billing" },
      { number: "15", href: "/portal/team", label: "Team" },
      { number: "16", href: "/portal/settings/security", label: "Security Settings" },
    ],
  },
];

export async function ClientShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/portal");

  const memberships = await getUserMemberships();
  if (memberships.length === 0) {
    // Authenticated but no active membership — likely an in-flight invite.
    redirect("/accept-invite");
  }

  // Prefer the first client org. Internal-only users land here too if they
  // navigate directly; surface a hint by showing whichever org they have.
  const primary =
    memberships.find((m) => m.organizationType === "client") ?? memberships[0];

  const { data: profile } = await supabase
    .from("app_users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <div className="grid min-h-dvh grid-cols-[260px_1fr] bg-bg text-text">
      <aside className="border-r border-hairline bg-bg-elev/40">
        <PortalBrand subline="AI · Portal" href="/portal" />
        <SidebarNav sections={PORTAL_NAV} rootPath="/portal" />
      </aside>

      <div className="flex min-h-dvh flex-col">
        <TopBar
          fullName={profile.full_name ?? profile.email}
          email={profile.email}
          roleLabel={ROLE_LABELS[primary.roleSlug] ?? primary.roleSlug}
          organizationLabel={primary.organizationName}
          settingsHref="/portal/settings/security"
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-8 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
