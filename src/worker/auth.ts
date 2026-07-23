import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import { account, session, user, verification } from "./db/auth-schema";

/**
 * Build a Better Auth instance for the current request.
 *
 * Like the Drizzle client, this must be constructed per request (Workers are
 * stateless) — never a module-level singleton.
 *
 * Sign-up policy: if ALLOWED_EMAILS is set (comma-separated), only those
 * addresses may create an account; empty/unset means open sign-up.
 *
 * On local Vite/Playwright hosts, `baseURL` and cookie Secure flags follow the
 * request origin so session cookies work on http://127.0.0.1 even when
 * `BETTER_AUTH_URL` in wrangler.json points at production.
 */
export function buildAuth(env: Env, request?: Request) {
  const db = getDb(env);

  const allowList = (env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const requestOrigin = request ? new URL(request.url).origin : undefined;
  const isLocalHost =
    Boolean(requestOrigin?.startsWith("http://localhost")) ||
    Boolean(requestOrigin?.startsWith("http://127.0.0.1"));
  const configuredLocal = (env.BETTER_AUTH_URL ?? "").startsWith("http://");
  const isLocal = env.ENVIRONMENT !== "production" || isLocalHost || configuredLocal;
  const baseURL =
    isLocal && requestOrigin ? requestOrigin : (env.BETTER_AUTH_URL ?? requestOrigin ?? "");

  return betterAuth({
    baseURL,
    secret: env.BETTER_AUTH_SECRET,
    logger: { level: "debug" },
    advanced: {
      useSecureCookies: !isLocal,
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: !isLocal,
        httpOnly: true,
      },
    },
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        // Calendar access so we can create Google Meet links for video calls.
        // accessType offline + prompt consent → we receive a refresh token,
        // letting us mint Meet links server-side after the login token expires.
        scope: ["https://www.googleapis.com/auth/calendar.events"],
        accessType: "offline",
        prompt: "consent",
      },
    },
    trustedOrigins: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:4174",
      env.BETTER_AUTH_URL,
      "https://boatstead.sharukrules.workers.dev",
    ].filter(Boolean),
    databaseHooks: {
      user: {
        create: {
          before: async (u) => {
            if (allowList.length && !allowList.includes(u.email.toLowerCase())) {
              throw new Error("This email is not permitted to sign up.");
            }
            return { data: u };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof buildAuth>;
