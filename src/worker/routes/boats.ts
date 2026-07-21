import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getDb } from "../db";
import { sits, vessels } from "../db/schema";
import { joinBoat } from "../lib/join";

/**
 * Public browse/detail. Returns vessel ⋈ sit as the frontend `Boat`.
 *
 * The frontend does its own filtering/sorting/pagination client-side over the
 * full list, so these endpoints stay simple: return every published listing,
 * joined. (If the catalogue grows large, push filters down to SQL — the
 * indexes on sits are already in place.)
 */
export const boatsRouter = new Hono<{ Bindings: Env }>();

boatsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const rows = await db
    .select({ vessel: vessels, sit: sits })
    .from(sits)
    .innerJoin(vessels, eq(sits.vesselId, vessels.id))
    .where(eq(sits.published, true));

  return c.json({ data: rows.map((r) => joinBoat(r.vessel, r.sit)) });
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
