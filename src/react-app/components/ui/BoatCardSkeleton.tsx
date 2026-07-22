import { ShimmerBlock } from "@/components/ui/Shimmer";

export function BoatCardSkeleton({ showBadge = false }: { showBadge?: boolean }) {
  return (
    <article aria-hidden="true" className="pointer-events-none select-none">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-seafoam">
        <div aria-hidden="true" className="shimmer absolute inset-0 rounded-2xl" />
        {showBadge ? (
          <div className="absolute top-3 left-3">
            <ShimmerBlock className="h-7 w-24 rounded-full bg-white/90" />
          </div>
        ) : null}
        <div className="absolute top-3 right-3">
          <ShimmerBlock className="size-9 rounded-full bg-white/90" />
        </div>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBlock className="h-3 w-[72%] max-w-44" />
            <ShimmerBlock className="h-6 w-[58%] max-w-36" />
          </div>
          <ShimmerBlock className="mt-1 h-4 w-10 shrink-0" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ShimmerBlock className="size-4 shrink-0 rounded-sm" />
          <ShimmerBlock className="h-4 w-[64%] max-w-48" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <ShimmerBlock className="h-4 w-32" />
          <ShimmerBlock className="h-4 w-16" />
        </div>
      </div>
    </article>
  );
}

export function BoatsPageLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="mt-9 flex flex-wrap items-center justify-between gap-3"
      >
        <ShimmerBlock className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <ShimmerBlock className="h-9 w-44 rounded-xl" />
          <ShimmerBlock className="h-9 w-36 rounded-xl" />
        </div>
      </div>
      <div
        aria-busy="true"
        aria-live="polite"
        className="mt-6 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: count }, (_, index) => (
          <BoatCardSkeleton key={index} showBadge={index % 3 === 0} />
        ))}
      </div>
    </>
  );
}
