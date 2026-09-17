"use client";

import { useState } from "react";
import { adminPost } from "@/lib/admin-api";

type Result = { success: boolean; message: string };

/**
 * Sends the template currently being previewed to the host address.
 *
 * adminPost handles the x-csrf-token header that withAdminMutation requires,
 * so there is no CSRF handling to do here.
 */
export function TestSendButton({ templateId }: { templateId: string }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await adminPost<Result>("/api/admin/email/test", { templateId });
      setResult(res);
    } catch (err) {
      // adminPost throws on a non-2xx, including the 502 the route returns
      // when the send itself failed — surface that rather than a blank button.
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Send failed",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#244a4a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send test to me"}
      </button>

      {result && (
        <span
          role="status"
          className={`text-sm ${result.success ? "text-green-700" : "text-red-700"}`}
        >
          {result.success ? "✓ " : "✕ "}
          {result.message}
        </span>
      )}
    </div>
  );
}
