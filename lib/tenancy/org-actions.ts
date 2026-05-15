"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/require";
import { getUserMemberships } from "@/lib/tenancy/current-org";

const SELECTED_ORG_COOKIE = "kerning_selected_org";

const switchSchema = z.object({
  organizationId: z.string().uuid(),
  redirectTo: z.string().optional(),
});

/**
 * Sets the `kerning_selected_org` cookie so subsequent server-side reads
 * pick the chosen org as the user's current scope. Validates that the
 * user actually has an active membership in the target org before
 * setting the cookie — refusing the switch otherwise.
 */
export async function switchOrg(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = switchSchema.safeParse({
    organizationId: formData.get("organizationId"),
    redirectTo: formData.get("redirectTo") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  await requireUser();
  const memberships = await getUserMemberships();
  const target = memberships.find(
    (m) => m.organizationId === parsed.data.organizationId,
  );
  if (!target) {
    return { ok: false, error: "Not a member of that organization." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_ORG_COOKIE, parsed.data.organizationId, {
    path: "/",
    httpOnly: false, // readable by client for the switcher's current selection
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  // Route to the right shell for the new org's type.
  const fallback =
    target.organizationType === "internal"
      ? "/admin"
      : target.organizationType === "partner"
        ? "/partner"
        : "/portal";
  redirect(parsed.data.redirectTo ?? fallback);
}

export const SELECTED_ORG_COOKIE_NAME = SELECTED_ORG_COOKIE;
