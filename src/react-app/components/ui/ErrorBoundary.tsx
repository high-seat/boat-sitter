import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-coral/10 text-coral">
        <TriangleAlert size={28} />
      </span>
      <h1 className="mt-6 font-display text-3xl font-extrabold text-navy">
        {t("errorBoundary.title")}
      </h1>
      <p className="mt-3 leading-7 text-slate">{t("errorBoundary.text")}</p>
      {import.meta.env.DEV && (
        <pre className="mt-6 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-cream p-4 text-left text-xs leading-5 whitespace-pre-wrap text-navy">
          {error.stack || error.message || String(error)}
        </pre>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          className="rounded-full bg-coral px-6 py-3 font-bold text-white hover:bg-coral-dark"
          onClick={onReset}
          type="button"
        >
          {t("errorBoundary.tryAgain")}
        </button>
        <button
          className="rounded-full border border-line px-6 py-3 font-bold text-navy hover:border-teal"
          onClick={() => {
            window.location.assign("/");
          }}
          type="button"
        >
          {t("errorBoundary.goHome")}
        </button>
      </div>
    </main>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Boatstead error boundary caught an exception", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => {
            this.setState({ error: null });
          }}
        />
      );
    }
    return this.props.children;
  }
}
