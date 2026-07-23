import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export function IconTooltip({
  children,
  label,
  hidden = false,
  wrap = false,
  side = "bottom",
  className = "",
}: {
  children: ReactNode;
  label: string;
  hidden?: boolean;
  wrap?: boolean;
  side?: "top" | "bottom";
  className?: string;
}) {
  const positionClass =
    side === "top" ? "bottom-[calc(100%+0.4rem)] top-auto" : "top-[calc(100%+0.4rem)]";

  // Prefer the custom tooltip over the native browser title bubble.
  const content = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child as ReactElement<{ title?: string }>, { title: undefined });
  });

  return (
    <span className={`group relative inline-flex ${className}`.trim()}>
      {content}
      {!hidden && (
        <span
          className={`pointer-events-none absolute left-1/2 z-70 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${positionClass} ${
            wrap ? "whitespace-normal text-center" : "whitespace-nowrap"
          }`}
          role="tooltip"
        >
          {label}
        </span>
      )}
    </span>
  );
}
