import { test, expect } from "@playwright/test";

const SEED_PASSWORD = "KerningSeed!2026";

test.describe("auth", () => {
  test("client owner sign-in routes to /portal/dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("owner@meridian.example.com");
    await page.locator('input[type="password"]').fill(SEED_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/portal/dashboard", { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /attention/i,
    );
  });

  test("super admin sign-in routes to /admin/command-center", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("super.admin@kerning.ooo");
    await page.locator('input[type="password"]').fill(SEED_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL("**/admin/command-center", { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /workspace/i,
    );
  });

  test("incorrect password shows error and stays on /login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("owner@meridian.example.com");
    await page.locator('input[type="password"]').fill("not-the-password");
    await page.locator('button[type="submit"]').click();

    // Match the form's own error alert (not Next's route announcer).
    await expect(page.locator("form [role=alert]")).toContainText("incorrect");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("client user gets bounced from /admin to /portal", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("owner@meridian.example.com");
    await page.locator('input[type="password"]').fill(SEED_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/portal/dashboard");

    await page.goto("/admin/command-center");
    await page.waitForURL("**/portal/dashboard");
  });
});
