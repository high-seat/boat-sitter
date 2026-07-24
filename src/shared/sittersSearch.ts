import { anySitOverlapsAnyAvailabilityWindow } from "./availabilityMatch";

/**
 * Shared sitter catalogue filter / sort / pagination.
 * Used by the Worker `/api/sitters` route and client query wiring.
 */

export type SitterSearchItem = {
  /** Profile display name (also used in `/members/:name`). */
  name: string;
  image: string;
  location: string;
  bio: string;
  languages: string[];
  preferredCountries: string[];
  skills: string[];
  certifications: string[];
  yearsExperience: number;
  completedSits: number;
  memberSince: number;
  rating: number;
  reviews: number;
  /** Soonest open availability window start (YYYY-MM-DD), if any. */
  availableFrom?: string | null;
  /** Matching window end for `availableFrom`. */
  availableTo?: string | null;
  /** Regions from open availability windows (merged, unique). */
  availabilityRegions: string[];
  /** Open, non-expired availability windows used for date filtering. */
  openWindows?: Array<{ dateStart: string; dateEnd: string; regions: string[] }>;
  /** True when the sitter has at least one open, non-expired window. */
  hasOpenAvailability: boolean;
};

export type SitterSearchSort = "recommended" | "soonest" | "experienced" | "popular" | "rating";

export type SitterSearchParams = {
  /** Pipe-separated destination terms (`Athens|Greece`). */
  q?: string;
  from?: string;
  to?: string;
  /** Case-insensitive language match against profile languages. */
  language?: string;
  /** Minimum years of boat-sitting experience (inclusive). */
  minYears?: number;
  /** Minimum completed sits (inclusive). */
  minCompletedSits?: number;
  /** Minimum average owner→sitter rating (inclusive). */
  minRating?: number;
  /** Require at least one certification. */
  certified?: boolean;
  /** Require an open, non-expired availability window (default true when dates set). */
  availableOnly?: boolean;
  /**
   * When true (and the request is authenticated), only sitters whose open
   * windows overlap one of the owner's accepting sits. Resolved server-side
   * into `matchOwnerSits` before filtering.
   */
  matchesMySits?: boolean;
  /**
   * Owner open sits used for the "matches my sits" filter. Set by the API from
   * the session — not a public query-string field.
   */
  matchOwnerSits?: Array<{
    dateStart: string;
    duration: string;
    country: string;
    location: string;
  }>;
  sort?: SitterSearchSort;
  page?: number;
  limit?: number;
};

export type SitterSearchResult<T extends SitterSearchItem> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function overlapsAvailability(sitter: SitterSearchItem, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const windows = sitter.openWindows;
  if (windows?.length) {
    return windows.some((win) => (!from || win.dateEnd >= from) && (!to || win.dateStart <= to));
  }
  if (!sitter.availableFrom || !sitter.availableTo) return false;
  return (!from || sitter.availableTo >= from) && (!to || sitter.availableFrom <= to);
}

function matchesDestination(sitter: SitterSearchItem, searchValues: string[]): boolean {
  if (searchValues.length === 0) return true;
  const haystack = [
    sitter.location,
    ...sitter.preferredCountries,
    ...sitter.availabilityRegions,
    sitter.name,
  ]
    .join(" ")
    .toLowerCase();
  return searchValues.some((value) => haystack.includes(value));
}

function matchesLanguage(sitter: SitterSearchItem, language?: string): boolean {
  if (!language?.trim()) return true;
  const needle = language.trim().toLowerCase();
  return sitter.languages.some((lang) => lang.toLowerCase() === needle);
}

/** Lightweight recommended score without per-user prefs (server-safe). */
function recommendedScore(sitter: SitterSearchItem): number {
  let score = 0;
  if (sitter.hasOpenAvailability) score += 1000;
  score += sitter.rating * 40;
  score += Math.min(sitter.reviews, 25) * 4;
  score += Math.min(sitter.completedSits, 40) * 3;
  score += Math.min(sitter.yearsExperience, 20) * 5;
  if (sitter.certifications.length) score += 80;
  if (sitter.availableFrom) {
    const today = new Date().toISOString().slice(0, 10);
    const days = Math.round(
      (new Date(`${sitter.availableFrom}T00:00:00`).getTime() -
        new Date(`${today}T00:00:00`).getTime()) /
        86_400_000,
    );
    if (days >= 0 && days <= 60) score += 120 - days;
  }
  return score;
}

export function filterSitters<T extends SitterSearchItem>(
  sitters: T[],
  params: SitterSearchParams,
): T[] {
  const searchValues = (params.q ?? "")
    .split("|")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const availableOnly = params.availableOnly === true || Boolean(params.from) || Boolean(params.to);
  const minYears = params.minYears;
  const minCompleted = params.minCompletedSits;
  const minRating = params.minRating;
  const certifiedOnly = Boolean(params.certified);

  return sitters.filter((sitter) => {
    const matchesQuery = matchesDestination(sitter, searchValues);
    const matchesLang = matchesLanguage(sitter, params.language);
    const matchesDates = overlapsAvailability(sitter, params.from, params.to);
    const matchesAvailability = !availableOnly || sitter.hasOpenAvailability;
    const matchesYears =
      minYears == null || (Number.isFinite(minYears) && sitter.yearsExperience >= minYears);
    const matchesCompleted =
      minCompleted == null ||
      (Number.isFinite(minCompleted) && sitter.completedSits >= minCompleted);
    const matchesRating =
      minRating == null || (Number.isFinite(minRating) && sitter.rating >= minRating);
    const matchesCertified = !certifiedOnly || sitter.certifications.length > 0;
    let matchesOwnerSits = true;
    if (params.matchOwnerSits != null) {
      matchesOwnerSits =
        params.matchOwnerSits.length > 0 &&
        anySitOverlapsAnyAvailabilityWindow(params.matchOwnerSits, sitter.openWindows ?? []);
    }

    return (
      matchesQuery &&
      matchesLang &&
      matchesDates &&
      matchesAvailability &&
      matchesYears &&
      matchesCompleted &&
      matchesRating &&
      matchesCertified &&
      matchesOwnerSits
    );
  });
}

