import { ShimmerBlock } from "@/components/ui/Shimmer";

function UserRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4"
    >
      <ShimmerBlock className="size-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <ShimmerBlock className="h-4 w-40 max-w-[55%]" />
        <ShimmerBlock className="h-3 w-52 max-w-[70%]" />
      </div>
      <ShimmerBlock className="hidden h-7 w-16 rounded-full sm:block" />
      <ShimmerBlock className="hidden h-7 w-16 rounded-full sm:block" />
      <div className="flex gap-2">
        <ShimmerBlock className="size-10 rounded-xl" />
        <ShimmerBlock className="size-10 rounded-xl" />
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-8 space-y-4">
      <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-3">
        <ShimmerBlock className="h-10 w-64 max-w-full rounded-xl" />
        <ShimmerBlock className="h-4 w-28" />
      </div>
      <UserRowSkeleton />
      <UserRowSkeleton />
      <UserRowSkeleton />
      <UserRowSkeleton />
    </div>
  );
}

export function AdminAuditSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mt-8 space-y-3">
      {[0, 1, 2, 3, 4].map((index) => (
        <div aria-hidden="true" className="rounded-2xl border border-line bg-white p-4" key={index}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ShimmerBlock className="h-4 w-36 max-w-[50%]" />
            <ShimmerBlock className="h-3 w-28" />
          </div>
          <ShimmerBlock className="mt-3 h-3 w-[70%]" />
          <ShimmerBlock className="mt-2 h-3 w-[45%]" />
        </div>
      ))}
    </div>
  );
}
