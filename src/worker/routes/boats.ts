import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../db";
import { sits, vessels } from "../db/schema";
import { joinBoat } from "../lib/join";
import { queryBoatsPage } from "../lib/boatsQuery";
import { parseBoatsSearchParams } from "../../shared/boatsSearch";

/**
 * Public browse/detail. Returns vessel ⋈ sit as the frontend `Boat`.
 *
 * List filters / sort / pagination are applied in D1 SQL
 * (`q`, `type`, `sitType`, `from`, `to`, `pet`, `availability`, `sort`,
 * `page`, `limit`). Omit `limit` (or set it ≤ 0) for the full match set.
 */
export const boatsRouter = new Hono<{ Bindings: Env }>();

boatsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const params = parseBoatsSearchParams(c.req.query());
  const result = await queryBoatsPage(db, params);

  return c.json({
    data: result.items,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

boatsRouter.get("/:id", async (c) => {
  const db = getDb(c.env);
  const row = await db
    .select({ vessel: vessels, sit: sits })
    .from(sits)
    .innerJoin(vessels, eq(sits.vesselId, vessels.id))
    .where(and(eq(sits.id, c.req.param("id")), eq(sits.published, true)))
    .limit(1);

  if (!row.length) return c.json({ error: "Boat not found" }, 404);
  return c.json({ data: joinBoat(row[0].vessel, row[0].sit) });
});
