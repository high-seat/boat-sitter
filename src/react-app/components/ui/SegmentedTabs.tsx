import type { ButtonHTMLAttributes, ReactNode } from "react";

const toneClasses = {
  seafoam: "bg-seafoam",
  cream: "bg-cream",
} as const;

/** Shared active/inactive styles for segmented tab controls and NavLinks. */
export function segmentedTabClassName(active: boolean, className = "") {
  return [
    "rounded-lg px-4 py-2.5 text-sm font-bold whitespace-nowrap transition",
    active ? "bg-white text-navy shadow-sm" : "text-slate hover:text-navy",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Horizontal pill tab strip. Default hugs content (`w-fit`) so the green track
 * does not stretch full width. Use `fullWidthOnMobile` for two-tab bars that
 * should share the row on small screens (owner dashboard, messages).
 */
export function SegmentedTabs({
  children,
  className = "",
  tone = "seafoam",
  fullWidthOnMobile = false,
  "aria-label": ariaLabel,
  testId,
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof toneClasses;
  fullWidthOnMobile?: boolean;
  "aria-label"?: string;
  testId?: string;
}) {
  const widthClass = fullWidthOnMobile ? "flex w-full sm:w-fit" : "inline-flex w-fit max-w-full";

  return (
    <div
      aria-label={ariaLabel}
      className={`${widthClass} gap-1 rounded-xl p-1 ${toneClasses[tone]} ${className}`.trim()}
      data-testid={testId}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function SegmentedTab({
  active,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      aria-selected={active}
      className={segmentedTabClassName(active, className)}
      role="tab"
      type={type}
      {...props}
    />
  );
}
