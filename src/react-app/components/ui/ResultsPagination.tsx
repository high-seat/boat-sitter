import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ResultsPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: {
  /** 0-based page index */
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (totalItems <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(currentPage, totalPages - 1);
  const pageStart = page * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalItems);

  return (
    <nav
      aria-label={t("boats.paginationNav")}
      className="mt-10 flex flex-col items-center gap-4 border-t border-line pt-8 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-slate">
        {t("boats.paginationRange", {
          start: pageStart + 1,
          end: pageEnd,
          total: totalItems,
        })}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={16} />
          {t("boats.paginationPrevious")}
        </button>
        <p className="min-w-28 text-center text-sm font-semibold text-slate">
          {t("boats.paginationPage", {
            page: page + 1,
            total: totalPages,
          })}
        </p>
        <button
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          {t("boats.paginationNext")}
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </nav>
  );
}
