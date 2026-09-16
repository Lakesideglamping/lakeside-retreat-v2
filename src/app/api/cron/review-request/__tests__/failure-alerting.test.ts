import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * A failed post-stay email has to reach the host.
 *
 * The finder looks at a single day's departures, so a booking missed today is
 * never offered again — the guest simply never hears from us. Before this, the
 * failure was swallowed: the job logged an error, returned success, and
 * counted the failed booking as sent.
 *
 * These assert the three things that has to mean: the batch survives one bad
 * booking, the counts reflect outcomes rather than iterations, and exactly one
 * alert goes out per run.
 */

const findReviewCandidates = vi.fn();
const processReviewRequest = vi.fn();
const sendSystemAlert = vi.fn(() => Promise.resolve());

vi.mock("@/lib/marketing-automation", () => ({
  findReviewCandidates: () => findReviewCandidates(),
  processReviewRequest: (b: unknown) => processReviewRequest(b),
}));
vi.mock("@/lib/email", () => ({
  sendSystemAlert: (...a: unknown[]) => sendSystemAlert(...(a as [])),
}));
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/lib/cron-auth", () => ({ verifyCronSecret: () => true }));

const booking = (id: string) => ({ id });

async function run() {
  const { POST } = await import("../route");
  const res = await POST(
    new Request("http://localhost/api/cron/review-request", { method: "POST" })
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  findReviewCandidates.mockReset();
  processReviewRequest.mockReset();
  sendSystemAlert.mockReset();
  sendSystemAlert.mockReturnValue(Promise.resolve());
});

describe("review-request cron: failure handling", () => {
  it("keeps going after one booking fails, and reports both counts", async () => {
    findReviewCandidates.mockResolvedValue([
      booking("ok-1"),
      booking("bad"),
      booking("ok-2"),
    ]);
    processReviewRequest.mockImplementation(async (b: { id: string }) => {
      if (b.id === "bad") throw new Error("Invalid login: 535 auth failed");
      return "sent";
    });

    const { status, body } = await run();

    expect(status).toBe(200);
    // The booking after the failure still got its email.
    expect(processReviewRequest).toHaveBeenCalledTimes(3);
    expect(body.sent).toBe(2);
    expect(body.failed).toBe(1);
  });

  it("alerts once for the batch, not once per failure", async () => {
    findReviewCandidates.mockResolvedValue([
      booking("bad-1"),
      booking("bad-2"),
      booking("bad-3"),
    ]);
    processReviewRequest.mockRejectedValue(new Error("SMTP unreachable"));

    const { body } = await run();

    expect(body.sent).toBe(0);
    expect(body.failed).toBe(3);
    expect(sendSystemAlert).toHaveBeenCalledTimes(1);

    const [type, subject, details] = sendSystemAlert.mock.calls[0] as unknown as
      [string, string, string];
    expect(type).toBe("CRON_FAILURE");
    expect(subject).toContain("3 of 3");
    // Every failing booking is named, so the host knows who to follow up.
    for (const id of ["bad-1", "bad-2", "bad-3"]) {
      expect(details).toContain(id);
    }
    // And told that nothing will retry them.
    expect(details).toContain("NOT be retried");
  });

  it("stays silent when everything succeeds", async () => {
    findReviewCandidates.mockResolvedValue([booking("a"), booking("b")]);
    processReviewRequest.mockResolvedValue("sent");

    const { body } = await run();

    expect(body.sent).toBe(2);
    expect(body.failed).toBe(0);
    expect(sendSystemAlert).not.toHaveBeenCalled();
  });

  it("counts a skipped duplicate as neither sent nor failed", async () => {
    // findReviewCandidates already excludes these; the inner check is a guard
    // against a concurrent run. It must not inflate the success count.
    findReviewCandidates.mockResolvedValue([booking("fresh"), booking("dupe")]);
    processReviewRequest.mockImplementation(async (b: { id: string }) =>
      b.id === "dupe" ? "skipped" : "sent"
    );

    const { body } = await run();

    expect(body.sent).toBe(1);
    expect(body.skipped).toBe(1);
    expect(body.failed).toBe(0);
    expect(sendSystemAlert).not.toHaveBeenCalled();
  });

  it("does not let a failing alert take down the job", async () => {
    findReviewCandidates.mockResolvedValue([booking("bad")]);
    processReviewRequest.mockRejectedValue(new Error("boom"));
    sendSystemAlert.mockReturnValue(Promise.reject(new Error("alert down")));

    const { status, body } = await run();

    expect(status).toBe(200);
    expect(body.failed).toBe(1);
  });
});
