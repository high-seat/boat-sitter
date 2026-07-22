import { ShimmerBlock } from "@/components/ui/Shimmer";

function ConversationRowSkeleton() {
  return (
    <div aria-hidden="true" className="rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <ShimmerBlock className="h-4 w-28 max-w-[55%]" />
        <ShimmerBlock className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <ShimmerBlock className="h-5 w-14 rounded-full" />
        <ShimmerBlock className="h-3 w-24 max-w-[40%]" />
      </div>
      <ShimmerBlock className="mt-2 h-3 w-[85%]" />
    </div>
  );
}

export function MessagesPageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]"
    >
      <aside
        aria-hidden="true"
        className="pointer-events-none h-fit min-w-0 select-none rounded-2xl border border-line bg-white p-2 shadow-card"
      >
        <ConversationRowSkeleton />
        <ConversationRowSkeleton />
        <ConversationRowSkeleton />
        <ConversationRowSkeleton />
      </aside>
      <div aria-hidden="true" className="pointer-events-none min-w-0 select-none">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <ShimmerBlock className="size-12 shrink-0 rounded-full" />
            <div className="min-w-0 space-y-2 pt-1">
              <ShimmerBlock className="h-6 w-40 max-w-[70%]" />
              <ShimmerBlock className="h-3 w-48 max-w-[80%]" />
              <ShimmerBlock className="h-3 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <ShimmerBlock className="h-7 w-20 rounded-full" />
            <ShimmerBlock className="size-10 rounded-xl" />
            <ShimmerBlock className="size-10 rounded-xl" />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <div className="space-y-4">
            <div className="flex justify-start">
              <ShimmerBlock className="h-16 w-[70%] max-w-md rounded-2xl" />
            </div>
            <div className="flex justify-end">
              <ShimmerBlock className="h-12 w-[55%] max-w-sm rounded-2xl" />
            </div>
            <div className="flex justify-start">
              <ShimmerBlock className="h-20 w-[65%] max-w-md rounded-2xl" />
            </div>
          </div>
          <div className="mt-6 flex gap-2 border-t border-line pt-4">
            <ShimmerBlock className="h-11 flex-1 rounded-xl" />
            <ShimmerBlock className="h-11 w-11 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
