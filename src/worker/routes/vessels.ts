import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { sits, vessels } from "../db/schema";
import { requireUser } from "../middleware/auth";

/**
 * Owner-managed vessels (the boats themselves).
 *
 * Writes require a logged-in user. A vessel is owned by the user who created it
 * (`ownerUserId`); only that user may update or delete it. Seed/legacy rows have
 * a null owner and are therefore read-only through the API.
 */
export const vesselsRouter = new Hono<AppEnv>();

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
vesselsRouter.put("/:id", requireUser, zValidator("json", vesselSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  if (body.id !== id) return c.json({ error: "Body id does not match URL" }, 400);

  const db = getDb(c.env);
  const user = c.get("user")!;

  const existing = await db.query.vessels.findFirst({ where: eq(vessels.id, id) });
  if (existing && existing.ownerUserId !== user.id) {
    // Either someone else's vessel, or a null-owner seed row: not yours to edit.
    return c.json({ error: "You do not own this vessel" }, 403);
  }

  // Owner display fields come from the session, not the client, so they can't
  // be spoofed. ownerUserId is stamped on create and preserved on update.
  const values = {
    ...body,
    owner: user.name,
    ownerImage: user.image ?? body.ownerImage,
    ownerUserId: user.id,
  };

  const [row] = await db
    .insert(vessels)
    .values(values)
    .onConflictDoUpdate({
      target: vessels.id,
      set: { ...values, updatedAt: sql`CURRENT_TIMESTAMP` },
    })
    .returning();

  return c.json({ data: row });
});

vesselsRouter.delete("/:id", requireUser, async (c) => {
  const db = getDb(c.env);
  const id = c.req.param("id");
  const user = c.get("user")!;

  const existing = await db.query.vessels.findFirst({ where: eq(vessels.id, id) });
  if (!existing) return c.json({ error: "Vessel not found" }, 404);
  if (existing.ownerUserId !== user.id) {
    return c.json({ error: "You do not own this vessel" }, 403);
  }

  const dependent = await db.query.sits.findFirst({ where: eq(sits.vesselId, id) });
  if (dependent) return c.json({ error: "VESSEL_HAS_SITS" }, 409);

  const [row] = await db.delete(vessels).where(eq(vessels.id, id)).returning();
  return c.json({ data: { id: row.id, deleted: true } });
});
