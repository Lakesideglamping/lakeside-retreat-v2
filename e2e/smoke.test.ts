import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage loads with key content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Lakeside/i);
    await expect(page.getByRole("link", { name: /book/i }).first()).toBeVisible();
  });

  test("booking page loads with accommodation selector", async ({ page }) => {
    await page.goto("/book");
    await expect(page.locator("select, [role=combobox]").first()).toBeVisible();
  });

  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});

test.describe("Admin login", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("invalid credentials shows error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Username").fill("wronguser");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated admin route redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe("API security", () => {
  test("admin API rejects unauthenticated requests", async ({ request }) => {
    const res = await request.get("/api/admin/bookings");
    expect([401, 403]).toContain(res.status());
  });

  test("chatbot API accepts valid requests", async ({ request }) => {
    const res = await request.post("/api/chatbot", {
      data: { messages: [{ role: "user", content: "What properties do you have?" }] },
    });
    expect([200, 429]).toContain(res.status());
  });
});
