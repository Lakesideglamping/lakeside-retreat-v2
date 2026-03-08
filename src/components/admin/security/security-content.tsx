"use client";

import { useState, useEffect, useCallback } from "react";
import { adminGet, adminPost } from "@/lib/admin-api";
import { Alert } from "@/components/admin/ui/alert";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";
import { Badge } from "@/components/admin/ui/badge";

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function validatePassword(password: string): string | null {
  if (password.length < 12) return "Password must be at least 12 characters";
  if (!/[A-Z]/.test(password)) return "Must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Must contain a digit";
  return null;
}

export function SecurityContent() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(true);

  const fetch2faStatus = useCallback(async () => {
    setTwoFaLoading(true);
    try {
      const data = await adminGet<{ enabled: boolean }>(
        "/api/admin/2fa/status"
      );
      setTwoFaEnabled(data.enabled);
    } catch {
      // Leave as disabled
    } finally {
      setTwoFaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch2faStatus();
  }, [fetch2faStatus]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    // Client-side validation
    const errors: PasswordErrors = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      errors.newPassword = passwordValidation;
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setPasswordLoading(true);

    try {
      await adminPost("/api/admin/change-password", {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Compute password strength for visual indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, label: "" };
    let score = 0;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: 1, label: "Weak" };
    if (score <= 4) return { level: 2, label: "Fair" };
    return { level: 3, label: "Strong" };
  };

  const strength = getPasswordStrength(newPassword);

  const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-green-500"];
  const strengthTextColors = [
    "",
    "text-red-600",
    "text-yellow-600",
    "text-green-600",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your password and security settings
        </p>
      </div>

      {/* Password Change Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h2>

        {passwordSuccess && (
          <Alert
            variant="success"
            title="Success"
            dismissible
            onDismiss={() => setPasswordSuccess(null)}
          >
            {passwordSuccess}
          </Alert>
        )}
        {passwordError && (
          <Alert
            variant="error"
            title="Error"
            dismissible
            onDismiss={() => setPasswordError(null)}
          >
            {passwordError}
          </Alert>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-4 max-w-md space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a] ${
                passwordErrors.currentPassword
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
              autoComplete="current-password"
            />
            {passwordErrors.currentPassword && (
              <p className="text-xs text-red-500">
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a] ${
                passwordErrors.newPassword
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
              autoComplete="new-password"
            />
            {passwordErrors.newPassword && (
              <p className="text-xs text-red-500">
                {passwordErrors.newPassword}
              </p>
            )}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full ${
                        level <= strength.level
                          ? strengthColors[strength.level]
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs font-medium ${
                    strengthTextColors[strength.level]
                  }`}
                >
                  {strength.label}
                </p>
              </div>
            )}
            <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
              <li
                className={
                  newPassword.length >= 12 ? "text-green-600" : ""
                }
              >
                At least 12 characters
              </li>
              <li
                className={
                  /[A-Z]/.test(newPassword) ? "text-green-600" : ""
                }
              >
                One uppercase letter
              </li>
              <li
                className={
                  /[a-z]/.test(newPassword) ? "text-green-600" : ""
                }
              >
                One lowercase letter
              </li>
              <li
                className={
                  /[0-9]/.test(newPassword) ? "text-green-600" : ""
                }
              >
                One digit
              </li>
            </ul>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#2d5a5a] focus:outline-none focus:ring-1 focus:ring-[#2d5a5a] ${
                passwordErrors.confirmPassword
                  ? "border-red-400"
                  : "border-gray-300"
              }`}
              autoComplete="new-password"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-red-500">
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2d5a5a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#234848] disabled:opacity-50"
          >
            {passwordLoading && (
              <LoadingSpinner size="sm" className="text-white" />
            )}
            Change Password
          </button>
        </form>
      </div>

      {/* 2FA Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Two-Factor Authentication
          </h2>
          {twoFaLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Badge variant={twoFaEnabled ? "success" : "default"}>
              {twoFaEnabled ? "Enabled" : "Disabled"}
            </Badge>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Add an extra layer of security to your admin account by requiring a
          verification code in addition to your password.
        </p>

        {!twoFaLoading && !twoFaEnabled && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Two-factor authentication is not currently configured. This
              feature will be available in a future update with support for
              authenticator apps (TOTP).
            </p>
            <button
              disabled
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              Set Up 2FA (Coming Soon)
            </button>
          </div>
        )}

        {!twoFaLoading && twoFaEnabled && (
          <Alert variant="success" title="2FA is Active">
            Two-factor authentication is enabled for your account.
          </Alert>
        )}
      </div>
    </div>
  );
}
