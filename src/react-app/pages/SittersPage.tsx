import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronDown, LifeBuoy, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { ResultsPagination } from "@/components/ui/ResultsPagination";
import { RefetchingResults } from "@/components/ui/RefetchingResults";
import { Select } from "@/components/ui/Select";
import { SittersPageLoadingSkeleton } from "@/components/ui/SitterCardSkeleton";
import { formatInclusiveDateRange } from "@/dateUtils";
import { getIntlLocale } from "@/i18n";
import { isAcceptingApplications, type Sit, type Vessel } from "@/mockApi";
import { optimizePhotoUrl } from "@/photoUtils";
import { queries } from "@/queries";
import { useAppStore } from "@/store";
import { anySitOverlapsAnyAvailabilityWindow } from "../../shared/availabilityMatch";
import type { SitterSearchItem, SitterSearchSort } from "../../shared/sittersSearch";

const SITTERS_PER_PAGE = 9;

type OwnerOpenSit = {
  dateStart: string;
  duration: string;
  country: string;
  location: string;
};

function ownerOpenSits(
  userName: string | undefined,
  vessels: Vessel[],
  sits: Sit[],
): OwnerOpenSit[] {
  if (!userName) return [];
  const myBoatIds = new Set(
    vessels.filter((vessel) => vessel.owner === userName).map((vessel) => vessel.id),
  );
  return sits
    .filter((sit) => myBoatIds.has(sit.boatId) && isAcceptingApplications(sit))
    .map((sit) => ({
      dateStart: sit.dateStart,
      duration: sit.duration,
      country: sit.country,
      location: sit.location,
    }));
}

const LANGUAGE_OPTIONS = [
  "English",
  "French",
  "Spanish",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Greek",
  "Croatian",
  "Turkish",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Arabic",
  "Russian",
  "Japanese",
] as const;

const fallbackAvatar = "https://api.dicebear.com/9.x/initials/svg?seed=Boatstead";

function formatAvailabilityRange(
  language: string,
  from: string | null | undefined,
  to: string | null | undefined,
) {
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return formatInclusiveDateRange(getIntlLocale(language), start, end);
}

