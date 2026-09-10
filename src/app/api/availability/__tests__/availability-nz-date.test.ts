import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

/**
 * /api/availability is the pre-check the booking widget calls before
 * create-session. It carried the same bug create-session had: it compared the
 * requested check-in against `new Date()` with the hours zeroed, which is
 * midnight in the SERVER's zone — UTC on Render.
 *
 * NZ is 12–13 hours ahead, so for the first half of every NZ day the UTC date
 * is still yesterday, and a night that had already gone in Cromwell looked
 * bookable. Not an edge case: a 12-hour window, every day.
 *
 * These freeze the clock inside that window and assert the endpoint refuses
 * the past date.
 */

const checkAvailability = vi.fn();

vi.mock("@/lib/uplisting", () => ({
  checkAvailability: (...args: unknown[]) => checkAvailability(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

async function post(body: unknown) {
  const { POST } = await import("../route");
  const res = await POST(
    new Request("http://localhost/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
  return { status: res.status, json: await res.json() };
}

/** Pin wall-clock time to a specific instant. */
function freezeAt(utcIso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(utcIso));
}

beforeEach(() => {
  checkAvailability.mockReset();
  checkAvailability.mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("/api/availability — the NZ morning window", () => {
  it("rejects yesterday's NZ date during the morning window (NZST)", async () => {
    // 08:00 on 9 September in Cromwell. UTC still says the 8th — exactly when
    // the old server-local check let the 8th through.
    freezeAt("2026-09-08T20:00:00Z");

    const { status, json } = await post({
      accommodation: "dome-rose",
      checkIn: "2026-09-08",
      checkOut: "2026-09-10",
    });

    expect(status).toBe(400);
    expect(json.error).toBe("Check-in date must be today or later");
    // The past date must be refused before Uplisting is ever consulted.
    expect(checkAvailability).not.toHaveBeenCalled();
  });

  it("rejects yesterday's NZ date during the morning window (NZDT, +13)", async () => {
    // 09:00 on 9 December in Cromwell.
    freezeAt("2026-12-08T20:00:00Z");

    const { status } = await post({
      accommodation: "dome-rose",
      checkIn: "2026-12-08",
      checkOut: "2026-12-10",
    });

    expect(status).toBe(400);
  });

  it("still accepts today in NZ from inside that same window", async () => {
    // Same instant as the first case: the 9th is today in Cromwell and must
    // remain bookable. A fix that simply rejected more would pass the test
    // above and break real bookings.
    freezeAt("2026-09-08T20:00:00Z");

    const { status, json } = await post({
      accommodation: "dome-rose",
      checkIn: "2026-09-09",
      checkOut: "2026-09-11",
    });

    expect(status).toBe(200);
    expect(json).toEqual({ success: true, available: true });
    expect(checkAvailability).toHaveBeenCalledWith(
      "dome-rose",
      "2026-09-09",
      "2026-09-11"
    );
  });

  it("accepts today in NZ during the evening, when UTC agrees", async () => {
    // 23:00 on 8 September in Cromwell; UTC is 11:00 the same day. The old
    // code was correct here — this guards against regressing the easy half.
    freezeAt("2026-09-08T11:00:00Z");

    const { status } = await post({
      accommodation: "dome-rose",
      checkIn: "2026-09-08",
      checkOut: "2026-09-10",
    });

    expect(status).toBe(200);
  });
});

describe("/api/availability — check-out ordering", () => {
  it("rejects a check-out on or before check-in", async () => {
    freezeAt("2026-09-08T20:00:00Z");

    for (const checkOut of ["2026-09-09", "2026-09-08"]) {
      const { status, json } = await post({
        accommodation: "dome-rose",
        checkIn: "2026-09-09",
        checkOut,
      });
      expect(status, `check-out ${checkOut}`).toBe(400);
      expect(json.error).toBe("Check-out must be after check-in");
    }
    expect(checkAvailability).not.toHaveBeenCalled();
  });

  it("orders dates across a month boundary", async () => {
    // String comparison must not fall over where the month rolls: "2026-10-01"
    // is after "2026-09-30" lexicographically as well as chronologically.
    freezeAt("2026-09-08T20:00:00Z");

    const { status } = await post({
      accommodation: "dome-rose",
      checkIn: "2026-09-30",
      checkOut: "2026-10-01",
    });

    expect(status).toBe(200);
  });
});
