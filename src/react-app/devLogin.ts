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

/**
 * Distinctive avatar for tool-created test users — a red "TEST" badge, so a dev
 * account is instantly recognizable anywhere it appears (nav, member cards,
 * applications). Inline SVG data URI: no network dependency, always renders.
 */
export const TEST_USER_AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
      '<rect width="160" height="160" rx="24" fill="#e11d48"/>' +
      '<text x="80" y="98" font-family="Helvetica,Arial,sans-serif" font-size="40" ' +
      'font-weight="bold" fill="#ffffff" text-anchor="middle">TEST</text></svg>',
  );

/** A brand-new unique test identity. Dev-domain email so it's obviously fake. */
export function freshTestUser(): { email: string; name: string; image: string } {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    email: `dev-${suffix}@boatstead.test`,
    name: `Dev User ${suffix.slice(-4)}`,
    image: TEST_USER_AVATAR,
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
  image?: string;
  requiresSecret: boolean;
}): Promise<DevResult> {
  const res = await devFetch(
    "/api/dev/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: opts.email, name: opts.name, image: opts.image }),
    },
    opts.requiresSecret,
  );
  return res.ok ? { ok: true, data: undefined } : res;
}

export type TestUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  createdAt?: number | string;
};

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

/** True if an email belongs to a tool-created test user. */
export function isDevTestUserEmail(email?: string | null): boolean {
  return Boolean(email && /^dev-.*@boatstead\.test$/i.test(email));
}

const BOAT_NAME_PREFIXES = ["Sea", "Blue", "North", "Wind", "Salt", "Wave", "Coral", "Drift"];
const BOAT_NAME_SUFFIXES = ["Breeze", "Voyager", "Spirit", "Dancer", "Runner", "Star", "Haven"];
const BOAT_TYPES = ["Sailboat", "Motor yacht", "Catamaran", "Trawler", "Houseboat"];
// [city, country, full port address] — the port address matters because the
// sit editor requires the boat to have one.
const BOAT_LOCATIONS: Array<[string, string, string]> = [
  ["Palma", "Spain", "Real Club Náutico de Palma, 07012 Palma, Spain"],
  ["Lefkada", "Greece", "Lefkas Marina, Lefkada 311 00, Greece"],
  ["Brighton", "United Kingdom", "Brighton Marina, Brighton BN2 5UF, United Kingdom"],
  ["Split", "Croatia", "ACI Marina Split, 21000 Split, Croatia"],
  ["Newport", "United States", "Newport Yachting Center, Newport, RI 02840, United States"],
  ["Auckland", "New Zealand", "Westhaven Marina, Auckland 1011, New Zealand"],
];
const BOAT_IMAGES = [
  "https://images.pexels.com/photos/273886/pexels-photo-273886.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/540518/pexels-photo-540518.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/237272/pexels-photo-237272.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/42091/pexels-photo-42091.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1167021/pexels-photo-1167021.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/144634/pexels-photo-144634.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/1295036/pexels-photo-1295036.jpeg?auto=compress&cs=tinysrgb&w=1400",
];

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/**
 * Create a boat with random details for the CURRENTLY logged-in user, via the
 * real PUT /api/vessels (server sets owner = the session user). Works anywhere
 * you have a session — no dev secret needed. Returns the new boat's id + name.
 */
export async function createRandomBoat(): Promise<DevResult<{ id: string; name: string }>> {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const id = `dev-boat-${stamp}`;
  const name = `${pick(BOAT_NAME_PREFIXES)} ${pick(BOAT_NAME_SUFFIXES)}`;
  const type = pick(BOAT_TYPES);
  const [location, country, fullAddress] = pick(BOAT_LOCATIONS);
  const body = {
    id,
    name,
    type,
    length: String(28 + Math.floor(Math.random() * 40)),
    yearBuilt: 1990 + Math.floor(Math.random() * 35),
    homePort: `${location}, ${country}`,
    // A real port address so the sit editor doesn't block on "no full address".
    fullAddress,
    image: pick(BOAT_IMAGES),
    gallery: [] as string[],
    owner: "Test", // server overrides with the session user's name
    ownerImage: "https://placehold.co/80/e11d48/ffffff?text=TEST",
    rating: 0,
    reviews: 0,
    description: `${name} is a randomly generated ${type.toLowerCase()} for testing.`,
    home: "A practical layout with a usable galley and easy marina access.",
    systems: ["Shore power", "Battery monitor"],
    amenities: ["Bathroom", "Full kitchen", "Wi-Fi"],
  };
  const res = await fetch(`/api/vessels/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) return { ok: false, error: "Log in as a test user first." };
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: detail || `Create boat failed (${res.status}).` };
  }
  return { ok: true, data: { id, name } };
}
