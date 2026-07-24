import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const DEFAULT_OVERLAY_DELAY_MS = 2000;

/** Becomes true after `delayMs` while `active` stays true; resets when inactive. */
export function useDelayedFlag(active: boolean, delayMs = DEFAULT_OVERLAY_DELAY_MS): boolean {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!active) {
      setDelayed(false);
      return;
    }
    const id = window.setTimeout(() => setDelayed(true), delayMs);
    return () => window.clearTimeout(id);
  }, [active, delayMs]);

  return delayed;
}

type RefetchingResultsProps = {
  /** True while showing previous results and a new server list is in flight. */
  pending: boolean;
  /** Context-specific status copy, e.g. "Sorting sits…". */
  message: string;
  /** Delay before the status overlay appears. Default 2s. */
  delayMs?: number;
  children: ReactNode;
  className?: string;
  testId?: string;
};

/**
 * Dims current list results while a server sort/filter refetch runs.
 * After a short delay, shows a status overlay so longer waits feel intentional.
 */
export function RefetchingResults({
  pending,
  message,
  delayMs = DEFAULT_OVERLAY_DELAY_MS,
  children,
  className = "",
  testId,
}: RefetchingResultsProps) {
  const showOverlay = useDelayedFlag(pending, delayMs);

  const pendingClass = pending
    ? "opacity-40 transition-opacity duration-200"
    : "transition-opacity duration-200";

  return (
    <div
      aria-busy={pending || undefined}
      className="relative"
      data-pending={pending ? "true" : undefined}
      data-testid={testId}
    >
      <div className={`${pendingClass} ${className}`.trim()}>{children}</div>
      {showOverlay ? (
        <div
          className="absolute inset-0 z-10 flex items-start justify-center bg-cream/30 pt-10 sm:pt-16"
          data-testid={testId ? `${testId}-overlay` : "refetching-results-overlay"}
          role="status"
        >
          <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white/95 px-5 py-3.5 text-sm font-bold text-navy shadow-card backdrop-blur-sm">
            <Loader2 aria-hidden="true" className="shrink-0 animate-spin text-teal" size={18} />
            <span>{message}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
