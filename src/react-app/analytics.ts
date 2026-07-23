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

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const ENABLED = import.meta.env.PROD && Boolean(MEASUREMENT_ID);

let initialised = false;

function gtag(...args: unknown[]) {
  window.dataLayer.push(args);
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
  if (!ENABLED || !initialised) return;
  gtag("consent", "update", { analytics_storage: "granted" });
}

/** Call if the user declines / withdraws consent. */
export function denyConsent() {
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
