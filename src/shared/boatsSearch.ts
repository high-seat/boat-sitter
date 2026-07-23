/**
 * Shared boat catalogue filter / sort / pagination.
 * Used by the Worker `/api/boats` route and the SPA localStorage fallback.
 */

import { vesselTypeFromParam, vesselTypeToSlug } from "./vesselTypes";

const METERS_PER_FOOT = 0.3048;

/** Parse a stored length string into metres; NaN when unusable. */
export function boatLengthMetres(length: string | undefined | null): number {
  if (!length?.trim()) return Number.NaN;
  const match = length.trim().match(/^(\d+(?:[.,]\d+)?)\s*(m|ft|feet)?$/i);
  if (!match?.[1]) return Number.NaN;
  const amount = Number.parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(amount)) return Number.NaN;
  const unit = match[2]?.toLowerCase();
  return unit === "ft" || unit === "feet" ? amount * METERS_PER_FOOT : amount;
}

export type BoatSearchItem = {
  id: string;
  name: string;
  type: string;
  /** Stored length string (e.g. "12.8 m" or "42 ft"). */
  length?: string;
  /** Year of manufacture; null/undefined when unknown. */
  yearBuilt?: number | null;
  location: string;
  country: string;
  dateStart: string;
  duration: string;
  pet?: string | null;
  featured?: boolean;
  applicants: number;
  rating: number;
  reviews: number;
  /** Frontend sit type; API rows currently default to liveaboard. */
  sitType?: "liveaboard" | "daytimeChecks";
  /** True when a sitter has been accepted (client overlay / future column). */
  accepted?: boolean;
  /** False when applications are closed; API maps from `published`. */
  applicationsOpen?: boolean;
};

export type BoatSearchSort =
  | "recommended"
  | "soonest"
  | "latest"
  | "shortest"
  | "longest"
  | "popular";

export type BoatSearchParams = {
  q?: string;
  type?: string;
  sitType?: "all" | "liveaboard" | "daytimeChecks";
  from?: string;
  to?: string;
  pet?: boolean;
  availability?: "all" | "open" | "accepted";
  /** Minimum overall length in metres (inclusive). */
  minLengthM?: number;
  /** Maximum overall length in metres (inclusive). */
  maxLengthM?: number;
  /** Inclusive earliest year of manufacture. */
  yearFrom?: number;
  /** Inclusive latest year of manufacture. */
  yearTo?: number;
  sort?: BoatSearchSort;
  page?: number;
  limit?: number;
};

export type BoatSearchResult<T extends BoatSearchItem> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function parseDurationNights(duration: string): number {
  const n = Number.parseInt(duration, 10);
  return Number.isFinite(n) ? n : 0;
}

function overlapsDateRange(boat: BoatSearchItem, from?: string, to?: string): boolean {
  if (!from && !to) return true;
  const boatStart = new Date(`${boat.dateStart}T00:00:00`);
  if (Number.isNaN(boatStart.getTime())) return false;
  const boatEnd = new Date(boatStart);
  boatEnd.setDate(boatEnd.getDate() + parseDurationNights(boat.duration));
  const requestedStart = from ? new Date(`${from}T00:00:00`) : undefined;
  const requestedEnd = to ? new Date(`${to}T00:00:00`) : undefined;
  return (
    (!requestedStart || boatEnd >= requestedStart) && (!requestedEnd || boatStart <= requestedEnd)
  );
}

function isOpen(boat: BoatSearchItem): boolean {
  if (boat.accepted) return false;
  return boat.applicationsOpen !== false;
}

/** Lightweight “recommended” score without per-user prefs (server-safe). */
function recommendedScore(boat: BoatSearchItem, now = new Date()): number {
  let score = 0;
  const open = isOpen(boat);
  if (open) score += 1000;
  else if (!boat.accepted) score += 200;
  else score -= 600;
  if (boat.featured) score += 220;
  score += boat.rating * 18;
  score += Math.min(boat.reviews, 25) * 2;

  const start = new Date(`${boat.dateStart}T00:00:00`);
  if (!Number.isNaN(start.getTime())) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const days = Math.round((start.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) score -= 250;
    else {
      if (days <= 30) score += 160;
      score += Math.max(0, 140 - days);
    }
  }
  if (open) score -= Math.min(boat.applicants, 20) * 4;
  return score;
}

export function filterBoats<T extends BoatSearchItem>(boats: T[], params: BoatSearchParams): T[] {
  const searchValues = (params.q ?? "")
    .split("|")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const type = params.type?.trim();
  const sitType = params.sitType ?? "all";
  const availability = params.availability ?? "all";
  const petOnly = Boolean(params.pet);

  return boats.filter((boat) => {
    const searchable = `${boat.location} ${boat.country} ${boat.name}`.toLowerCase();
    const matchesQuery =
      searchValues.length === 0 || searchValues.some((value) => searchable.includes(value));
    const matchesType = !type || type === "All vessels" || boat.type === type;
    const boatSitType = boat.sitType ?? "liveaboard";
    const matchesSitType = sitType === "all" || boatSitType === sitType;
    const matchesDates = overlapsDateRange(boat, params.from, params.to);
    const matchesAvailability =
      availability === "all" ||
      (availability === "accepted" ? Boolean(boat.accepted) : isOpen(boat));
    const matchesPet = !petOnly || Boolean(boat.pet);

    const metres = boatLengthMetres(boat.length);
    const matchesMinLength =
      params.minLengthM == null || (Number.isFinite(metres) && metres >= params.minLengthM);
    const matchesMaxLength =
      params.maxLengthM == null || (Number.isFinite(metres) && metres <= params.maxLengthM);
    const year = boat.yearBuilt;
    const matchesYearFrom =
      params.yearFrom == null ||
      (typeof year === "number" && Number.isFinite(year) && year >= params.yearFrom);
    const matchesYearTo =
      params.yearTo == null ||
      (typeof year === "number" && Number.isFinite(year) && year <= params.yearTo);

    return (
      matchesQuery &&
      matchesType &&
      matchesSitType &&
      matchesDates &&
      matchesAvailability &&
      matchesPet &&
      matchesMinLength &&
      matchesMaxLength &&
      matchesYearFrom &&
      matchesYearTo
    );
  });
}

