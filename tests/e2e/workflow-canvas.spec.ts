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

test.describe("workflow canvas", () => {
  test("internal admin sees Saurabh project + can open workflow canvas", async ({ page }) => {
    await signIn(page, "super.admin@kerning.ooo", "/admin");

    // Saurabh org id is stable from migration 0021.
    const SAURABH_ORG = "22222222-2222-2222-2222-222222220002";
    await page.goto(`/admin/clients/${SAURABH_ORG}/projects`);

    // Project list page renders the seeded project.
    await expect(page.getByText(/ERP \+ AI Workflow Blueprint/i)).toBeVisible();

    // Click into the project, then workflow canvas.
    await page.getByText(/ERP \+ AI Workflow Blueprint/i).first().click();
    await page.waitForURL("**/projects/**/overview");

    // Navigate to canvas list via tab.
    await page.getByRole("link", { name: /workflow canvas/i }).first().click();
    await page.waitForURL("**/workflow-canvas");
    await expect(page.getByText(/Workflow canvases/i)).toBeVisible();

    // The combined canvas is one of the seeded canvases.
    await expect(page.getByText(/Saurabh Arora — Workflow Canvas/i)).toBeVisible();
  });

  test("partner sees only their referred Saurabh project on /partner", async ({ page }) => {
    await signIn(page, "owner@avinash.example.com", "/partner");

    // Dashboard renders.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Projects page lists the Saurabh project.
    await page.goto("/partner/projects");
    await expect(page.getByText(/ERP \+ AI Workflow Blueprint/i)).toBeVisible();
  });

  test("client portal exposes the Saurabh project at /portal/projects", async ({ page }) => {
    await signIn(page, "owner@saurabh-arora.example.com", "/portal");
    await page.goto("/portal/projects");
    await expect(page.getByText(/ERP \+ AI Workflow Blueprint/i)).toBeVisible();
  });
});
