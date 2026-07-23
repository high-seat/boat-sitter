import { useState } from "react";
import { resetPassword } from "@/authClient";

/**
 * Standalone reset-password screen. Rendered (as a full-screen overlay) only
 * when the user lands on /reset-password from the emailed link, which carries
 * a `token` query param. Sets a new password, then sends them to sign in.
 *
 * Mounted at the app root so it doesn't depend on the main router.
 */
export function ResetPasswordPage() {
  const isResetRoute =
    typeof window !== "undefined" && window.location.pathname === "/reset-password";
  const token = isResetRoute ? new URLSearchParams(window.location.search).get("token") : null;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!isResetRoute) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is invalid or has expired. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setPending(true);
    try {
      const res = await resetPassword(password, token);
      if (res?.error) throw new Error(res.error.message ?? "Couldn't reset password.");
      setDone(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "This reset link is invalid or has expired. Request a new one.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-float">
        {done ? (
          <>
            <h1 className="font-display text-xl font-bold text-navy">Password updated</h1>
            <p className="mt-2 text-sm text-slate">You can now sign in with your new password.</p>
            <a
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-navy py-3 font-bold text-white"
              href="/"
            >
              Continue to sign in
            </a>
          </>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-navy">Set a new password</h1>
            <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
              <label className="block">
                <span className="form-label">New password</span>
                <input
                  autoComplete="new-password"
                  className="form-input"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>
              <label className="block">
                <span className="form-label">Confirm password</span>
                <input
                  autoComplete="new-password"
                  className="form-input"
                  onChange={(event) => setConfirm(event.target.value)}
                  type="password"
                  value={confirm}
                />
              </label>
              {error && (
                <p className="text-sm font-semibold text-coral" role="alert">
                  {error}
                </p>
              )}
              <button
                className="w-full rounded-xl bg-coral py-3 font-bold text-white disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? "Saving…" : "Set password"}
              </button>
              <a
                className="block text-center text-sm font-semibold text-teal hover:text-navy"
                href="/"
              >
                Back to Boatstead
              </a>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
