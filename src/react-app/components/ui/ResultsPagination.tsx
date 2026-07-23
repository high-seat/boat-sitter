import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ResultsPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className,
  compact = false,
}: {
  /** 0-based page index */
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Icon-only prev/next buttons for narrow layouts */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  if (totalItems <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(currentPage, totalPages - 1);
  const pageStart = page * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalItems);
  const buttonClass = compact
    ? "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-navy hover:border-teal disabled:cursor-not-allowed disabled:opacity-40"
    : "inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      aria-label={t("boats.paginationNav")}
      className={
        className ??
        "mt-10 flex flex-col items-center gap-4 border-t border-line pt-8 sm:flex-row sm:justify-between"
      }
      data-testid="results-pagination"
    >
      <p className="text-sm text-slate" data-testid="results-pagination-range">
        {t("boats.paginationRange", {
          start: pageStart + 1,
          end: pageEnd,
          total: totalItems,
        })}
      </p>
      <div className={`flex items-center ${compact ? "justify-between gap-1" : "gap-2"}`}>
        <button
          aria-label={t("boats.paginationPrevious")}
          className={buttonClass}
          data-testid="results-pagination-previous"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          {compact ? null : t("boats.paginationPrevious")}
        </button>
        <p
          className={`text-center text-sm font-semibold text-slate ${compact ? "min-w-0 flex-1 px-1" : "min-w-28"}`}
          data-testid="results-pagination-page"
        >
          {t("boats.paginationPage", {
            page: page + 1,
            total: totalPages,
          })}
        </p>
        <button
          aria-label={t("boats.paginationNext")}
          className={buttonClass}
          data-testid="results-pagination-next"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          {compact ? null : t("boats.paginationNext")}
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </nav>
  );
}
