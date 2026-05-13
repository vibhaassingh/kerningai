import { describe, expect, it } from "vitest";

import {
  PERMISSIONS,
  isPermission,
  type PermissionSlug,
} from "@/lib/rbac/permissions";

describe("permissions catalogue", () => {
  it("has the expected permission count (sanity check on growth)", () => {
    expect(PERMISSIONS.length).toBeGreaterThanOrEqual(40);
  });

  it("contains the load-bearing slugs used by RLS + server checks", () => {
    const required: PermissionSlug[] = [
      "view_dashboard",
      "manage_clients",
      "manage_sites",
      "manage_questionnaires",
      "approve_solution_blueprints",
      "approve_agent_actions",
      "manage_billing",
      "manage_cms",
      "view_audit_logs",
      "manage_security_settings",
      "manage_connected_accounts",
      "impersonate_client_user",
    ];
    for (const slug of required) {
      expect(PERMISSIONS).toContain(slug);
    }
  });

  it("has no duplicate slugs", () => {
    expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
  });

  it("isPermission discriminates correctly", () => {
    expect(isPermission("view_dashboard")).toBe(true);
    expect(isPermission("manage_billing")).toBe(true);
    expect(isPermission("not_a_real_permission")).toBe(false);
    expect(isPermission("")).toBe(false);
  });
});
