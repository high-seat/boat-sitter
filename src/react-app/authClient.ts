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

/** Email + password sign-in — creates a real Better Auth session cookie. */
export function signInWithEmail(email: string, password: string) {
  return authClient.signIn.email({ email, password });
}

/** Email + password sign-up — creates the account and a session cookie. */
export function signUpWithEmail(input: { email: string; password: string; name: string }) {
  return authClient.signUp.email({
    email: input.email,
    password: input.password,
    name: input.name,
  });
}

export function signOut() {
  return authClient.signOut();
}
