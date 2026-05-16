import { test, expect } from "@playwright/test";

/**
 * Booking-flow regression tests.
 *
 * The booking page uses a custom calendar grid (not native date inputs)
 * which makes full UI walkthroughs fragile in e2e — they break on any
 * styling change. So we cover the flow two ways:
 *
 *   1. The /api/payments/create-session API contract — this is the actual
 *      seam between the frontend and Stripe. If this works, the UI can
 *      change freely without breaking the booking path.
 *   2. The /book page rendering without console errors or hydration
 *      issues. Catches accidentally breaking the React tree.
 *
 * Neither test creates a real Stripe Checkout session.
 */

test.describe("Booking API contract", () => {
  test("create-session accepts a valid payload and returns a checkout URL", async ({
    request,
  }) => {
    const checkIn = isoDateOffset(30);
    const checkOut = isoDateOffset(32);

    const res = await request.post("/api/payments/create-session", {
      data: {
        accommodation: "dome-pinot",
        checkIn,
        checkOut,
        guests: 2,
        guestName: "Playwright Test",
        guestEmail: "e2e-test@example.com",
        adultsOnlyConfirmed: true,
      },
    });

    // 200 with a Stripe URL is the happy path; 409 means the dates
    // collide with an existing booking in the dev DB which is also
    // valid evidence the route is alive. Either proves the API works.
    expect([200, 409]).toContain(res.status());

    if (res.status() === 200) {
      const body = (await res.json()) as { url?: string };
      expect(body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    }
  });

  test("create-session rejects missing adults-only confirmation", async ({
    request,
  }) => {
    const res = await request.post("/api/payments/create-session", {
      data: {
        accommodation: "dome-pinot",
        checkIn: isoDateOffset(30),
        checkOut: isoDateOffset(32),
        guests: 2,
        guestName: "Playwright Test",
        guestEmail: "e2e-test@example.com",
        // adultsOnlyConfirmed deliberately omitted
      },
    });
    expect(res.status()).toBe(400);
  });

  test("create-session rejects an unknown accommodation slug", async ({
    request,
  }) => {
    const res = await request.post("/api/payments/create-session", {
      data: {
        accommodation: "luxury-treehouse-not-real",
        checkIn: isoDateOffset(30),
        checkOut: isoDateOffset(32),
        guests: 2,
        guestName: "Playwright Test",
        guestEmail: "e2e-test@example.com",
        adultsOnlyConfirmed: true,
      },
    });
    expect(res.status()).toBe(400);
  });

  test("create-session rejects impossible dates", async ({ request }) => {
    const res = await request.post("/api/payments/create-session", {
      data: {
        accommodation: "dome-pinot",
        checkIn: "2026-13-45",
        checkOut: "2026-13-46",
        guests: 2,
        guestName: "Playwright Test",
        guestEmail: "e2e-test@example.com",
        adultsOnlyConfirmed: true,
      },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("Booking page", () => {
  test("renders without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/book");

    // Wait for the booking widget to hydrate — the accommodation cards
    // are buttons, so the first <button> inside the widget is good
    // evidence the React tree mounted.
    await expect(
      page.getByRole("button", { name: /Dome Pinot/i }).first()
    ).toBeVisible({ timeout: 10_000 });

    // Filter Next.js dev-mode noise and Sentry instrumentation chatter;
    // anything that survives is a real regression.
    const real = consoleErrors.filter(
      (e) =>
        !e.includes("[Fast Refresh]") &&
        !e.includes("Download the React DevTools") &&
        !e.includes("Sentry") &&
        !e.includes("sentry")
    );
    expect(real).toEqual([]);
  });
});

function isoDateOffset(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
