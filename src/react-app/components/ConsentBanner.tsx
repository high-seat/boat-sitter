import { useState } from "react";
import { denyConsent, grantConsent, hasConsentChoice, isAnalyticsActive } from "@/analytics";

/**
 * Cookie-consent banner for analytics (UK GDPR/PECR).
 *
 * Analytics is default-denied until the visitor chooses here. Their choice is
 * remembered (localStorage, handled in analytics.ts), so the banner only shows
 * once and returning visitors aren't re-prompted. Only renders when GA is
 * actually active (production build) and no choice has been made yet.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(() => isAnalyticsActive() && !hasConsentChoice());

  if (!visible) return null;

  function accept() {
    grantConsent();
    setVisible(false);
  }

  function decline() {
    denyConsent();
    setVisible(false);
  }

  return (
    <div
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[150] flex justify-center px-4 pb-4"
      role="dialog"
    >
      <div className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-float sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <p className="min-w-0 flex-1 text-sm leading-6 text-slate">
          We use cookies to measure site traffic and improve Boatstead. Analytics stays off until
          you accept.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-bold text-navy hover:border-navy"
            onClick={decline}
            type="button"
          >
            Decline
          </button>
          <button
            className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-navy/90"
            onClick={accept}
            type="button"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
