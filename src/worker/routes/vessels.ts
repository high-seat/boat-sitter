import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db";
import { sits, vessels } from "../db/schema";

/**
 * Owner-managed vessels (the boats themselves).
 *
 * SECURITY (staged): these write endpoints currently trust the `owner` in the
 * payload — there is no per-user auth yet. The auth stage (see AUTH.md) must
 * derive the acting user from a session and enforce that they own the vessel.
 * Do not treat this as production-ready authorization.
 */
export const vesselsRouter = new Hono<{ Bindings: Env }>();

const vesselSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1),
  type: z.string().min(1),
  length: z.string().min(1),
  homePort: z.string().min(1),
  image: z.string().min(1),
  gallery: z.array(z.string()).default([]),
  owner: z.string().min(1),
  ownerImage: z.string().min(1),
  rating: z.number().min(0).max(5).default(0),
  reviews: z.number().int().min(0).default(0),
  description: z.string().default(""),
  home: z.string().default(""),
  systems: z.array(z.string()).default([]),
  engineType: z.string().default("Not specified"),
  voltageType: z.string().default("Not specified"),
  stoveFuelType: z.string().default("Not specified"),
  amenities: z.array(z.string()).default([]),
});

vesselsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const owner = c.req.query("owner");
  const rows = owner
    ? await db.select().from(vessels).where(eq(vessels.owner, owner))
    : await db.select().from(vessels);
  return c.json({ data: rows });
});

vesselsRouter.get("/:id", async (c) => {
  const db = getDb(c.env);
  const row = await db.query.vessels.findFirst({ where: eq(vessels.id, c.req.param("id")) });
  if (!row) return c.json({ error: "Vessel not found" }, 404);
  return c.json({ data: row });
});

/** PUT = upsert, matching the frontend's saveVessel (create or update). */
vesselsRouter.put("/:id", zValidator("json", vesselSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  if (body.id !== id) return c.json({ error: "Body id does not match URL" }, 400);

  const db = getDb(c.env);
  const [row] = await db
    .insert(vessels)
    .values(body)
    .onConflictDoUpdate({
      target: vessels.id,
      set: { ...body, updatedAt: sql`CURRENT_TIMESTAMP` },
    })
    .returning();

  return c.json({ data: row });
});

vesselsRouter.delete("/:id", async (c) => {
  const db = getDb(c.env);
  const id = c.req.param("id");

  const dependent = await db.query.sits.findFirst({ where: eq(sits.vesselId, id) });
  if (dependent) return c.json({ error: "VESSEL_HAS_SITS" }, 409);

  const [row] = await db.delete(vessels).where(eq(vessels.id, id)).returning();
  if (!row) return c.json({ error: "Vessel not found" }, 404);
  return c.json({ data: { id: row.id, deleted: true } });
});
