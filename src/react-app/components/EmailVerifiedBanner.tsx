import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { resendVerificationEmail } from "@/authClient";
import { hydrateSession } from "@/session";

/**
 * Handles the return from the email-verification link:
 *   /?verified=1        → success confirmation (+ re-hydrate session)
 *   /?...&error=...      → the link was invalid or expired; offer to resend
 * In both cases the query flags are stripped so a refresh won't re-trigger.
 */
export function EmailVerifiedBanner() {
  const [mode, setMode] = useState<"success" | "error" | null>(null);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasError = Boolean(params.get("error"));
    const verified = params.get("verified") === "1";
    if (!hasError && !verified) return;

    if (hasError) {
      setMode("error");
    } else {
      setMode("success");
      void hydrateSession();
    }

    // Strip verification flags from the URL.
    params.delete("verified");
    params.delete("error");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : "") + window.location.hash,
    );

    if (!hasError) {
      const timer = window.setTimeout(() => setMode(null), 6000);
      return () => window.clearTimeout(timer);
    }
  }, []);

  async function resend(e: React.FormEvent) {
    e.preventDefault();
    setResendError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setResendError("Enter a valid email.");
      return;
    }
    try {
      await resendVerificationEmail(email);
      setResent(true);
    } catch {
      setResendError("Couldn't send. Try again.");
    }
  }

  if (!mode) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4">
      {mode === "success" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-teal/30 bg-white px-4 py-3 shadow-float">
          <CheckCircle2 aria-hidden="true" className="shrink-0 text-teal" size={20} />
          <p className="text-sm font-semibold text-navy">
            Email verified — you&rsquo;re all set. Welcome aboard!
          </p>
          <button
            aria-label="Dismiss"
            className="ml-1 rounded-full p-1 text-slate hover:bg-cream hover:text-navy"
            onClick={() => setMode(null)}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-white px-4 py-3 shadow-float">
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-amber-500"
              size={20}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-navy">
                That verification link is invalid or has expired.
              </p>
              {resent ? (
                <p className="mt-1 text-sm text-slate">
                  Done — we&rsquo;ve sent a fresh link. Check your inbox.
                </p>
              ) : (
                <form className="mt-2 flex gap-2" onSubmit={resend}>
                  <input
                    aria-label="Email"
                    className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                  <button
                    className="shrink-0 rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white"
                    type="submit"
                  >
                    Resend link
                  </button>
                </form>
              )}
              {resendError && (
                <p className="mt-1 text-xs font-semibold text-coral">{resendError}</p>
              )}
            </div>
            <button
              aria-label="Dismiss"
              className="rounded-full p-1 text-slate hover:bg-cream hover:text-navy"
              onClick={() => setMode(null)}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
