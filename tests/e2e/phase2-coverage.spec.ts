import { test, expect } from "@playwright/test";

const SEED_PASSWORD = "KerningSeed!2026";

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  expectedPath: string,
) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(SEED_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**${expectedPath}**`, { timeout: 15_000 });
}

test.describe("Phase 2 admin surfaces (super_admin)", () => {
  test("CMS dual-mode page renders", async ({ page }) => {
    await signIn(page, "super.admin@kerning.ooo", "/admin");
    await page.goto("/admin/cms");
    await expect(page.getByText(/Dual-mode/i)).toBeVisible();
    // The create form must be present (manage_cms granted to super_admin).
    await expect(
      page.getByRole("button", { name: /create post/i }),
    ).toBeVisible();
  });

  test("System Health page renders DB-derived vitals", async ({ page }) => {
    await signIn(page, "super.admin@kerning.ooo", "/admin");
    await page.goto("/admin/system-health");
    await expect(page.getByText(/vital signs/i)).toBeVisible();
    await expect(page.getByText(/Agent runs/i)).toBeVisible();
  });

  test("Deployments registry renders client topology", async ({ page }) => {
    await signIn(page, "super.admin@kerning.ooo", "/admin");
    await page.goto("/admin/deployments");
    await expect(page.getByText(/Where every client/i)).toBeVisible();
    // Seed has Meridian/Northline/CivicCare + Saurabh — at least one row.
    await expect(page.getByText(/Mumbai|eu-|ap-/i).first()).toBeVisible();
  });

  test("Solution blueprints admin list renders", async ({ page }) => {
    await signIn(page, "super.admin@kerning.ooo", "/admin");
    await page.goto("/admin/solution-blueprints");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Client portal (Meridian owner)", () => {
  test("agent inbox shows seeded pending recommendations", async ({ page }) => {
    await signIn(page, "owner@meridian.example.com", "/portal");
    await page.goto("/portal/agents/inbox");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Meridian seed has pending recommendations — the inbox must not be
    // the empty state.
    await expect(page.getByText(/no .*recommendations/i)).toHaveCount(0);
  });
});
