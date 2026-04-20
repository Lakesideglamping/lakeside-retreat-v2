"use client";

import { useState, type FormEvent } from "react";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

type Step = "credentials" | "totp";

export function LoginForm() {
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      if (data.require2FA) {
        setStep("totp");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTotp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = useRecovery
        ? { username, password, recoveryCode: recoveryCode.toUpperCase() }
        : { username, password, totpCode };
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        setTotpCode("");
        setRecoveryCode("");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-gray-900">
              Lakeside Retreat
            </h1>
            <span className="mt-2 inline-block rounded-full bg-[#2d5a5a]/10 px-3 py-1 text-xs font-semibold text-[#2d5a5a]">
              Admin
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "credentials" && (
            <form onSubmit={handleCredentials} className="space-y-5">
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-2 focus:ring-[#2d5a5a]/20 disabled:opacity-50"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-2 focus:ring-[#2d5a5a]/20 disabled:opacity-50"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#234848] focus:outline-none focus:ring-2 focus:ring-[#2d5a5a]/50 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          )}

          {step === "totp" && (
            <form onSubmit={handleTotp} className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2d5a5a]/10">
                  <svg className="h-6 w-6 text-[#2d5a5a]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">
                  {useRecovery
                    ? "Enter one of your recovery codes (format: XXXXX-XXXXX)."
                    : "Open your authenticator app and enter the 6-digit code."}
                </p>
              </div>

              {!useRecovery ? (
                <div>
                  <label htmlFor="totpCode" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Verification code
                  </label>
                  <input
                    id="totpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    autoFocus
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-2xl font-mono tracking-[0.5em] text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-2 focus:ring-[#2d5a5a]/20 disabled:opacity-50"
                    placeholder="000000"
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="recoveryCode" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Recovery code
                  </label>
                  <input
                    id="recoveryCode"
                    type="text"
                    required
                    autoFocus
                    maxLength={11}
                    value={recoveryCode}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 11);
                      setRecoveryCode(v);
                    }}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg font-mono tracking-[0.2em] text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-2 focus:ring-[#2d5a5a]/20 disabled:opacity-50"
                    placeholder="XXXXX-XXXXX"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  (useRecovery
                    ? !/^[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(recoveryCode)
                    : totpCode.length !== 6)
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#234848] focus:outline-none focus:ring-2 focus:ring-[#2d5a5a]/50 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="text-white" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setUseRecovery((v) => !v);
                  setError("");
                  setTotpCode("");
                  setRecoveryCode("");
                }}
                className="w-full text-center text-sm text-[#2d5a5a] hover:underline"
              >
                {useRecovery ? "Use authenticator app instead" : "Lost your device? Use a recovery code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError("");
                  setTotpCode("");
                  setRecoveryCode("");
                  setUseRecovery(false);
                }}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
