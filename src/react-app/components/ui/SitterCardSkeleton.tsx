import { ShimmerBlock } from "@/components/ui/Shimmer";

export function SitterCardSkeleton() {
  return (
    <article aria-hidden="true" className="pointer-events-none select-none">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-seafoam">
        <div aria-hidden="true" className="shimmer absolute inset-0 rounded-2xl" />
        <div className="absolute top-3 left-3">
          <ShimmerBlock className="h-7 w-28 rounded-full bg-white/90" />
        </div>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBlock className="h-6 w-[58%] max-w-36" />
            <ShimmerBlock className="h-4 w-[72%] max-w-44" />
          </div>
          <ShimmerBlock className="mt-1 h-4 w-10 shrink-0" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ShimmerBlock className="h-6 w-16 rounded-full" />
          <ShimmerBlock className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <ShimmerBlock className="h-4 w-36" />
          <ShimmerBlock className="h-4 w-20" />
        </div>
      </div>
    </article>
  );
}

export function SittersPageLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      <div aria-hidden="true" className="mt-9 flex flex-wrap items-center justify-between gap-3">
        <ShimmerBlock className="h-4 w-32" />
        <ShimmerBlock className="h-9 w-40 rounded-xl" />
      </div>
      <div
        aria-busy="true"
        aria-live="polite"
        className="mt-6 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3"
        data-testid="sitters-loading-skeleton"
      >
        {Array.from({ length: count }, (_, index) => (
          <SitterCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}
