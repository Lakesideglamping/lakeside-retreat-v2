import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The test-send endpoint exists to prove delivery, which means it is the one
 * admin route whose whole job is to send mail. Two properties matter more than
 * the happy path:
 *
 *   - it renders only templates from the shared registry, never an arbitrary
 *     id supplied by the caller
 *   - it sends only to the configured host address, never to a recipient in
 *     the request — an admin endpoint that mails anywhere is an open relay
 */

const testEmailConfiguration = vi.fn();
const sendTestEmail = vi.fn();
const checkRateLimit = vi.fn();
const auditLog = vi.fn();

vi.mock("@/lib/email", () => ({
  testEmailConfiguration: () => testEmailConfiguration(),
  sendTestEmail: (...a: unknown[]) => sendTestEmail(...(a as [])),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimit(...(a as [])),
}));
vi.mock("@/lib/audit", () => ({ auditLog: (...a: unknown[]) => auditLog(...(a as [])) }));
vi.mock("@/lib/admin-route", () => ({
  withAdminMutation: (req: Request, handler: (a: unknown, r: Request) => unknown) =>
    handler({ username: "admin" }, req),
  getClientIp: () => "1.2.3.4",
}));

async function post(body?: unknown) {
  const { POST } = await import("../route");
  const res = await POST(
    new Request("http://localhost/api/admin/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  testEmailConfiguration.mockReset();
  sendTestEmail.mockReset();
  checkRateLimit.mockReset();
  auditLog.mockReset();
  checkRateLimit.mockResolvedValue({ success: true });
  auditLog.mockResolvedValue(undefined);
  testEmailConfiguration.mockResolvedValue({ success: true, message: "SMTP ok" });
  sendTestEmail.mockResolvedValue({ success: true, message: "Test email sent" });
});

describe("verify mode", () => {
  it("with no templateId, only checks the connection — sends nothing", async () => {
    const { status, body } = await post({});
    expect(status).toBe(200);
    expect(testEmailConfiguration).toHaveBeenCalled();
    expect(sendTestEmail).not.toHaveBeenCalled();
    expect(body.message).toBe("SMTP ok");
  });

  it("treats a missing body as verify rather than an error", async () => {
    const { status } = await post();
    expect(status).toBe(200);
    expect(sendTestEmail).not.toHaveBeenCalled();
  });
});

describe("send mode", () => {
  it("renders a known template and sends it", async () => {
    const { status, body } = await post({ templateId: "pre_arrival" });
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendTestEmail).toHaveBeenCalledTimes(1);

    const [id, subject, html] = sendTestEmail.mock.calls[0] as [string, string, string];
    expect(id).toBe("pre_arrival");
    expect(subject).toContain("Pre-arrival");
    // Rendered HTML, not a template name — this is the actual email body.
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("refuses an unknown template instead of rendering it", async () => {
    const { status, body } = await post({ templateId: "../../etc/passwd" });
    expect(status).toBe(400);
    expect(body.message).toContain("Unknown template");
    expect(sendTestEmail).not.toHaveBeenCalled();
  });

  it("ignores any recipient the caller tries to supply", async () => {
    // The route takes only a templateId. sendTestEmail decides the recipient
    // from CONTACT_EMAIL, so nothing in the request can redirect the mail.
    await post({ templateId: "pre_arrival", to: "attacker@example.com" });
    const args = sendTestEmail.mock.calls[0] as unknown[];
    expect(args).toHaveLength(3);
    expect(JSON.stringify(args)).not.toContain("attacker@example.com");
  });

  it("reports a failed send as 502 rather than success", async () => {
    sendTestEmail.mockResolvedValue({ success: false, message: "Send failed: 535" });
    const { status, body } = await post({ templateId: "pre_arrival" });
    expect(status).toBe(502);
    expect(body.success).toBe(false);
  });
});

describe("guards", () => {
  it("rate limits, and does not send when limited", async () => {
    checkRateLimit.mockResolvedValue({ success: false });
    const { status } = await post({ templateId: "pre_arrival" });
    expect(status).toBe(429);
    expect(sendTestEmail).not.toHaveBeenCalled();
    expect(testEmailConfiguration).not.toHaveBeenCalled();
  });

  it("audit-logs both modes", async () => {
    await post({});
    expect(auditLog.mock.calls[0][1]).toBe("email_test_performed");

    auditLog.mockClear();
    await post({ templateId: "pre_arrival" });
    expect(auditLog.mock.calls[0][1]).toBe("email_test_sent");
  });
});