export function sortSitters<T extends SitterSearchItem>(
  sitters: T[],
  sort: SitterSearchSort = "recommended",
): T[] {
  return [...sitters].sort((a, b) => {
    if (sort === "soonest") {
      const aStart = a.availableFrom ?? "9999-12-31";
      const bStart = b.availableFrom ?? "9999-12-31";
      return aStart.localeCompare(bStart) || a.name.localeCompare(b.name);
    }
    if (sort === "experienced") {
      return (
        b.yearsExperience - a.yearsExperience ||
        b.completedSits - a.completedSits ||
        a.name.localeCompare(b.name)
      );
    }
    if (sort === "popular") {
      return (
        b.completedSits - a.completedSits || b.reviews - a.reviews || a.name.localeCompare(b.name)
      );
    }
    if (sort === "rating") {
      return b.rating - a.rating || b.reviews - a.reviews || a.name.localeCompare(b.name);
    }
    return recommendedScore(b) - recommendedScore(a) || a.name.localeCompare(b.name);
  });
}

export function paginateSitters<T extends SitterSearchItem>(
  sitters: T[],
  params: SitterSearchParams,
): SitterSearchResult<T> {
  const filtered = filterSitters(sitters, params);
  const sorted = sortSitters(filtered, params.sort ?? "recommended");
  const total = sorted.length;
  const limitRaw = params.limit;
  if (limitRaw == null || limitRaw <= 0) {
    return { items: sorted, total, page: 0, limit: total || 1, totalPages: 1 };
  }
  const limit = Math.min(50, Math.max(1, Math.floor(limitRaw)));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(Math.max(0, Math.floor(params.page ?? 0)), totalPages - 1);
  const start = page * limit;
  return {
    items: sorted.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

export function sittersSearchQueryString(params: SitterSearchParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.language) search.set("language", params.language);
  if (params.minYears != null && Number.isFinite(params.minYears)) {
    search.set("minYears", String(params.minYears));
  }
  if (params.minCompletedSits != null && Number.isFinite(params.minCompletedSits)) {
    search.set("minCompletedSits", String(params.minCompletedSits));
  }
  if (params.minRating != null && Number.isFinite(params.minRating)) {
    search.set("minRating", String(params.minRating));
  }
  if (params.certified) search.set("certified", "1");
  if (params.availableOnly) search.set("availableOnly", "1");
  if (params.matchesMySits) search.set("matchesMySits", "1");
  if (params.sort && params.sort !== "recommended") search.set("sort", params.sort);
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function parseSittersSearchParams(
  query: Record<string, string | undefined> | URLSearchParams,
): SitterSearchParams {
  const get = (key: string) =>
    query instanceof URLSearchParams ? (query.get(key) ?? undefined) : query[key];
  const sortRaw = get("sort");
  const sort: SitterSearchSort =
    sortRaw === "soonest" ||
    sortRaw === "experienced" ||
    sortRaw === "popular" ||
    sortRaw === "rating" ||
    sortRaw === "recommended"
      ? sortRaw
      : "recommended";
  const page = get("page");
  const limit = get("limit");
  const minYearsRaw = get("minYears");
  const minCompletedRaw = get("minCompletedSits");
  const minRatingRaw = get("minRating");
  const minYears =
    minYearsRaw != null && minYearsRaw !== "" ? Number.parseInt(minYearsRaw, 10) : undefined;
  const minCompletedSits =
    minCompletedRaw != null && minCompletedRaw !== ""
      ? Number.parseInt(minCompletedRaw, 10)
      : undefined;
  const minRating =
    minRatingRaw != null && minRatingRaw !== "" ? Number.parseFloat(minRatingRaw) : undefined;

  return {
    q: get("q") || undefined,
    from: get("from") || undefined,
    to: get("to") || undefined,
    language: get("language") || undefined,
    minYears: minYears != null && Number.isFinite(minYears) ? minYears : undefined,
    minCompletedSits:
      minCompletedSits != null && Number.isFinite(minCompletedSits) ? minCompletedSits : undefined,
    minRating: minRating != null && Number.isFinite(minRating) ? minRating : undefined,
    certified: get("certified") === "1" || get("certified") === "true",
    availableOnly: get("availableOnly") === "1" || get("availableOnly") === "true",
    matchesMySits: get("matchesMySits") === "1" || get("matchesMySits") === "true",
    sort,
    page: page != null && page !== "" ? Number.parseInt(page, 10) || 0 : undefined,
    limit: limit != null && limit !== "" ? Number.parseInt(limit, 10) : undefined,
  };
}
