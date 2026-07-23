import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Google Analytics 4 for the SPA.
 *
 * - Loads only in a production build (`import.meta.env.PROD`) and only when a
 *   measurement id is configured, so localhost/dev never pollutes reports.
 * - Uses Consent Mode v2 with everything **denied by default** — GA runs in
 *   cookieless mode and collects nothing identifiable until `grantConsent()`
 *   is called (wire that to a consent banner later). This is the UK GDPR/PECR
 *   launch-safe baseline.
 * - Page views are sent manually on route change (react-router is client-side,
 *   so the default single page_view would miss every navigation).
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// A GA4 Measurement ID is not secret (it ships in the client bundle regardless),
// so we commit it as the default. An env var can still override it (e.g. for a
// separate staging property). Committing it means every build — any teammate's,
// or CI — includes analytics without needing a local .env file.
const MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) ?? "G-QX5XWC25XK";
const ENABLED = import.meta.env.PROD && Boolean(MEASUREMENT_ID);

const CONSENT_KEY = "boatstead-analytics-consent";

let initialised = false;

function gtag(...args: unknown[]) {
  window.dataLayer.push(args);
}

/** The stored consent choice, if the visitor has made one. */
function readConsent(): "granted" | "denied" | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function saveConsent(choice: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Private mode / storage disabled — consent just won't persist.
  }
}

/** True when GA is actually running (prod build + id) — gates the banner. */
export function isAnalyticsActive() {
  return ENABLED;
}

/** Whether the visitor has already accepted or declined. */
export function hasConsentChoice() {
  return readConsent() !== null;
}

/** Load gtag.js once and set Consent Mode defaults (all denied). */
export function initAnalytics() {
  if (!ENABLED || initialised || typeof window === "undefined") return;
  initialised = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;

  // Consent Mode v2 — deny everything until the user opts in.
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  // We send page_view ourselves on each route change.
  gtag("config", MEASUREMENT_ID, { send_page_view: false });

  // Returning visitor who already accepted — restore their consent so we don't
  // re-prompt and analytics resumes immediately.
  if (readConsent() === "granted") {
    gtag("consent", "update", { analytics_storage: "granted" });
  }
}

/** Record a page view. No-op unless analytics is enabled + initialised. */
export function trackPageView(path: string) {
  if (!ENABLED || !initialised) return;
  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Call from a consent banner once the user accepts analytics cookies. */
export function grantConsent() {
  saveConsent("granted");
  if (!ENABLED || !initialised) return;
  gtag("consent", "update", { analytics_storage: "granted" });
  // Capture the current page now, since collection was suppressed until now.
  trackPageView(window.location.pathname + window.location.search);
}

/** Call if the user declines / withdraws consent. */
export function denyConsent() {
  saveConsent("denied");
  if (!ENABLED || !initialised) return;
  gtag("consent", "update", { analytics_storage: "denied" });
}

/**
 * Mount once inside the Router. Fires a page_view on every route change
 * (including the first). Renders nothing.
 */
export function AnalyticsListener() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}
