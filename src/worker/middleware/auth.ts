import type { MiddlewareHandler } from "hono";

/**
 * Minimal bearer-token guard for write endpoints.
 *
 * This is a placeholder so the write routes are not open to the world during
 * development. Before you take real signups, replace it with Better Auth
 * (session cookies + an `role` claim) — a shared static token does not give you
 * per-user attribution, which you will want for an audit trail.
 *
 * Set the secret with:  wrangler secret put ADMIN_TOKEN
 */
export const requireAdmin: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
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
