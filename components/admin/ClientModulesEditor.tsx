"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { setClientModules } from "@/lib/admin/client-actions";
import { CLIENT_MODULES } from "@/lib/admin/modules-catalog";
import type { ActionResult } from "@/lib/auth/actions";

interface ClientModulesEditorProps {
  organizationId: string;
  enabled: string[];
}

const initialState: ActionResult = { ok: false, error: "" };

export function ClientModulesEditor({
  organizationId,
  enabled,
}: ClientModulesEditorProps) {
  const [state, formAction, pending] = useActionState(
    setClientModules,
    initialState,
  );
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set(enabled));

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  function toggle(slug: string) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="organizationId" value={organizationId} />
      <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
        {CLIENT_MODULES.map((mod) => {
          const on = sel.has(mod.slug);
          return (
            <li key={mod.slug} className="bg-bg-elev/40">
              <label className="flex h-full cursor-pointer flex-col gap-3 px-6 py-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {mod.label}
                  </span>
                  <span
                    className={
                      on
                        ? "rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]"
                        : "rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-faint)]"
                    }
                  >
                    {on ? "Enabled" : "Off"}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--color-text-faded)]">
                  {mod.description}
                </p>
                <span className="mt-auto flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    name="modules"
                    value={mod.slug}
                    checked={on}
                    onChange={() => toggle(mod.slug)}
                    className="h-4 w-4 rounded border-hairline bg-bg"
                  />
                  <span className="text-[12px] text-[var(--color-text-muted)]">
                    {on ? "Turn off" : "Turn on"}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-4">
        {!state.ok && state.error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-canvas-pain)]">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
            Modules saved.
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-full border border-[var(--color-signal-deep)] px-5 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-signal-soft)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save modules"}
        </button>
      </div>
    </form>
  );
}
