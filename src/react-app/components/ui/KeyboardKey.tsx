import type { ReactNode } from "react";

export function KeyboardKey({ children }: { children?: ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-flex min-w-[1.35rem] items-center justify-center rounded-[0.3rem] border border-line border-b-[2.5px] bg-gradient-to-b from-white to-cream px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold leading-none text-navy">
      {children}
    </kbd>
  );
}
