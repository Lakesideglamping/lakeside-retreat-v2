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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }

  return data as T;
}

export async function adminGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  return handleResponse<T>(res);
}

export async function adminPost<T>(url: string, body?: unknown): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": token,
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  // CSRF token might be stale — retry once
  if (res.status === 403) {
    csrfToken = null;
    const freshToken = await getCsrfToken();
    const retry = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": freshToken,
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(retry);
  }

  return handleResponse<T>(res);
}

export async function adminPut<T>(url: string, body: unknown): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": token,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function adminDelete<T>(url: string): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "x-csrf-token": token },
    credentials: "include",
  });
  return handleResponse<T>(res);
}

export async function adminPatch<T>(url: string, body?: unknown): Promise<T> {
  const token = await getCsrfToken();
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": token,
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}
