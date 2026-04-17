"use client";

let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch("/api/admin/csrf-token", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch CSRF token");
  const data = await res.json();
  csrfToken = data.token;
  return csrfToken!;
}

// Reset cached CSRF token (e.g. after login)
export function resetCsrfToken(): void {
  csrfToken = null;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }

  return data as T;
}

type Method = "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Perform a CSRF-protected mutation with automatic retry on stale-token 403s.
 * Shared by adminPost/adminPut/adminPatch/adminDelete so the retry behaviour
 * is consistent across every admin mutation.
 */
async function csrfMutation<T>(
  method: Method,
  url: string,
  body?: unknown
): Promise<T> {
  const send = async (tokenToUse: string): Promise<Response> => {
    const headers: Record<string, string> = {
      "x-csrf-token": tokenToUse,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    return fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const token = await getCsrfToken();
  const res = await send(token);

  // CSRF token might be stale (2h lifetime) — refetch and retry once.
  if (res.status === 403) {
    csrfToken = null;
    const fresh = await getCsrfToken();
    const retry = await send(fresh);
    return handleResponse<T>(retry);
  }

  return handleResponse<T>(res);
}

export async function adminGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  return handleResponse<T>(res);
}

export async function adminPost<T>(url: string, body?: unknown): Promise<T> {
  return csrfMutation<T>("POST", url, body);
}

export async function adminPut<T>(url: string, body: unknown): Promise<T> {
  return csrfMutation<T>("PUT", url, body);
}

export async function adminPatch<T>(url: string, body?: unknown): Promise<T> {
  return csrfMutation<T>("PATCH", url, body);
}

export async function adminDelete<T>(url: string): Promise<T> {
  return csrfMutation<T>("DELETE", url);
}
