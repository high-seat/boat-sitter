import { useTranslation } from "react-i18next";

/**
 * Subtle character counter that shows remaining characters.
 * Displays in the bottom-right corner with varying opacity based on remaining count.
 * Shows more prominently when approaching the limit.
 */
export function CharacterCount({
  current,
  max,
  className = "",
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const remaining = max - current;
  const percentage = current / max;

  // Don't show until user has typed something
  if (current === 0) return null;

  // Determine styling based on remaining count
  let colorClass = "text-slate/50";
  if (percentage >= 0.9) {
    colorClass = "text-coral";
  } else if (percentage >= 0.75) {
    colorClass = "text-amber-600";
  }

  return (
    <span
      aria-live="polite"
      className={`text-xs font-medium tabular-nums ${colorClass} ${className}`}
      data-testid="character-count"
    >
      {t("common.charsRemaining", { count: remaining })}
    </span>
  );
}
