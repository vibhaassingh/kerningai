import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { PortalBrand } from "@/components/chrome/portal/PortalBrand";
import { SidebarNav, type SidebarSection } from "@/components/chrome/portal/SidebarNav";
import { TopBar } from "@/components/chrome/portal/TopBar";
import { ROLE_LABELS } from "@/lib/rbac/labels";
import { createClient } from "@/lib/supabase/server";
import { getUserMemberships } from "@/lib/tenancy/current-org";

const ADMIN_NAV: SidebarSection[] = [
  {
    title: "01 — Operate",
    items: [
      { number: "01", href: "/admin/command-center", label: "Command Center" },
      { number: "02", href: "/admin/clients", label: "Clients" },
      { number: "03", href: "/admin/leads", label: "Sales CRM" },
      { number: "04", href: "/admin/questionnaires/submissions", label: "Discovery" },
    ],
  },
  {
    title: "02 — Build",
    items: [
      { number: "05", href: "/admin/cms", label: "CMS", disabled: true, badge: "Phase 2" },
      { number: "06", href: "/admin/deployments", label: "Deployments", disabled: true, badge: "Phase 2" },
      { number: "07", href: "/admin/integrations", label: "Integrations", disabled: true, badge: "Phase 4" },
    ],
  },
  {
    title: "03 — Govern",
    items: [
      { number: "08", href: "/admin/security/users", label: "Users & Roles" },
      { number: "09", href: "/admin/security/audit-log", label: "Audit Log" },
      { number: "10", href: "/admin/system-health", label: "System Health", disabled: true, badge: "Phase 2" },
      { number: "11", href: "/admin/settings/security", label: "Security Settings" },
    ],
  },
];

export async function AdminShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/admin");

  const memberships = await getUserMemberships();
  const internal = memberships.find((m) => m.organizationType === "internal");
  if (!internal) {
    // Authenticated but not internal staff — bounce to client portal.
    redirect("/portal");
  }

  // Load profile basics.
  const { data: profile } = await supabase
    .from("app_users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <div className="grid min-h-dvh grid-cols-[260px_1fr] bg-bg text-text">
      <aside className="border-r border-hairline bg-bg-elev/40">
        <PortalBrand subline="AI · Admin" href="/admin" />
        <SidebarNav sections={ADMIN_NAV} rootPath="/admin" />
      </aside>

      <div className="flex min-h-dvh flex-col">
        <TopBar
          fullName={profile.full_name ?? profile.email}
          email={profile.email}
          roleLabel={ROLE_LABELS[internal.roleSlug] ?? internal.roleSlug}
          organizationLabel={internal.organizationName}
          settingsHref="/admin/settings/security"
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-8 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
