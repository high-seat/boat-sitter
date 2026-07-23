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

/** Resend the email-verification link to an address. */
export function resendVerificationEmail(email: string) {
  return authClient.sendVerificationEmail({ email, callbackURL: window.location.origin });
}

/** Change password for a signed-in credential account (requires current password). */
export function changePassword(currentPassword: string, newPassword: string) {
  return authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
}

/** Change email for a signed-in user; sends a verification link to the new address. */
export function changeEmail(newEmail: string) {
  return authClient.changeEmail({ newEmail, callbackURL: `${window.location.origin}/?verified=1` });
}

/** Start "forgot password" / "set a password": emails a reset link to /reset-password. */
export function requestPasswordReset(email: string) {
  return authClient.requestPasswordReset({
    email,
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

/** Complete a password reset with the token from the emailed link. */
export function resetPassword(newPassword: string, token: string) {
  return authClient.resetPassword({ newPassword, token });
}

/** List the current user's linked accounts (providers) — e.g. ["credential"], ["google"]. */
export async function listLinkedProviders(): Promise<string[]> {
  const res = await authClient.listAccounts();
  const accounts = (res?.data ?? []) as Array<{ providerId?: string; provider?: string }>;
  return accounts.map((a) => a.providerId ?? a.provider ?? "").filter(Boolean);
}

export function signOut() {
  return authClient.signOut();
}
