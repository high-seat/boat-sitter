import { ShimmerBlock } from "@/components/ui/Shimmer";

function NotificationRowSkeleton({
  lineWidth,
  timeWidth,
}: {
  lineWidth: string;
  timeWidth: string;
}) {
  return (
    <div aria-hidden="true" className="relative flex gap-3 rounded-xl px-3 py-3">
      <ShimmerBlock className="mt-0.5 size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2 pr-3">
        <ShimmerBlock className={`h-4 ${lineWidth} max-w-full`} />
        <ShimmerBlock className={`h-3 ${timeWidth}`} />
      </div>
      <ShimmerBlock className="absolute top-4 right-3 size-2 rounded-full" />
    </div>
  );
}

export function NotificationsMenuSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div aria-hidden="true" className="max-h-96 space-y-0.5 overflow-hidden p-2">
        <NotificationRowSkeleton lineWidth="w-[92%]" timeWidth="w-16" />
        <NotificationRowSkeleton lineWidth="w-[78%]" timeWidth="w-20" />
        <NotificationRowSkeleton lineWidth="w-[88%]" timeWidth="w-14" />
        <NotificationRowSkeleton lineWidth="w-[70%]" timeWidth="w-24" />
        <NotificationRowSkeleton lineWidth="w-[84%]" timeWidth="w-16" />
      </div>
      <div aria-hidden="true" className="border-t border-line p-2">
        <ShimmerBlock className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
