import { ShimmerBlock } from "@/components/ui/Shimmer";

export function OwnerBoatRowSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="pointer-events-none flex select-none flex-col gap-5 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center"
    >
      <div className="relative aspect-2/1 w-full overflow-hidden rounded-xl bg-seafoam sm:aspect-auto sm:size-32 sm:shrink-0">
        <div aria-hidden="true" className="shimmer absolute inset-0 rounded-xl" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerBlock className="h-3 w-36 max-w-[55%]" />
        <ShimmerBlock className="h-6 w-44 max-w-[70%]" />
        <ShimmerBlock className="h-4 w-52 max-w-[80%]" />
        <ShimmerBlock className="h-3 w-40 max-w-[60%]" />
        <ShimmerBlock className="h-3 w-36 max-w-[55%]" />
        <ShimmerBlock className="mt-2 h-3 w-28" />
      </div>
      <div className="flex gap-2">
        <ShimmerBlock className="h-10 w-24 rounded-xl" />
        <ShimmerBlock className="size-10 rounded-xl" />
      </div>
    </article>
  );
}

export function OwnerSitRowSkeleton({ showActions = true }: { showActions?: boolean }) {
  return (
    <article
      aria-hidden="true"
      className="pointer-events-none flex select-none flex-col gap-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center"
    >
      <ShimmerBlock className="size-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerBlock className="h-3 w-48 max-w-[70%]" />
        <ShimmerBlock className="h-6 w-40 max-w-[55%]" />
        <div className="mt-2 flex flex-wrap gap-2">
          <ShimmerBlock className="h-6 w-16 rounded-full" />
          <ShimmerBlock className="h-6 w-36 rounded-full" />
        </div>
        <ShimmerBlock className="mt-1 h-4 w-56 max-w-[85%]" />
      </div>
      {showActions ? (
        <div className="flex flex-wrap gap-2">
          <ShimmerBlock className="h-10 w-36 rounded-xl" />
          <ShimmerBlock className="h-10 w-28 rounded-xl" />
          <ShimmerBlock className="size-10 rounded-xl" />
        </div>
      ) : null}
    </article>
  );
}

export function OwnerBoatsLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mt-10 space-y-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <OwnerBoatRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function OwnerSitsLoadingSkeleton({
  phaseGroups = 2,
  sitsPerGroup = 2,
}: {
  phaseGroups?: number;
  sitsPerGroup?: number;
}) {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-10 space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ShimmerBlock className="h-4 w-56 max-w-[70%]" />
        <ShimmerBlock className="h-9 w-44 rounded-xl sm:ml-auto" />
      </div>
      {Array.from({ length: phaseGroups }, (_, groupIndex) => (
        <section className="space-y-4" key={groupIndex}>
          <div className="flex flex-wrap items-center gap-3">
            <ShimmerBlock className="h-6 w-44 max-w-[55%]" />
            <ShimmerBlock className="h-6 w-14 rounded-full" />
          </div>
          {Array.from({ length: sitsPerGroup }, (_, sitIndex) => (
            <OwnerSitRowSkeleton key={sitIndex} />
          ))}
        </section>
      ))}
    </div>
  );
}
