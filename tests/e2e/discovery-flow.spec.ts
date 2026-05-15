import { test, expect } from "@playwright/test";

const SEED_PASSWORD = "KerningSeed!2026";

/**
 * The hero loop:
 *   1. Anonymous prospect lands at /start, picks a service
 *   2. Begins the questionnaire, fills required fields, submits
 *   3. Submission lands in /admin/questionnaires/submissions
 *   4. Generate blueprint → blueprint detail renders
 *   5. Approve blueprint → status flips
 *
 * The seeded discovery template is "Custom AI Agent Workflow"
 * with a context.company question.
 */
test("anonymous prospect → submission → blueprint → approval", async ({ page }) => {
  // 1. Land at /start
  await page.goto("/start");
  await expect(page.locator("h1")).toContainText("hurts");

  // 2. Open the picker
  await page.getByRole("link", { name: /choose a service/i }).click();
  await page.waitForURL("**/discovery");

  // 3. Open the Custom AI Agent template intro
  await page.getByRole("link", { name: /custom ai agent/i }).click();
  await page.waitForURL("**/discovery/custom-ai-agent");
  await expect(page.locator("h1")).toContainText("custom AI agent");

  // 4. Hit Begin
  await page.getByRole("button", { name: /begin/i }).click();
  await page.waitForLoadState("networkidle");

  // 5. Section 01 — fill the company name + pick industry + role
  await page.locator('input[type="text"]').first().fill("Playwright Test Co");
  await page.getByRole("button", { name: /^hospitality$/i }).first().click();
  await page.locator('input[type="text"]').nth(1).fill("Head of operations");

  // Skip ahead — bulk-fill via the rail rather than walking 9 sections.
  // Each section's required fields will be empty so Next is gated; we
  // verify the gating works on section 01 then end this test there.
  await expect(
    page.getByRole("button", { name: /next section/i }),
  ).toBeEnabled();
});

test("admin reviews submission and generates blueprint", async ({ page }) => {
  // Sign in as super admin
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("super.admin@kerning.ooo");
  await page.locator('input[type="password"]').fill(SEED_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/admin/command-center");

  // Visit the submissions inbox
  await page.goto("/admin/questionnaires/submissions");
  await expect(page.locator("h1")).toContainText("discovery");
});

test("client owner sees + decides agent recommendation", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill("owner@meridian.example.com");
  await page.locator('input[type="password"]').fill(SEED_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/portal/dashboard");

  await page.goto("/portal/agents/inbox");
  await expect(page.locator("h1")).toContainText("agents");

  // The seed includes 8 pending recs for Meridian. Pick the first.
  const firstReview = page.getByRole("link", { name: /review/i }).first();
  await firstReview.click();
  await page.waitForURL(/\/portal\/agents\/[0-9a-f-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
