import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { parseSittersSearchParams, type SitterSearchParams } from "../../shared/sittersSearch";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { applications, sits, vessels } from "../db/schema";
import { querySittersPage } from "../lib/sittersQuery";

/**
 * Public sitter browse. Returns profiles enriched with availability + ratings.
 *
 * List filters / sort / pagination: `q`, `from`, `to`, `language`, `minYears`,
 * `minCompletedSits`, `minRating`, `certified`, `availableOnly`,
 * `matchesMySits`, `sort`, `page`, `limit`.
 */
export const sittersRouter = new Hono<AppEnv>();

/** Open sits the session owner is accepting applications for. */
async function ownerOpenSitsForMatch(
  env: Env,
  user: { id: string; name: string },
): Promise<NonNullable<SitterSearchParams["matchOwnerSits"]>> {
  const db = getDb(env);
  const owned = await db
    .select({ id: vessels.id })
    .from(vessels)
    .where(
      or(
        eq(vessels.ownerUserId, user.id),
        and(isNull(vessels.ownerUserId), eq(vessels.owner, user.name)),
      ),
    );
  const boatIds = owned.map((row) => row.id);
  if (!boatIds.length) return [];

  const sitRows = await db
    .select()
    .from(sits)
    .where(and(inArray(sits.vesselId, boatIds), eq(sits.published, true)));

  if (!sitRows.length) return [];

  const accepted = await db
    .select({ sitId: applications.sitId })
    .from(applications)
    .where(
      and(
        inArray(
          applications.sitId,
          sitRows.map((row) => row.id),
        ),
        eq(applications.status, "accepted"),
      ),
    );
  const acceptedIds = new Set(accepted.map((row) => row.sitId));

  return sitRows
    .filter((row) => !acceptedIds.has(row.id))
    .map((row) => ({
      dateStart: row.dateStart,
      duration: row.duration,
      country: row.country,
      location: row.location,
    }));
}

sittersRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const params = parseSittersSearchParams(c.req.query());
  const user = c.get("user");

  let matchOwnerSits: SitterSearchParams["matchOwnerSits"];
  if (params.matchesMySits) {
    matchOwnerSits = user ? await ownerOpenSitsForMatch(c.env, user) : [];
  }

  const result = await querySittersPage(db, {
    ...params,
    ...(matchOwnerSits != null ? { matchOwnerSits } : {}),
  });

  return c.json({
    data: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});
