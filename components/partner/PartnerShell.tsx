import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { OrgSwitcher } from "@/components/chrome/portal/OrgSwitcher";
import { PortalBrand } from "@/components/chrome/portal/PortalBrand";
import { SidebarNav, type SidebarSection } from "@/components/chrome/portal/SidebarNav";
import { TopBar } from "@/components/chrome/portal/TopBar";
import { ROLE_LABELS } from "@/lib/rbac/labels";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership, getUserMemberships } from "@/lib/tenancy/current-org";

const PARTNER_NAV: SidebarSection[] = [
  {
    title: "01 — Today",
    items: [{ number: "01", href: "/partner/dashboard", label: "Dashboard" }],
  },
  {
    title: "02 — Pipeline",
    items: [
      { number: "02", href: "/partner/leads", label: "My Leads" },
      { number: "03", href: "/partner/leads/new", label: "Submit Lead" },
    ],
  },
  {
    title: "03 — Projects",
    items: [{ number: "04", href: "/partner/projects", label: "My Projects" }],
  },
  {
    title: "04 — Account",
    items: [
      { number: "05", href: "/partner/settings/security", label: "Security Settings" },
    ],
  },
];

export async function PartnerShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnTo=/partner");

  const memberships = await getUserMemberships();
  const partner = memberships.find((m) => m.organizationType === "partner");
  if (!partner) {
    // Authenticated but not a partner — bounce to whichever shell suits them.
    const internal = memberships.find((m) => m.organizationType === "internal");
    if (internal) redirect("/admin");
    const client = memberships.find((m) => m.organizationType === "client");
    if (client) redirect("/portal");
    redirect("/accept-invite");
  }
  const current = (await getCurrentMembership()) ?? partner;

  const { data: profile } = await supabase
    .from("app_users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <div className="grid min-h-dvh grid-cols-[260px_1fr] bg-bg text-text">
      <aside className="border-r border-hairline bg-bg-elev/40">
        <PortalBrand subline="AI · Partner" href="/partner" />
        <SidebarNav sections={PARTNER_NAV} rootPath="/partner" />
      </aside>

      <div className="flex min-h-dvh flex-col">
        <TopBar
          fullName={profile.full_name ?? profile.email}
          email={profile.email}
          roleLabel={ROLE_LABELS[current.roleSlug] ?? current.roleSlug}
          organizationLabel={current.organizationName}
          settingsHref="/partner/settings/security"
          switcher={
            <OrgSwitcher
              memberships={memberships}
              currentOrgId={current.organizationId}
            />
          }
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-8 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
