import { ShimmerBlock } from "@/components/ui/Shimmer";

function ChipSkeleton({ width }: { width: string }) {
  return <ShimmerBlock className={`h-9 ${width} rounded-full`} />;
}

function ReviewCardSkeleton() {
  return (
    <article aria-hidden="true" className="rounded-2xl border border-line bg-cream/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerBlock className="h-4 w-28" />
          <ShimmerBlock className="h-3 w-44 max-w-[80%]" />
        </div>
        <div className="flex gap-1">
          <ShimmerBlock className="size-3.5 rounded-sm" />
          <ShimmerBlock className="size-3.5 rounded-sm" />
          <ShimmerBlock className="size-3.5 rounded-sm" />
          <ShimmerBlock className="size-3.5 rounded-sm" />
          <ShimmerBlock className="size-3.5 rounded-sm" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <ShimmerBlock className="h-3.5 w-full" />
        <ShimmerBlock className="h-3.5 w-[92%]" />
        <ShimmerBlock className="h-3.5 w-[78%]" />
      </div>
    </article>
  );
}

export function SitterReviewsSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="rounded-2xl border border-line bg-white p-7"
    >
      <div aria-hidden="true" className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <ShimmerBlock className="h-3 w-28" />
          <ShimmerBlock className="h-7 w-40 max-w-[70%]" />
          <ShimmerBlock className="h-4 w-52 max-w-[85%]" />
        </div>
        <div className="flex items-center gap-2">
          <ShimmerBlock className="h-4 w-20" />
          <ShimmerBlock className="h-4 w-8" />
        </div>
      </div>
      <div aria-hidden="true" className="mt-6 space-y-4">
        <ReviewCardSkeleton />
        <ReviewCardSkeleton />
      </div>
    </section>
  );
}

export function MemberProfileSkeleton() {
  return (
    <main aria-busy="true" aria-live="polite" className="px-5 py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div
          aria-hidden="true"
          className="overflow-hidden rounded-3xl border border-line bg-white shadow-card"
        >
          <div className="relative isolate">
            <ShimmerBlock className="h-40 rounded-none" />
            <div className="relative px-6 pb-8 sm:px-10">
              <div className="relative -mt-16 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
                <ShimmerBlock className="relative z-20 size-32 shrink-0 rounded-full border-4 border-white" />
                <div className="relative z-10 flex w-full flex-wrap gap-3 sm:ml-auto sm:w-auto sm:max-w-[calc(100%-9.5rem)] sm:justify-end sm:pb-1">
                  <ChipSkeleton width="w-28" />
                  <ChipSkeleton width="w-32" />
                  <ChipSkeleton width="w-36" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <ShimmerBlock className="h-3 w-20" />
                <ShimmerBlock className="h-10 w-[55%] max-w-sm" />
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <ShimmerBlock className="size-4 rounded-sm" />
                    <ShimmerBlock className="h-4 w-36" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShimmerBlock className="size-4 rounded-sm" />
                    <ShimmerBlock className="h-4 w-24" />
                  </div>
                  <ShimmerBlock className="h-4 w-28" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div aria-hidden="true" className="space-y-6">
            <div className="rounded-2xl border border-line bg-white p-7">
              <ShimmerBlock className="h-6 w-36 max-w-[50%]" />
              <div className="mt-4 space-y-2.5">
                <ShimmerBlock className="h-4 w-full" />
                <ShimmerBlock className="h-4 w-[94%]" />
                <ShimmerBlock className="h-4 w-[88%]" />
                <ShimmerBlock className="h-4 w-[72%]" />
              </div>
              <ShimmerBlock className="mt-8 h-6 w-48 max-w-[60%]" />
              <div className="mt-4 flex flex-wrap gap-2">
                <ChipSkeleton width="w-28" />
                <ChipSkeleton width="w-32" />
                <ChipSkeleton width="w-24" />
                <ChipSkeleton width="w-36" />
                <ChipSkeleton width="w-20" />
              </div>
              <ShimmerBlock className="mt-8 h-6 w-28 max-w-[40%]" />
              <div className="mt-4 flex flex-wrap gap-2">
                <ChipSkeleton width="w-24" />
                <ChipSkeleton width="w-20" />
                <ChipSkeleton width="w-28" />
              </div>
            </div>
            <SitterReviewsSkeleton />
          </div>

          <aside aria-hidden="true" className="space-y-4">
            <div className="grid gap-4 rounded-2xl border border-line bg-white p-6">
              <div className="space-y-2">
                <ShimmerBlock className="h-9 w-16" />
                <ShimmerBlock className="h-4 w-32 max-w-full" />
              </div>
              <div className="space-y-2 border-t border-line pt-4">
                <ShimmerBlock className="h-9 w-14" />
                <ShimmerBlock className="h-4 w-36 max-w-full" />
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-4">
              <ShimmerBlock className="aspect-2/1 w-full rounded-xl" />
              <ShimmerBlock className="mt-3 h-3 w-24" />
              <ShimmerBlock className="mt-2 h-6 w-40 max-w-[80%]" />
            </div>
            <div className="rounded-2xl border border-line bg-white p-6">
              <div className="flex items-center gap-2">
                <ShimmerBlock className="size-5 rounded-sm" />
                <ShimmerBlock className="h-5 w-36 max-w-[70%]" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <ShimmerBlock className="size-5 shrink-0 rounded-full" />
                  <ShimmerBlock className="h-4 w-[70%]" />
                </div>
                <div className="flex items-center gap-3">
                  <ShimmerBlock className="size-5 shrink-0 rounded-full" />
                  <ShimmerBlock className="h-4 w-[62%]" />
                </div>
                <div className="flex items-center gap-3">
                  <ShimmerBlock className="size-5 shrink-0 rounded-full" />
                  <ShimmerBlock className="h-4 w-[55%]" />
                </div>
              </div>
              <ShimmerBlock className="mt-5 h-11 w-full rounded-full" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
