import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { hydrateSession } from "@/session";
import "@/i18n";
import "@/index.css";

// Pull the real Better Auth session into the store on load, so a Google login
// is reflected in the UI. Fire-and-forget; the store update re-renders.
void hydrateSession();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
