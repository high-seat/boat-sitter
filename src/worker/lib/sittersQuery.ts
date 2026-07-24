import { and, eq, gte, sql } from "drizzle-orm";
import type { Db } from "../db";
import { profiles, reviews, sitterAvailability } from "../db/schema";
import {
  paginateSitters,
  type SitterSearchItem,
  type SitterSearchParams,
  type SitterSearchResult,
} from "../../shared/sittersSearch";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickDisplayWindow(
  windows: Array<{ dateStart: string; dateEnd: string; regions: string[] }>,
  from?: string,
  to?: string,
): { dateStart: string; dateEnd: string } | null {
  const matching = windows.filter(
    (win) => (!from || win.dateEnd >= from) && (!to || win.dateStart <= to),
  );
  const pool = matching.length ? matching : windows;
  if (!pool.length) return null;
  return [...pool].sort((a, b) => a.dateStart.localeCompare(b.dateStart))[0] ?? null;
}

/**
 * Build the public sitter catalogue: profiles that look like sitters, enriched
 * with open availability windows and owner→sitter review aggregates.
 */
export async function querySittersPage(
  db: Db,
  params: SitterSearchParams,
): Promise<SitterSearchResult<SitterSearchItem>> {
  const today = todayIso();

  const profileRows = await db.select().from(profiles);
  const windowRows = await db
    .select()
    .from(sitterAvailability)
    .where(and(eq(sitterAvailability.status, "open"), gte(sitterAvailability.dateEnd, today)));

  const ratingRows = await db
    .select({
      sitterUserId: reviews.sitterUserId,
      sitterName: reviews.sitterName,
      avgRating: sql<number>`avg(${reviews.rating})`.mapWith(Number),
      reviewCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(reviews)
    .where(eq(reviews.authorRole, "owner"))
    .groupBy(reviews.sitterUserId, reviews.sitterName);

  const ratingsByUserId = new Map<string, { rating: number; reviews: number }>();
  const ratingsByName = new Map<string, { rating: number; reviews: number }>();
  for (const row of ratingRows) {
    const summary = {
      rating: Math.round((Number(row.avgRating) || 0) * 10) / 10,
      reviews: Number(row.reviewCount) || 0,
    };
    if (row.sitterUserId) ratingsByUserId.set(row.sitterUserId, summary);
    if (row.sitterName) ratingsByName.set(row.sitterName, summary);
  }

  const windowsByUserId = new Map<
    string,
    Array<{ dateStart: string; dateEnd: string; regions: string[] }>
  >();
  for (const win of windowRows) {
    const list = windowsByUserId.get(win.sitterUserId) ?? [];
    list.push({
      dateStart: win.dateStart,
      dateEnd: win.dateEnd,
      regions: win.regions ?? [],
    });
    windowsByUserId.set(win.sitterUserId, list);
  }

  const catalogue: SitterSearchItem[] = [];
  for (const profile of profileRows) {
    const openWindows = windowsByUserId.get(profile.userId) ?? [];
    const hasOpenAvailability = openWindows.length > 0;
    const isSitter =
      hasOpenAvailability ||
      profile.yearsExperience > 0 ||
      profile.completedSits > 0 ||
      (profile.preferredCountries?.length ?? 0) > 0;
    if (!isSitter) continue;

    const ratingSummary = ratingsByUserId.get(profile.userId) ??
      ratingsByName.get(profile.name) ?? {
        rating: 0,
        reviews: 0,
      };
    const availabilityRegions = [
      ...new Set(openWindows.flatMap((win) => win.regions).filter(Boolean)),
    ];
    const displayWindow = pickDisplayWindow(openWindows, params.from, params.to);

    catalogue.push({
      name: profile.name,
      image: profile.image,
      location: profile.location,
      bio: profile.bio,
      languages: profile.languages ?? [],
      preferredCountries: profile.preferredCountries ?? [],
      skills: profile.skills ?? [],
      certifications: profile.certifications ?? [],
      yearsExperience: profile.yearsExperience,
      completedSits: profile.completedSits,
      memberSince: profile.memberSince,
      rating: ratingSummary.rating,
      reviews: ratingSummary.reviews,
      availableFrom: displayWindow?.dateStart ?? null,
      availableTo: displayWindow?.dateEnd ?? null,
      availabilityRegions,
      openWindows,
      hasOpenAvailability,
    });
  }

  return paginateSitters(catalogue, params);
}
