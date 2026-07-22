import { ShimmerBlock } from "@/components/ui/Shimmer";

function BriefRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <ShimmerBlock className="size-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerBlock className="h-2.5 w-20" />
        <ShimmerBlock className="h-4 w-28" />
      </div>
    </div>
  );
}

function ListItemSkeleton({ width = "w-[88%]" }: { width?: string }) {
  return (
    <div className="flex items-start gap-3">
      <ShimmerBlock className="mt-0.5 size-[18px] shrink-0 rounded-sm" />
      <ShimmerBlock className={`h-4 ${width} max-w-full`} />
    </div>
  );
}

export function SitDetailSkeleton() {
  return (
    <main aria-busy="true" aria-live="polite" className="pb-20">
      <div className="mx-auto max-w-7xl px-5 pt-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <ShimmerBlock className="size-[17px] rounded-sm" />
          <ShimmerBlock className="h-4 w-16" />
        </div>

        <div className="relative">
          <div className="grid h-136 gap-2 overflow-hidden rounded-3xl md:grid-cols-[1.5fr_0.8fr]">
            <ShimmerBlock className="h-full min-h-0 rounded-none" />
            <div className="hidden min-h-0 grid-rows-2 gap-2 md:grid">
              <ShimmerBlock className="h-full min-h-0 rounded-none" />
              <ShimmerBlock className="h-full min-h-0 rounded-none" />
            </div>
          </div>
          <div className="absolute right-4 bottom-4">
            <ShimmerBlock className="h-9 w-28 rounded-full bg-white/90" />
          </div>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="flex items-start justify-between gap-5 border-b border-line pb-8">
              <div className="min-w-0 flex-1 space-y-3">
                <ShimmerBlock className="h-3 w-40" />
                <ShimmerBlock className="h-10 w-[72%] max-w-md" />
                <div className="flex items-center gap-2">
                  <ShimmerBlock className="size-[17px] rounded-sm" />
                  <ShimmerBlock className="h-4 w-48" />
                </div>
              </div>
              <ShimmerBlock className="size-11 shrink-0 rounded-full" />
            </div>

            <section className="border-b border-line py-8">
              <div className="flex items-center gap-4">
                <ShimmerBlock className="size-14 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <ShimmerBlock className="h-5 w-52" />
                  <ShimmerBlock className="h-4 w-36" />
                  <ShimmerBlock className="h-3.5 w-44" />
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-line bg-white p-6">
                <div className="flex items-start gap-3">
                  <ShimmerBlock className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <ShimmerBlock className="h-5 w-40" />
                    <ShimmerBlock className="h-4 w-full max-w-sm" />
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div className="flex items-center gap-3" key={index}>
                      <ShimmerBlock className="size-6 shrink-0 rounded-full" />
                      <ShimmerBlock className="h-4 w-36" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="border-b border-line py-8">
              <ShimmerBlock className="h-6 w-24" />
              <div className="mt-4 flex items-center gap-2">
                <ShimmerBlock className="size-4 rounded-sm" />
                <ShimmerBlock className="h-4 w-56" />
              </div>
              <div className="mt-5 space-y-3">
                <ShimmerBlock className="h-4 w-full" />
                <ShimmerBlock className="h-4 w-[96%]" />
                <ShimmerBlock className="h-4 w-[88%]" />
                <ShimmerBlock className="h-4 w-[72%]" />
              </div>
              <ShimmerBlock className="mt-5 h-12 w-56 rounded-xl" />
            </section>

            <section className="border-b border-line py-8">
              <ShimmerBlock className="h-6 w-20" />
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <BriefRowSkeleton key={index} />
                ))}
              </div>
            </section>

            <section className="border-b border-line py-8">
              <ShimmerBlock className="h-6 w-36" />
              <ul className="mt-5 space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <li key={index}>
                    <ListItemSkeleton width={index % 2 === 0 ? "w-[92%]" : "w-[78%]"} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="py-8">
              <ShimmerBlock className="h-6 w-28" />
              <div className="mt-5 flex flex-wrap gap-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <ShimmerBlock className="h-9 w-24 rounded-full" key={index} />
                ))}
              </div>
              <ShimmerBlock className="mt-9 h-6 w-28" />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div className="flex items-center gap-2" key={index}>
                    <ShimmerBlock className="size-4 shrink-0 rounded-sm" />
                    <ShimmerBlock className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside>
            <div className="sticky top-24 rounded-2xl border border-line bg-white p-6 shadow-card">
              <ShimmerBlock className="h-3 w-28" />
              <div className="mt-2 flex flex-wrap gap-2">
                <ShimmerBlock className="h-7 w-32 rounded-full" />
              </div>
              <ShimmerBlock className="mt-3 h-7 w-44" />
              <ShimmerBlock className="mt-2 h-4 w-32" />
              <div className="my-5 border-t border-line" />
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div className="flex items-center gap-3" key={index}>
                    <ShimmerBlock className="size-[18px] shrink-0 rounded-sm" />
                    <ShimmerBlock className="h-4 w-40" />
                  </div>
                ))}
              </div>
              <ShimmerBlock className="mt-6 h-12 w-full rounded-xl" />
              <ShimmerBlock className="mx-auto mt-3 h-3 w-24" />
            </div>
          </aside>
        </div>

        <section className="mt-14">
          <ShimmerBlock className="h-3 w-24" />
          <ShimmerBlock className="mt-3 h-8 w-48" />
          <ShimmerBlock className="mt-3 h-4 w-full max-w-xl" />
          <ShimmerBlock className="mt-6 h-72 w-full rounded-2xl" />
        </section>
      </div>
    </main>
  );
}
