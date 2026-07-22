import { and, asc, count, desc, eq, like, ne, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db";
import { sits, vessels } from "../db/schema";
import { joinBoat } from "./join";
import type { BoatSearchParams, BoatSearchResult } from "../../shared/boatsSearch";

/**
 * Push boat-search filters / sort / pagination into D1 SQL so the Worker does
 * not load the full catalogue on every request.
 */

function hasAcceptedApplicationSql() {
  return sql`exists (
    select 1 from applications
    where applications.sit_id = ${sits.id}
      and applications.status = 'accepted'
    limit 1
  )`;
}

function buildWhere(params: BoatSearchParams): SQL | undefined {
  const parts: SQL[] = [eq(sits.published, true)];

  const searchValues = (params.q ?? "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
  if (searchValues.length) {
    const perTerm = searchValues.map((term) => {
      const pattern = `%${term}%`;
      return or(
        like(sits.location, pattern),
        like(sits.country, pattern),
        like(vessels.name, pattern),
        like(vessels.homePort, pattern),
      )!;
    });
    parts.push(or(...perTerm)!);
  }

  if (params.type && params.type !== "All vessels") {
    parts.push(eq(vessels.type, params.type));
  }

  if (params.sitType && params.sitType !== "all") {
    parts.push(eq(sits.sitType, params.sitType));
  }

  if (params.pet) {
    parts.push(and(sql`${sits.pet} is not null`, ne(sits.pet, ""))!);
  }

  // Date overlap: boatEnd >= from AND boatStart <= to.
  // boatEnd ≈ date(date_start, '+N days') where N is CAST(duration AS INTEGER).
  if (params.from) {
    parts.push(
      sql`date(${sits.dateStart}, '+' || CAST(${sits.duration} AS INTEGER) || ' days') >= ${params.from}`,
    );
  }
  if (params.to) {
    parts.push(sql`${sits.dateStart} <= ${params.to}`);
  }

  if (params.availability === "accepted") {
    parts.push(hasAcceptedApplicationSql());
  } else if (params.availability === "open") {
    parts.push(sql`not (${hasAcceptedApplicationSql()})`);
  }

  return and(...parts);
}

function buildOrderBy(sort: BoatSearchParams["sort"]) {
  switch (sort) {
    case "latest":
      return [desc(sits.dateStart), asc(sits.id)];
    case "shortest":
      return [asc(sql`CAST(${sits.duration} AS INTEGER)`), asc(sits.dateStart)];
    case "longest":
      return [desc(sql`CAST(${sits.duration} AS INTEGER)`), asc(sits.dateStart)];
    case "popular":
      return [
        desc(sits.applicants),
        desc(vessels.rating),
        desc(vessels.reviews),
        asc(sits.dateStart),
      ];
    case "soonest":
      return [asc(sits.dateStart), asc(sits.id)];
    case "recommended":
    default:
      return [desc(sits.featured), desc(vessels.rating), asc(sits.dateStart), asc(sits.applicants)];
  }
}

export async function queryBoatsPage(
  db: Db,
  params: BoatSearchParams,
): Promise<
  BoatSearchResult<ReturnType<typeof joinBoat> & { accepted: boolean; applicationsOpen: boolean }>
> {
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort ?? "recommended");

  const [{ total }] = await db
    .select({ total: count() })
    .from(sits)
    .innerJoin(vessels, eq(sits.vesselId, vessels.id))
    .where(where);

  const totalCount = Number(total) || 0;
  const limitRaw = params.limit;
  const returnAll = limitRaw == null || limitRaw <= 0;
  const limit = returnAll
    ? Math.max(totalCount, 1)
    : Math.min(50, Math.max(1, Math.floor(limitRaw)));
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const page = returnAll ? 0 : Math.min(Math.max(0, Math.floor(params.page ?? 0)), totalPages - 1);
  const offset = returnAll ? 0 : page * limit;

  if (totalCount === 0) {
    return { items: [], total: 0, page: 0, limit: returnAll ? 1 : limit, totalPages: 1 };
  }

  const rows = await db
    .select({
      vessel: vessels,
      sit: sits,
      accepted: sql<number>`case when ${hasAcceptedApplicationSql()} then 1 else 0 end`.mapWith(
        Number,
      ),
    })
    .from(sits)
    .innerJoin(vessels, eq(sits.vesselId, vessels.id))
    .where(where)
    .orderBy(...orderBy)
    .limit(returnAll ? totalCount : limit)
    .offset(offset);

  const items = rows.map((r) => {
    const accepted = Boolean(r.accepted);
    return {
      ...joinBoat(r.vessel, r.sit),
      accepted,
      applicationsOpen: r.sit.published && !accepted,
    };
  });

  return {
    items,
    total: totalCount,
    page,
    limit: returnAll ? totalCount || 1 : limit,
    totalPages: returnAll ? 1 : totalPages,
  };
}
