import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../db";
import { worldPlaces } from "../db/schema";
import { parseDestinationSearchParams } from "../../shared/destinationsSearch";
import {
  TOP_BOAT_SITTING_PORT_CITIES,
  TOP_BOAT_SITTING_PORT_CITY_LIMIT,
} from "../../shared/popularPortCities";

/**
 * Public destination gazetteer search for city/country autocomplete.
 * Backed by `world_places` (countries + GeoNames cities15000 + curated marina towns).
 */
export const destinationsRouter = new Hono<{ Bindings: Env }>();

destinationsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const params = parseDestinationSearchParams(c.req.query());
  const limit = params.limit ?? 8;
  const query = (params.q ?? "").trim().toLowerCase();

  let kindFilter;
  if (params.kind === "city") kindFilter = eq(worldPlaces.kind, "city");
  else if (params.kind === "country") kindFilter = eq(worldPlaces.kind, "country");

  if (!query) {
    // Destination / city fields: top port cities for the boat-sitting market.
    if (params.kind !== "country") {
      const portCityMatch = or(
        ...TOP_BOAT_SITTING_PORT_CITIES.map((city) =>
          and(
            eq(worldPlaces.kind, "city"),
            eq(worldPlaces.nameLower, city.name.toLowerCase()),
            eq(worldPlaces.countryName, city.countryName),
          ),
        ),
      )!;
      const portRows = await db.select().from(worldPlaces).where(portCityMatch);
      const byKey = new Map(
        portRows.map((row) => [`${row.nameLower}|${row.countryName}`, row] as const),
      );
      const ordered = TOP_BOAT_SITTING_PORT_CITIES.map((city) =>
        byKey.get(`${city.name.toLowerCase()}|${city.countryName}`),
      ).filter((row): row is NonNullable<typeof row> => Boolean(row));

      return c.json({
        data: ordered
          .slice(0, Math.min(limit, TOP_BOAT_SITTING_PORT_CITY_LIMIT))
          .map(shapeDestination),
      });
    }

    const popular = await db
      .select()
      .from(worldPlaces)
      .where(and(eq(worldPlaces.popular, true), eq(worldPlaces.kind, "country")))
      .orderBy(asc(worldPlaces.name))
      .limit(limit);

    return c.json({
      data: popular.map(shapeDestination),
    });
  }

  const pattern = `%${query}%`;
  const prefix = `${query}%`;
  const matchExpr = or(
    like(worldPlaces.nameLower, pattern),
    and(eq(worldPlaces.kind, "city"), sql`lower(${worldPlaces.countryName}) LIKE ${pattern}`),
  )!;

  const where = kindFilter ? and(kindFilter, matchExpr) : matchExpr;

  const rows = await db
    .select()
    .from(worldPlaces)
    .where(where)
    .orderBy(
      // Countries first, then cities; within each, prefix matches, population, name.
      sql`CASE WHEN ${worldPlaces.kind} = 'country' THEN 0 ELSE 1 END`,
      sql`CASE WHEN ${worldPlaces.nameLower} LIKE ${prefix} THEN 0 ELSE 1 END`,
      desc(worldPlaces.population),
      asc(worldPlaces.name),
    )
    .limit(limit);

  return c.json({
    data: rows.map(shapeDestination),
  });
});

function shapeDestination(row: typeof worldPlaces.$inferSelect) {
  return {
    name: row.name,
    detail: row.kind === "city" ? row.countryName : "Country",
    kind: row.kind === "city" ? ("City" as const) : ("Country" as const),
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    countryCode: row.countryCode || undefined,
  };
}
