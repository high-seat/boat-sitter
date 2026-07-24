import { useQuery } from "@tanstack/react-query";

/**
 * Founder-only helper to spin up a REAL logged-in test user on any reachable
 * non-prod environment (local + staging), backed by POST /api/dev/login.
 *
 * Unlike the mock Cmd+K personas (which only set client store state), this
 * creates a real Better Auth session cookie — so the account can do everything
 * a real user can (create boats/sits, apply, message) and each incognito window
 * that calls it gets its own isolated session.
 *
 * On staging the endpoint is secret-gated (DEV_LOGIN_SECRET). The secret is
 * NOT in the bundle: it's entered once per browser and cached in localStorage.
 * The whole /api/dev router 404s on prod, so `enabled` is false there.
 */

const SECRET_KEY = "boatstead-dev-login-secret";

export type DevToolsStatus = {
  enabled: boolean;
  requiresSecret: boolean;
  /** "production" | "staging" | "" — from the server, used to gate UI on prod. */
  environment: string;
};

const DISABLED: DevToolsStatus = { enabled: false, requiresSecret: false, environment: "" };

/** Query /api/dev/status. 404 (prod, misconfigured) → disabled. Runs when `active`. */
export function useDevToolsStatus(active: boolean): DevToolsStatus {
  const { data } = useQuery({
    queryKey: ["dev-tools-status"],
    enabled: active,
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<DevToolsStatus> => {
      const res = await fetch("/api/dev/status", { credentials: "include" });
      if (!res.ok) return DISABLED;
      const body = (await res.json()) as { requiresDevSecret?: boolean; environment?: string };
      return {
        enabled: true,
        requiresSecret: Boolean(body.requiresDevSecret),
        environment: body.environment ?? "",
      };
    },
  });
  return data ?? DISABLED;
}

export function getStoredDevSecret(): string {
  try {
    return localStorage.getItem(SECRET_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredDevSecret(secret: string): void {
  try {
    localStorage.setItem(SECRET_KEY, secret);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

export function clearStoredDevSecret(): void {
  try {
    localStorage.removeItem(SECRET_KEY);
  } catch {
    // ignore
  }
}

/** A brand-new unique test identity. Dev-domain email so it's obviously fake. */
export function freshTestUser(): { email: string; name: string } {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    email: `dev-${suffix}@boatstead.test`,
    name: `Dev User ${suffix.slice(-4)}`,
  };
}

export type DevResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; needSecret?: boolean };

/**
 * fetch() wrapper for the secret-gated dev endpoints. Injects the cached secret
 * (prompting once if missing), and on a 401 drops the bad secret so the next
 * call re-prompts.
 */
async function devFetch(
  path: string,
  init: RequestInit,
  requiresSecret: boolean,
): Promise<DevResult<Response>> {
  const headers = new Headers(init.headers);
  if (requiresSecret) {
    let secret = getStoredDevSecret();
    if (!secret) {
      secret = window.prompt("Enter the dev login secret (DEV_LOGIN_SECRET):")?.trim() ?? "";
      if (!secret) return { ok: false, error: "A dev secret is required.", needSecret: true };
      setStoredDevSecret(secret);
    }
    headers.set("x-dev-secret", secret);
  }
  const res = await fetch(path, { ...init, credentials: "include", headers });
  if (res.status === 401) {
    clearStoredDevSecret();
    return { ok: false, error: "Dev secret was rejected. Try again.", needSecret: true };
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: detail || `Request failed (${res.status}).` };
  }
  return { ok: true, data: res };
}

/**
 * Create-or-sign-in a real user via /api/dev/login and (on success) establish
 * the session cookie in this browser. Caller should reload afterwards so the
 * app re-hydrates the session from /api/me.
 */
export async function devLoginAs(opts: {
  email: string;
  name: string;
  requiresSecret: boolean;
}): Promise<DevResult> {
  const res = await devFetch(
    "/api/dev/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: opts.email, name: opts.name }),
    },
    opts.requiresSecret,
  );
  return res.ok ? { ok: true, data: undefined } : res;
}

export type TestUser = { id: string; email: string; name: string; createdAt?: number | string };

/** List the tool-created test users (dev-%@boatstead.test), newest first. */
export async function listTestUsers(requiresSecret: boolean): Promise<DevResult<TestUser[]>> {
  const res = await devFetch("/api/dev/test-users", { method: "GET" }, requiresSecret);
  if (!res.ok) return res;
  const body = (await res.data.json().catch(() => null)) as { data?: TestUser[] } | null;
  return { ok: true, data: body?.data ?? [] };
}

/** Delete one tool-created test user (and all their data). */
export async function deleteTestUser(id: string, requiresSecret: boolean): Promise<DevResult> {
  const res = await devFetch(
    `/api/dev/test-users/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    requiresSecret,
  );
  return res.ok ? { ok: true, data: undefined } : res;
}

/** Delete ALL tool-created test users at once. */
export async function deleteAllTestUsers(requiresSecret: boolean): Promise<DevResult<number>> {
  const res = await devFetch("/api/dev/test-users", { method: "DELETE" }, requiresSecret);
  if (!res.ok) return res;
  const body = (await res.data.json().catch(() => null)) as { data?: { deleted?: number } } | null;
  return { ok: true, data: body?.data?.deleted ?? 0 };
}
