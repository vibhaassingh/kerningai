import { notFound } from "next/navigation";

import { ClientModulesEditor } from "@/components/admin/ClientModulesEditor";
import { Eyebrow } from "@/components/primitives/Eyebrow";
import { getClientDetail } from "@/lib/admin/clients";
import { CLIENT_MODULES } from "@/lib/admin/modules-catalog";
import { hasPermissionAny } from "@/lib/auth/require";

export const metadata = { title: "Modules" };
export const dynamic = "force-dynamic";

interface ModulesPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientModulesPage({ params }: ModulesPageProps) {
  const { clientId } = await params;
  const client = await getClientDetail(clientId);
  if (!client) notFound();

  const canEdit = await hasPermissionAny("manage_clients");
  const enabled = new Set(client.modules_enabled);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Eyebrow number="01">Modules</Eyebrow>
        <h2 className="text-display text-[clamp(1.4rem,3vw,1.8rem)] font-medium tracking-[-0.02em]">
          What{" "}
          <span className="italic text-[var(--color-signal)]">
            {client.name}
          </span>{" "}
          has enabled.
        </h2>
        <p className="max-w-xl text-[14px] text-[var(--color-text-faded)]">
          {canEdit
            ? "Toggle modules on or off and save. Changes take effect immediately and are recorded in the audit log; the client's portal navigation updates to match."
            : "This reflects the modules provisioned for this client. Editing requires the Manage clients permission."}
        </p>
      </header>

      {canEdit ? (
        <ClientModulesEditor
          organizationId={clientId}
          enabled={client.modules_enabled}
        />
      ) : (
        <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {CLIENT_MODULES.map((mod) => {
            const on = enabled.has(mod.slug);
            return (
              <li key={mod.slug} className="space-y-3 bg-bg-elev/40 px-6 py-6">
                <header className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {mod.label}
                  </p>
                  <span
                    className={
                      on
                        ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                        : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]"
                    }
                  >
                    {on ? "Enabled" : "Off"}
                  </span>
                </header>
                <p className="text-[13px] leading-relaxed text-[var(--color-text-faded)]">
                  {mod.description}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
