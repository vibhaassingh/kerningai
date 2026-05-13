import { describe, expect, it } from "vitest";

import {
  CLIENT_ROLES,
  INTERNAL_ROLES,
  isClientRole,
  isInternalRole,
  type RoleSlug,
} from "@/lib/rbac/roles";

describe("roles catalogue", () => {
  it("has 13 internal and 14 client roles", () => {
    expect(INTERNAL_ROLES.length).toBe(13);
    expect(CLIENT_ROLES.length).toBe(14);
  });

  it("internal + client slugs are disjoint", () => {
    const overlap = INTERNAL_ROLES.filter((s) =>
      (CLIENT_ROLES as readonly string[]).includes(s),
    );
    expect(overlap).toEqual([]);
  });

  it("discriminator functions are correct for known slugs", () => {
    expect(isInternalRole("super_admin")).toBe(true);
    expect(isInternalRole("client_owner")).toBe(false);
    expect(isClientRole("client_owner")).toBe(true);
    expect(isClientRole("super_admin")).toBe(false);
    expect(isInternalRole("nope")).toBe(false);
    expect(isClientRole("nope")).toBe(false);
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
