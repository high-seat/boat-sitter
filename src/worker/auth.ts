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
 */
export function buildAuth(env: Env) {
  const db = getDb(env);

  const allowList = (env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // On http://localhost the cookies must NOT be Secure, or the browser drops
  // them and the OAuth "state" cookie never comes back → state_not_found.
  const isLocal = (env.BETTER_AUTH_URL ?? "").startsWith("http://");

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
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
      },
    },
    trustedOrigins: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://boatstead.sharukrules.workers.dev",
    ],
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
