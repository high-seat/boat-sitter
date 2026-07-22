import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client. Same-origin in production (SPA + API served by
 * one Worker), so the default baseURL is fine; we set it explicitly for clarity
 * and for cross-port local dev.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

export function signInWithGoogle() {
  return authClient.signIn.social({
    provider: "google",
    callbackURL: window.location.origin,
  });
}

export function signOut() {
  return authClient.signOut();
}