export function sortBoats<T extends BoatSearchItem>(
  boats: T[],
  sort: BoatSearchSort = "recommended",
): T[] {
  return [...boats].sort((a, b) => {
    if (sort === "recommended") {
      return recommendedScore(b) - recommendedScore(a) || a.dateStart.localeCompare(b.dateStart);
    }
    if (sort === "latest") return b.dateStart.localeCompare(a.dateStart);
    if (sort === "shortest") {
      return parseDurationNights(a.duration) - parseDurationNights(b.duration);
    }
    if (sort === "longest") {
      return parseDurationNights(b.duration) - parseDurationNights(a.duration);
    }
    if (sort === "popular") {
      return (
        b.applicants - a.applicants ||
        b.rating - a.rating ||
        b.reviews - a.reviews ||
        a.dateStart.localeCompare(b.dateStart)
      );
    }
    // soonest
    return a.dateStart.localeCompare(b.dateStart);
  });
}

export function paginateBoats<T extends BoatSearchItem>(
  boats: T[],
  params: BoatSearchParams,
): BoatSearchResult<T> {
  const filtered = filterBoats(boats, params);
  const sorted = sortBoats(filtered, params.sort ?? "recommended");
  const total = sorted.length;
  const limitRaw = params.limit;
  // limit <= 0 or omitted without page → return all (featured/home/map dumps).
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

export function boatsSearchQueryString(params: BoatSearchParams): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.type && params.type !== "All vessels") {
    const slug = vesselTypeToSlug(params.type) ?? params.type;
    search.set("type", slug);
  }
  if (params.sitType && params.sitType !== "all") search.set("sitType", params.sitType);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.pet) search.set("pet", "1");
  if (params.availability && params.availability !== "all") {
    search.set("availability", params.availability);
  }
  if (params.minLengthM != null && Number.isFinite(params.minLengthM)) {
    search.set("minLength", String(params.minLengthM));
  }
  if (params.maxLengthM != null && Number.isFinite(params.maxLengthM)) {
    search.set("maxLength", String(params.maxLengthM));
  }
  if (params.yearFrom != null && Number.isFinite(params.yearFrom)) {
    search.set("yearFrom", String(params.yearFrom));
  }
  if (params.yearTo != null && Number.isFinite(params.yearTo)) {
    search.set("yearTo", String(params.yearTo));
  }
  if (params.sort && params.sort !== "recommended") search.set("sort", params.sort);
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function parseBoatsSearchParams(
  query: Record<string, string | undefined> | URLSearchParams,
): BoatSearchParams {
  const get = (key: string) =>
    query instanceof URLSearchParams ? (query.get(key) ?? undefined) : query[key];
  const sitTypeRaw = get("sitType");
  const sitType =
    sitTypeRaw === "liveaboard" || sitTypeRaw === "daytimeChecks" ? sitTypeRaw : "all";
  const availabilityRaw = get("availability");
  const availability =
    availabilityRaw === "open" || availabilityRaw === "accepted" ? availabilityRaw : "all";
  const sortRaw = get("sort");
  const sort: BoatSearchSort =
    sortRaw === "soonest" ||
    sortRaw === "latest" ||
    sortRaw === "shortest" ||
    sortRaw === "longest" ||
    sortRaw === "popular" ||
    sortRaw === "recommended"
      ? sortRaw
      : "recommended";
  const page = get("page");
  const limit = get("limit");
  const minLengthRaw = get("minLength");
  const maxLengthRaw = get("maxLength");
  const yearFromRaw = get("yearFrom");
  const yearToRaw = get("yearTo");
  const minLengthM =
    minLengthRaw != null && minLengthRaw !== "" ? Number.parseFloat(minLengthRaw) : undefined;
  const maxLengthM =
    maxLengthRaw != null && maxLengthRaw !== "" ? Number.parseFloat(maxLengthRaw) : undefined;
  const yearFrom =
    yearFromRaw != null && yearFromRaw !== "" ? Number.parseInt(yearFromRaw, 10) : undefined;
  const yearTo = yearToRaw != null && yearToRaw !== "" ? Number.parseInt(yearToRaw, 10) : undefined;
  return {
    q: get("q") || undefined,
    type: vesselTypeFromParam(get("type")),
    sitType,
    from: get("from") || undefined,
    to: get("to") || undefined,
    pet: get("pet") === "1" || get("pet") === "true",
    availability,
    minLengthM: minLengthM != null && Number.isFinite(minLengthM) ? minLengthM : undefined,
    maxLengthM: maxLengthM != null && Number.isFinite(maxLengthM) ? maxLengthM : undefined,
    yearFrom: yearFrom != null && Number.isFinite(yearFrom) ? yearFrom : undefined,
    yearTo: yearTo != null && Number.isFinite(yearTo) ? yearTo : undefined,
    sort,
    page: page != null && page !== "" ? Number.parseInt(page, 10) || 0 : undefined,
    limit: limit != null && limit !== "" ? Number.parseInt(limit, 10) : undefined,
  };
}
