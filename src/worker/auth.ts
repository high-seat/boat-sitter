import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { account, session, user, verification } from "./db/auth-schema";
import { profiles } from "./db/schema";
import { sendNotificationEmail } from "./email";

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
    emailAndPassword: {
      enabled: true,
      // Hard-block unverified sign-in only when explicitly turned on (flip to
      // "true" once a Resend sending domain is verified, so emails reach real
      // users). Until then the verification email still sends, but sign-in isn't
      // blocked — avoids locking out testers pre-domain.
      requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION === "true",
      // "Forgot password" / "set a password" (for Google-only users) email.
      resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
      sendResetPassword: async ({ user: u, url }) => {
        await sendNotificationEmail(env, {
          to: u.email,
          subject: "Reset your Boatstead password",
          heading: "Reset your password",
          body: "Tap the button below to choose a new password. This link expires in 1 hour. If you didn't request this, you can ignore it.",
          actionUrl: url,
          actionLabel: "Reset password",
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      // Verification links are valid for 1 hour, then show the "expired" banner.
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user: u, url }) => {
        // After verifying, redirect to the app with a flag so we can show a
        // "email verified" confirmation instead of a bare homepage.
        let actionUrl = url;
        try {
          const parsed = new URL(url);
          parsed.searchParams.set("callbackURL", `${baseURL}/?verified=1`);
          actionUrl = parsed.toString();
        } catch {
          // keep the original url if parsing fails
        }
        await sendNotificationEmail(env, {
          to: u.email,
          subject: "Verify your Boatstead email",
          heading: "Confirm your email",
          body: "Tap the button below to verify your email and finish setting up your Boatstead account. If you didn't create an account, you can ignore this.",
          actionUrl,
          actionLabel: "Verify email",
        });
      },
    },
    user: {
      changeEmail: {
        enabled: true,
        // Better Auth sends this approval link to the user's CURRENT email when
        // that email is verified — so a hijacked session can't silently move the
        // account to an attacker's inbox. The user's id never changes; only the
        // email attribute does once they confirm.
        sendChangeEmailVerification: async ({
          user: u,
          newEmail,
          url,
        }: {
          user: { email: string };
          newEmail: string;
          url: string;
        }) => {
          await sendNotificationEmail(env, {
            to: u.email,
            subject: "Confirm your Boatstead email change",
            heading: "Approve your email change",
            body: `We received a request to change your Boatstead email to ${newEmail}. Tap below to confirm. If this wasn't you, ignore this message and your email stays the same.`,
            actionUrl: url,
            actionLabel: "Confirm email change",
          });
        },
      },
    },
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
        update: {
          // Keep the denormalized profile copy in sync after an email/name
          // change so profile pages don't drift from the auth record.
          after: async (u) => {
            try {
              await db
                .update(profiles)
                .set({ email: u.email, name: u.name })
                .where(eq(profiles.userId, u.id));
            } catch {
              // Profile row may not exist yet; ignore.
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof buildAuth>;
