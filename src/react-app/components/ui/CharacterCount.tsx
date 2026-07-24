import { useTranslation } from "react-i18next";

/**
 * Subtle character counter that shows remaining characters toward max,
 * or characters still needed when below an optional minimum.
 */
export function CharacterCount({
  current,
  max,
  min,
  countTowardMin = current,
  className = "",
}: {
  current: number;
  max: number;
  min?: number;
  /** Length used for the minimum check (defaults to `current`). */
  countTowardMin?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const remaining = max - current;
  const percentage = current / max;
  const hasMin = min != null && min > 0;
  const belowMin = hasMin && countTowardMin < min;

  // Without a min, stay hidden until the user types. With a min, show from the
  // start so the requirement is visible before submit is enabled.
  if (!hasMin && current === 0) return null;

  let colorClass = "text-slate/50";
  let label: string;
  if (belowMin) {
    const needed = min - countTowardMin;
    if (countTowardMin > 0) {
      colorClass = "text-amber-600";
    }
    label = t("common.charsNeeded", { count: needed });
  } else {
    if (percentage >= 0.9) {
      colorClass = "text-coral";
    } else if (percentage >= 0.75) {
      colorClass = "text-amber-600";
    }
    label = t("common.charsRemaining", { count: remaining });
  }

  return (
    <span
      aria-live="polite"
      className={`text-xs font-medium tabular-nums ${colorClass} ${className}`}
      data-testid="character-count"
    >
      {label}
    </span>
  );
}
