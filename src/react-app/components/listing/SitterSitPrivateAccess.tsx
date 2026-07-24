import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queries } from "@/queries";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { VesselPrivateAccessCard } from "@/components/listing/VesselPrivateAccessCard";

function SitterSitPrivateAccessSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      aria-busy="true"
      aria-label={t("privateAccess.title")}
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-teal/35 bg-seafoam/60"
      data-testid="sitter-sit-private-access-skeleton"
    >
      <div aria-hidden="true" className="border-b border-teal/25 px-5 py-4">
        <div className="flex items-start gap-3">
          <ShimmerBlock className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBlock className="h-5 w-40 max-w-full" />
            <ShimmerBlock className="h-4 w-[85%] max-w-md" />
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="divide-y divide-teal/20">
        <div className="grid gap-2 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <ShimmerBlock className="h-3 w-24" />
          <ShimmerBlock className="h-4 w-[78%]" />
        </div>
        <div className="grid gap-2 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <ShimmerBlock className="h-3 w-24" />
          <ShimmerBlock className="h-4 w-[52%]" />
        </div>
        <div className="grid gap-2 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
          <ShimmerBlock className="h-3 w-24" />
          <ShimmerBlock className="h-4 w-[64%]" />
        </div>
      </div>
    </div>
  );
}

/** Loads and shows marina/Wi-Fi details for an underway sit on My sits. */
export function SitterSitPrivateAccess({
  sitId,
  viewerName,
}: {
  sitId: string;
  viewerName: string;
}) {
  const { data, isLoading, isError } = useQuery({
    ...queries.sitPrivateAccess.forViewer(sitId, viewerName),
  });

  if (isLoading) {
    return <SitterSitPrivateAccessSkeleton />;
  }
  if (isError || !data) {
    return null;
  }

  return (
    <div data-testid="sitter-sit-private-access">
      <VesselPrivateAccessCard details={data} variant="sitter" />
    </div>
  );
}
