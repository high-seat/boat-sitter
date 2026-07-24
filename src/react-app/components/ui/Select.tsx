import type { SelectHTMLAttributes } from "react";

const variantClasses = {
  filter:
    "rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-teal",
  sort: "rounded-xl border border-line bg-white px-3 py-3 text-sm font-semibold text-navy outline-none focus:border-teal",
  form: "form-input",
  inline:
    "select-variant-inline w-full border-0 bg-transparent p-0 text-sm font-medium text-navy shadow-none outline-none ring-0",
} as const;

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: keyof typeof variantClasses;
};

/**
 * Shared native `<select>` with one caret style site-wide.
 * Prefer this over raw `<select>` elements.
 */
export function Select({ variant = "filter", className = "", ...props }: SelectProps) {
  return (
    <select
      className={`select-control ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
