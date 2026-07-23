/** Coral count pill used on nav icons (notifications, messages). */
export function NavCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute top-1 right-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-cream"
    >
      {count}
    </span>
  );
}