function SitterCard({
  matchesOwnerSit,
  sitter,
}: {
  matchesOwnerSit: boolean;
  sitter: SitterSearchItem;
}) {
  const { i18n, t } = useTranslation();
  const availabilityLabel = formatAvailabilityRange(
    i18n.language,
    sitter.availableFrom,
    sitter.availableTo,
  );
  const destinationLabel =
    sitter.preferredCountries.slice(0, 2).join(", ") ||
    sitter.availabilityRegions.slice(0, 2).join(", ") ||
    sitter.location;
  const openToLabel = availabilityLabel ?? (destinationLabel || t("sitters.anywhere"));
  const avatarFallback = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(sitter.name)}`;

  return (
    <article className="group min-w-0" data-testid="sitter-card">
      <Link className="block min-w-0" to={`/members/${encodeURIComponent(sitter.name)}`}>
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-seafoam">
          <img
            alt={t("sitters.cardImageAlt", { name: sitter.name })}
            className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={(event) => {
              const img = event.currentTarget;
              if (img.src !== avatarFallback) img.src = avatarFallback;
            }}
            referrerPolicy="no-referrer"
            src={optimizePhotoUrl(sitter.image || fallbackAvatar, 900)}
          />
          {matchesOwnerSit || sitter.hasOpenAvailability ? (
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
              {matchesOwnerSit ? (
                <span
                  className="rounded-full bg-teal px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                  data-testid="sitter-card-matches"
                >
                  {t("member.availabilityMatches")}
                </span>
              ) : null}
              {sitter.hasOpenAvailability ? (
                <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-teal shadow-sm">
                  {t("sitters.availableBadge")}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="min-w-0 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-hidden">
              <h3
                className="truncate font-display text-xl font-bold tracking-tight text-navy"
                data-testid="sitter-card-name"
                title={sitter.name}
              >
                {sitter.name}
              </h3>
              <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-sm text-slate">
                <MapPin className="shrink-0" size={15} />
                <span className="truncate">
                  {sitter.location.trim() || t("sitters.locationUnknown")}
                </span>
              </p>
            </div>
            {sitter.reviews > 0 ? (
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                <Star className="fill-sun text-sun" size={15} /> {sitter.rating}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate">
            {t("sitters.cardSummary", {
              experience: t("sitters.yearsExperience", { count: sitter.yearsExperience }),
              sits: t("sitters.completedSits", { count: sitter.completedSits }),
            })}
          </p>
          {sitter.languages.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sitter.languages.slice(0, 3).map((language) => (
                <span
                  className="rounded-full bg-cream px-2.5 py-1 text-xs font-semibold text-navy"
                  key={language}
                >
                  {language}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-line pt-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-navy">{openToLabel}</span>
            <span className="shrink-0 text-slate">
              {availabilityLabel ? t("sitters.availableLabel") : t("sitters.openToLabel")}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function SittersPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const params = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [dates, setDates] = useState({
    startDate: params.get("from") ?? "",
    endDate: params.get("to") ?? "",
  });
  const [language, setLanguage] = useState(params.get("language") ?? "");
  const [minYears, setMinYears] = useState(params.get("minYears") ?? "");
  const [minCompletedSits, setMinCompletedSits] = useState(params.get("minCompletedSits") ?? "");
  const [minRating, setMinRating] = useState(params.get("minRating") ?? "");
  const [certifiedOnly, setCertifiedOnly] = useState(
    params.get("certified") === "1" || params.get("certified") === "true",
  );
  const [availableOnly, setAvailableOnly] = useState(
    params.get("availableOnly") === "1" || params.get("availableOnly") === "true",
  );
  const [matchesMySits, setMatchesMySits] = useState(
    params.get("matchesMySits") === "1" || params.get("matchesMySits") === "true",
  );
  const [advancedOpen, setAdvancedOpen] = useState(
    () =>
      Boolean(params.get("minYears")) ||
      Boolean(params.get("minCompletedSits")) ||
      Boolean(params.get("minRating")) ||
      params.get("certified") === "1" ||
      params.get("certified") === "true" ||
      params.get("availableOnly") === "1" ||
      params.get("availableOnly") === "true",
  );
  const [sort, setSort] = useState<SitterSearchSort>(() => {
    const value = params.get("sort");
    if (
      value === "soonest" ||
      value === "experienced" ||
      value === "popular" ||
      value === "rating" ||
      value === "recommended"
    ) {
      return value;
    }
    return "recommended";
  });
  const [page, setPage] = useState(() => {
    const value = Number.parseInt(params.get("page") ?? "0", 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const resultsTopRef = useRef<HTMLDivElement>(null);

  function syncSitterSearchUrl(next: {
    q?: string;
    from?: string;
    to?: string;
    language?: string;
    minYears?: string;
    minCompletedSits?: string;
    minRating?: string;
    certified?: boolean;
    availableOnly?: boolean;
    matchesMySits?: boolean;
    sort?: SitterSearchSort;
    page?: number;
  }) {
    const nextParams = new URLSearchParams(window.location.search);
    const q = next.q ?? query;
    const from = next.from ?? dates.startDate;
    const to = next.to ?? dates.endDate;
    const languageValue = next.language ?? language;
    const minYearsValue = next.minYears ?? minYears;
    const minCompletedValue = next.minCompletedSits ?? minCompletedSits;
    const minRatingValue = next.minRating ?? minRating;
    const certified = next.certified ?? certifiedOnly;
    const available = next.availableOnly ?? availableOnly;
    const matches = next.matchesMySits ?? matchesMySits;
    const sortValue = next.sort ?? sort;
    const pageValue = next.page ?? page;

    if (q) nextParams.set("q", q);
    else nextParams.delete("q");
    if (from) nextParams.set("from", from);
    else nextParams.delete("from");
    if (to) nextParams.set("to", to);
    else nextParams.delete("to");
    if (languageValue) nextParams.set("language", languageValue);
    else nextParams.delete("language");
    if (minYearsValue.trim()) nextParams.set("minYears", minYearsValue.trim());
    else nextParams.delete("minYears");
    if (minCompletedValue.trim()) {
      nextParams.set("minCompletedSits", minCompletedValue.trim());
    } else nextParams.delete("minCompletedSits");
    if (minRatingValue.trim()) nextParams.set("minRating", minRatingValue.trim());
    else nextParams.delete("minRating");
    if (certified) nextParams.set("certified", "1");
    else nextParams.delete("certified");
    if (available) nextParams.set("availableOnly", "1");
    else nextParams.delete("availableOnly");
    if (matches) nextParams.set("matchesMySits", "1");
    else nextParams.delete("matchesMySits");
    if (sortValue !== "recommended") nextParams.set("sort", sortValue);
    else nextParams.delete("sort");
    if (pageValue > 0) nextParams.set("page", String(pageValue));
    else nextParams.delete("page");

    const search = nextParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }

  const filterParams = useMemo(
    () => ({
      q: query || undefined,
      from: dates.startDate || undefined,
      to: dates.endDate || undefined,
      language: language || undefined,
      minYears: minYears.trim() ? Number.parseInt(minYears, 10) || undefined : undefined,
      minCompletedSits: minCompletedSits.trim()
        ? Number.parseInt(minCompletedSits, 10) || undefined
        : undefined,
      minRating: minRating.trim() ? Number.parseFloat(minRating) || undefined : undefined,
      certified: certifiedOnly || undefined,
      availableOnly: availableOnly || undefined,
      matchesMySits: matchesMySits || undefined,
      sort,
    }),
    [
      availableOnly,
      certifiedOnly,
      dates.endDate,
      dates.startDate,
      language,
      matchesMySits,
      minCompletedSits,
      minRating,
      minYears,
      query,
      sort,
    ],
  );

  const listSearchParams = useMemo(
    () => ({
      ...filterParams,
      page,
      limit: SITTERS_PER_PAGE,
    }),
    [filterParams, page],
  );

  const { data, isLoading, isFetching } = useQuery({
    ...queries.sitters.search(listSearchParams),
    placeholderData: keepPreviousData,
  });

  const canMatch = Boolean(user);
  const { data: vessels = [], isPending: vesselsPending } = useQuery({
    ...queries.vessels.all,
    enabled: canMatch,
  });
  const { data: sits = [], isPending: sitsPending } = useQuery({
    ...queries.sits.all,
    enabled: canMatch,
  });

  const matchingOwnerSits = useMemo(() => {
    if (!canMatch || vesselsPending || sitsPending) return [];
    return ownerOpenSits(user?.name, vessels, sits);
  }, [canMatch, vesselsPending, sitsPending, user?.name, vessels, sits]);

  const listSitters = data?.sitters ?? [];
  const totalItems = data?.total ?? 0;
  const currentPage = data?.page ?? page;

  function goToPage(nextPage: number) {
    setPage(nextPage);
    syncSitterSearchUrl({ page: nextPage });
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetFilters() {
    setQuery("");
    setDates({ startDate: "", endDate: "" });
    setLanguage("");
    setMinYears("");
    setMinCompletedSits("");
    setMinRating("");
    setCertifiedOnly(false);
    setAvailableOnly(false);
    setMatchesMySits(false);
    setAdvancedOpen(false);
    setSort("recommended");
    setPage(0);
    window.history.replaceState(null, "", window.location.pathname);
  }

  const filtersActive =
    Boolean(query) ||
    Boolean(dates.startDate) ||
    Boolean(dates.endDate) ||
    Boolean(language) ||
    Boolean(minYears.trim()) ||
    Boolean(minCompletedSits.trim()) ||
    Boolean(minRating.trim()) ||
    certifiedOnly ||
    availableOnly ||
    matchesMySits;

  function renderResults() {
    if (totalItems) {
      return (
        <RefetchingResults
          className="mt-6"
          message={t("sitters.gettingResults")}
          pending={isFetching && !isLoading}
          testId="sitters-results"
        >
          <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {listSitters.map((sitter) => (
              <SitterCard
                key={sitter.name}
                matchesOwnerSit={anySitOverlapsAnyAvailabilityWindow(
                  matchingOwnerSits,
                  sitter.openWindows ?? [],
                )}
                sitter={sitter}
              />
            ))}
          </div>
          <ResultsPagination
            currentPage={currentPage}
            onPageChange={goToPage}
            pageSize={SITTERS_PER_PAGE}
            totalItems={totalItems}
          />
        </RefetchingResults>
      );
    }
    return (
      <div
        className="mt-16 rounded-2xl border border-line bg-white py-16 text-center"
        data-testid="sitters-empty"
      >
        <LifeBuoy className="mx-auto text-teal" size={36} />
        <h2 className="mt-4 font-display text-xl font-bold text-navy">{t("sitters.empty")}</h2>
        <p className="mt-2 text-sm text-slate">{t("sitters.emptyHint")}</p>
        {filtersActive ? (
          <button
            className="mt-6 rounded-full bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-ink"
            data-testid="sitters-reset-filters"
            onClick={resetFilters}
            type="button"
          >
            {t("sitters.resetFilters")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <main className="px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h1 className="section-title" data-testid="sitters-title">
            {t("sitters.title")}
          </h1>
          <p className="mt-3 text-slate">{t("sitters.subtitle")}</p>
        </div>
        <div
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm md:flex-row md:flex-wrap"
          data-testid="sitters-filters"
        >
          <DestinationAutocomplete
            multiple
            onChange={(value) => {
              setQuery(value);
              setPage(0);
              syncSitterSearchUrl({ q: value, page: 0 });
            }}
            testId="sitters-destination"
            value={query}
          />
          <DateRangePicker
            endDate={dates.endDate}
            onChange={(next) => {
              setDates(next);
              setPage(0);
              syncSitterSearchUrl({ from: next.startDate, to: next.endDate, page: 0 });
            }}
            startDate={dates.startDate}
            testId="sitters-dates"
            variant="browse"
          />
          <Select
            aria-label={t("sitters.languageLabel")}
            data-testid="sitters-language"
            onChange={(event) => {
              const value = event.target.value;
              setLanguage(value);
              setPage(0);
              syncSitterSearchUrl({ language: value, page: 0 });
            }}
            value={language}
          >
            <option value="">{t("sitters.anyLanguage")}</option>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {user ? (
            <label
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                matchesMySits
                  ? "border-teal bg-seafoam text-teal"
                  : "border-line bg-white text-slate"
              }`}
            >
              <input
                checked={matchesMySits}
                className="size-4 accent-teal"
                data-testid="sitters-matches-my-sits"
                onChange={(event) => {
                  const value = event.target.checked;
                  setMatchesMySits(value);
                  setPage(0);
                  syncSitterSearchUrl({ matchesMySits: value, page: 0 });
                }}
                type="checkbox"
              />
              {t("sitters.matchesMySits")}
            </label>
          ) : null}
        </div>
        <div className="mt-3">
          <button
            aria-controls="sitters-advanced-filters"
            aria-expanded={advancedOpen}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal"
            data-testid="sitters-advanced-toggle"
            onClick={() => setAdvancedOpen((open) => !open)}
            type="button"
          >
            {t("sitters.advancedFilters")}
            <ChevronDown
              aria-hidden="true"
              className={`transition ${advancedOpen ? "rotate-180" : ""}`}
              size={16}
            />
          </button>
          {advancedOpen ? (
            <div
              className="mt-3 grid gap-3 rounded-2xl border border-line bg-cream/40 p-4 sm:grid-cols-2 lg:grid-cols-4"
              data-testid="sitters-advanced-filters"
              id="sitters-advanced-filters"
            >
              <div className="flex h-full flex-col justify-end">
                <label
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${availableOnly ? "border-teal bg-seafoam text-teal" : "border-line bg-white text-slate"}`}
                >
                  <span className="flex cursor-pointer items-center gap-2">
                    <input
                      checked={availableOnly}
                      className="size-4 accent-teal"
                      data-testid="sitters-available-only"
                      onChange={(event) => {
                        const value = event.target.checked;
                        setAvailableOnly(value);
                        setPage(0);
                        syncSitterSearchUrl({ availableOnly: value, page: 0 });
                      }}
                      type="checkbox"
                    />
                    {t("sitters.availableOnly")}
                  </span>
                </label>
              </div>
              <div className="flex h-full flex-col justify-end">
                <label
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${certifiedOnly ? "border-teal bg-seafoam text-teal" : "border-line bg-white text-slate"}`}
                >
                  <span className="flex cursor-pointer items-center gap-2">
                    <input
                      checked={certifiedOnly}
                      className="size-4 accent-teal"
                      data-testid="sitters-certified-only"
                      onChange={(event) => {
                        const value = event.target.checked;
                        setCertifiedOnly(value);
                        setPage(0);
                        syncSitterSearchUrl({ certified: value, page: 0 });
                      }}
                      type="checkbox"
                    />
                    {t("sitters.certifiedOnly")}
                  </span>
                </label>
              </div>
              <label>
                <span className="form-label">{t("sitters.minYears")}</span>
                <input
                  className="form-input"
                  data-testid="sitters-min-years"
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => {
                    const value = event.target.value;
                    setMinYears(value);
                    setPage(0);
                    syncSitterSearchUrl({ minYears: value, page: 0 });
                  }}
                  placeholder={t("sitters.any")}
                  type="number"
                  value={minYears}
                />
              </label>
              <label>
                <span className="form-label">{t("sitters.minCompletedSits")}</span>
                <input
                  className="form-input"
                  data-testid="sitters-min-completed"
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => {
                    const value = event.target.value;
                    setMinCompletedSits(value);
                    setPage(0);
                    syncSitterSearchUrl({ minCompletedSits: value, page: 0 });
                  }}
                  placeholder={t("sitters.any")}
                  type="number"
                  value={minCompletedSits}
                />
              </label>
              <label>
                <span className="form-label">{t("sitters.minRating")}</span>
                <input
                  className="form-input"
                  data-testid="sitters-min-rating"
                  inputMode="decimal"
                  max="5"
                  min="0"
                  onChange={(event) => {
                    const value = event.target.value;
                    setMinRating(value);
                    setPage(0);
                    syncSitterSearchUrl({ minRating: value, page: 0 });
                  }}
                  placeholder={t("sitters.any")}
                  step="0.1"
                  type="number"
                  value={minRating}
                />
              </label>
            </div>
          ) : null}
        </div>
        {isLoading ? (
          <SittersPageLoadingSkeleton />
        ) : (
          <>
            <div
              className="mt-9 flex flex-wrap items-center justify-between gap-3"
              ref={resultsTopRef}
            >
              <p className="text-sm text-slate" data-testid="sitters-results-count">
                {t("sitters.results", { count: totalItems })}
              </p>
              <label
                className={`flex items-center gap-2 text-sm text-slate ${
                  totalItems === 0 ? "opacity-50" : ""
                }`}
              >
                <span className="sr-only">{t("sitters.sortLabel")}</span>
                <Select
                  aria-label={t("sitters.sortLabel")}
                  data-testid="sitters-sort"
                  disabled={totalItems === 0}
                  onChange={(event) => {
                    const value = event.target.value as SitterSearchSort;
                    setSort(value);
                    setPage(0);
                    syncSitterSearchUrl({ sort: value, page: 0 });
                  }}
                  value={sort}
                  variant="sort"
                >
                  <option value="recommended">{t("sitters.sortRecommended")}</option>
                  <option value="soonest">{t("sitters.sortSoonest")}</option>
                  <option value="experienced">{t("sitters.sortExperienced")}</option>
                  <option value="popular">{t("sitters.sortPopular")}</option>
                  <option value="rating">{t("sitters.sortRating")}</option>
                </Select>
              </label>
            </div>
            {renderResults()}
          </>
        )}
      </div>
    </main>
  );
}
