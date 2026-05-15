import { describe, expect, it } from "vitest";

import {
  CLIENT_ROLES,
  INTERNAL_ROLES,
  PARTNER_ROLES,
  isClientRole,
  isInternalRole,
  isPartnerRole,
  type RoleSlug,
} from "@/lib/rbac/roles";

describe("roles catalogue", () => {
  it("has 13 internal and 14 client roles", () => {
    expect(INTERNAL_ROLES.length).toBe(13);
    expect(CLIENT_ROLES.length).toBe(14);
  });

  it("has 3 partner roles", () => {
    expect(PARTNER_ROLES.length).toBe(3);
    expect([...PARTNER_ROLES]).toEqual([
      "partner_owner",
      "partner_user",
      "partner_viewer",
    ]);
  });

  it("internal + client + partner slugs are pairwise disjoint", () => {
    const ic = INTERNAL_ROLES.filter((s) =>
      (CLIENT_ROLES as readonly string[]).includes(s),
    );
    const ip = INTERNAL_ROLES.filter((s) =>
      (PARTNER_ROLES as readonly string[]).includes(s),
    );
    const cp = CLIENT_ROLES.filter((s) =>
      (PARTNER_ROLES as readonly string[]).includes(s),
    );
    expect(ic).toEqual([]);
    expect(ip).toEqual([]);
    expect(cp).toEqual([]);
  });

  it("discriminator functions are correct for known slugs", () => {
    expect(isInternalRole("super_admin")).toBe(true);
    expect(isInternalRole("client_owner")).toBe(false);
    expect(isClientRole("client_owner")).toBe(true);
    expect(isClientRole("super_admin")).toBe(false);
    expect(isPartnerRole("partner_owner")).toBe(true);
    expect(isPartnerRole("client_owner")).toBe(false);
    expect(isPartnerRole("super_admin")).toBe(false);
    expect(isInternalRole("nope")).toBe(false);
    expect(isClientRole("nope")).toBe(false);
    expect(isPartnerRole("nope")).toBe(false);
  });

  it("invite allow-list (internal+client+partner) covers partner roles", () => {
    // Mirrors ALL_ROLE_SLUGS in lib/auth/invite-actions.ts — partners must
    // be invitable or the partner portal can never be onboarded.
    const inviteAllowList = [
      ...INTERNAL_ROLES,
      ...CLIENT_ROLES,
      ...PARTNER_ROLES,
    ] as readonly string[];
    for (const slug of PARTNER_ROLES) {
      expect(inviteAllowList).toContain(slug);
    }
  });

  it("includes load-bearing role slugs referenced by RLS policies", () => {
    const required: RoleSlug[] = [
      "super_admin",
      "client_owner",
      "site_director",
      "site_manager",
      "it_admin",
      "read_only_auditor_client",
    ];
    const all = [...INTERNAL_ROLES, ...CLIENT_ROLES] as readonly string[];
    for (const slug of required) {
      expect(all).toContain(slug);
    }
  });
});
