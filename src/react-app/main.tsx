import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import { AnalyticsListener, initAnalytics } from "@/analytics";
import { EmailVerifiedBanner } from "@/components/EmailVerifiedBanner";
import { ResetPasswordPage } from "@/components/ResetPasswordPage";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { hydrateSession } from "@/session";
import "@/i18n";
import "@/index.css";

// Pull the real Better Auth session into the store on load, so a Google login
// is reflected in the UI. Fire-and-forget; the store update re-renders.
void hydrateSession();

// Google Analytics (prod builds only, cookieless until consent — see analytics.ts).
initAnalytics();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

// Near-real-time chat + notifications via interval polling. Only refetches while
// the query is mounted (conversation open / bell in view) and the tab is focused
// (refetchIntervalInBackground defaults to false), so it's cheap.
queryClient.setQueryDefaults(["applications"], {
  refetchInterval: 5_000,
  staleTime: 0,
});
queryClient.setQueryDefaults(["notifications"], {
  refetchInterval: 15_000,
  staleTime: 0,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AnalyticsListener />
          <ResetPasswordPage />
          <EmailVerifiedBanner />
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
