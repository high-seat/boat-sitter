import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../context";

/**
 * Require a logged-in user (populated by the session middleware in index.ts).
 * Use on any endpoint that mutates data.
 */
export const requireUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get("user")) {
    // #region agent log
    console.log(
      "DEBUG_C8FEAE",
      JSON.stringify({
        sessionId: "c8feae",
        hypothesisId: "F",
        location: "auth.ts:requireUser",
        message: "Sign in required",
        data: { path: c.req.path, method: c.req.method },
        timestamp: Date.now(),
      }),
    );
    // #endregion
    return c.json({ error: "Sign in required" }, 401);
  }
  await next();
};

/**
 * Minimal bearer-token guard, kept only for the destructive dev reset.
 *
 * This is a placeholder so the write routes are not open to the world during
 * development. Before you take real signups, replace it with Better Auth
 * (session cookies + an `role` claim) — a shared static token does not give you
 * per-user attribution, which you will want for an audit trail.
 *
 * Set the secret with:  wrangler secret put ADMIN_TOKEN
 */
export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  const expected = c.env.ADMIN_TOKEN;

  if (!expected) {
    return c.json({ error: "ADMIN_TOKEN is not configured on this Worker" }, 500);
  }

  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !timingSafeEqual(token, expected)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};

/** Constant-time string comparison, to avoid leaking the token via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
