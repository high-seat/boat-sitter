import { ShimmerBlock } from "@/components/ui/Shimmer";

function ApplicantListRowSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 rounded-xl p-3">
      <ShimmerBlock className="size-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerBlock className="h-4 w-28 max-w-[70%]" />
        <ShimmerBlock className="h-3 w-36 max-w-[85%]" />
        <ShimmerBlock className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function ApplicationReviewSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <ShimmerBlock className="h-10 w-72 max-w-full" />
          <ShimmerBlock className="h-4 w-56 max-w-[80%]" />
          <ShimmerBlock className="h-7 w-36 rounded-full" />
        </div>
        <ShimmerBlock className="h-11 w-40 rounded-full" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <ShimmerBlock className="h-8 w-28 rounded-full" />
        <ShimmerBlock className="h-2 w-8" />
        <ShimmerBlock className="h-8 w-32 rounded-full" />
        <ShimmerBlock className="h-2 w-8" />
        <ShimmerBlock className="h-8 w-28 rounded-full" />
        <ShimmerBlock className="h-2 w-8" />
        <ShimmerBlock className="h-8 w-32 rounded-full" />
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="flex gap-3">
          <ShimmerBlock className="mt-0.5 size-5 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBlock className="h-4 w-56 max-w-[75%]" />
            <ShimmerBlock className="h-3 w-full max-w-xl" />
            <ShimmerBlock className="h-3 w-[88%] max-w-lg" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside
          aria-hidden="true"
          className="pointer-events-none h-fit min-w-0 select-none rounded-2xl border border-line bg-white p-3 shadow-card"
        >
          <div className="space-y-2 border-b border-line pb-3">
            <ShimmerBlock className="h-11 w-full rounded-xl" />
            <ShimmerBlock className="h-11 w-full rounded-xl" />
            <ShimmerBlock className="h-11 w-full rounded-xl" />
            <ShimmerBlock className="mt-1 h-3 w-24" />
          </div>
          <div className="mt-2 space-y-1">
            <ApplicantListRowSkeleton />
            <ApplicantListRowSkeleton />
            <ApplicantListRowSkeleton />
            <ApplicantListRowSkeleton />
          </div>
        </aside>

        <div aria-hidden="true" className="pointer-events-none min-w-0 select-none space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <ShimmerBlock className="size-20 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ShimmerBlock className="h-7 w-40 max-w-[60%]" />
                  <ShimmerBlock className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <ShimmerBlock className="h-4 w-32" />
                  <ShimmerBlock className="h-4 w-24" />
                  <ShimmerBlock className="h-4 w-20" />
                </div>
                <ShimmerBlock className="h-4 w-[92%] max-w-lg" />
                <ShimmerBlock className="h-4 w-[78%] max-w-md" />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
              <ShimmerBlock className="h-11 w-28 rounded-xl" />
              <ShimmerBlock className="h-11 w-32 rounded-xl" />
              <ShimmerBlock className="h-11 w-36 rounded-xl" />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <ShimmerBlock className="h-5 w-36" />
            <div className="mt-4 space-y-3">
              <div className="flex justify-start">
                <ShimmerBlock className="h-16 w-[72%] max-w-md rounded-2xl" />
              </div>
              <div className="flex justify-end">
                <ShimmerBlock className="h-12 w-[58%] max-w-sm rounded-2xl" />
              </div>
              <div className="flex justify-start">
                <ShimmerBlock className="h-20 w-[66%] max-w-md rounded-2xl" />
              </div>
            </div>
            <div className="mt-6 flex gap-2 border-t border-line pt-4">
              <ShimmerBlock className="h-11 flex-1 rounded-xl" />
              <ShimmerBlock className="h-11 w-11 rounded-xl" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
