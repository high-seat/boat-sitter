import type { ReactNode } from "react";

export function IconTooltip({
  children,
  label,
  hidden = false,
}: {
  children: ReactNode;
  label: string;
  hidden?: boolean;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      {!hidden && (
        <span
          className="pointer-events-none absolute top-[calc(100%+0.4rem)] left-1/2 z-70 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          role="tooltip"
        >
          {label}
        </span>
      )}
    </span>
  );
}
