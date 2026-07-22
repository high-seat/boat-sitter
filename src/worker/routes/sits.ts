import { zValidator } from "@hono/zod-validator";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { applications, sits, vessels } from "../db/schema";
import { requireUser } from "../middleware/auth";

/**
 * Owner-managed sits (the listing periods for a vessel).
 * Writes require login; a sit may only be created/edited/deleted by the owner
 * of its vessel (`vessels.ownerUserId`).
 */
export const sitsRouter = new Hono<AppEnv>();

const sitSchema = z.object({
  id: z.string().min(1).max(120),
  boatId: z.string().min(1), // frontend name for vesselId
  dates: z.string().min(1),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.string().min(1),
  location: z.string().min(1),
  country: z.string().min(1),
  fullAddress: z.string().optional(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  minYearsExperience: z.number().int().min(0).nullish(),
  requiredExperience: z.array(z.string()).default([]),
  requiredCertifications: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  applicants: z.number().int().min(0).default(0),
  pet: z.string().nullish(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sitType: z.enum(["liveaboard", "daytimeChecks"]).default("liveaboard"),
});

/** Map the frontend Sit shape (boatId) to the DB row (vesselId). */
function toRow(body: z.infer<typeof sitSchema>) {
  const { boatId, ...rest } = body;
  return { ...rest, vesselId: boatId };
}

sitsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const rows = await db.select().from(sits);
  return c.json({ data: rows.map(({ vesselId, ...s }) => ({ ...s, boatId: vesselId })) });
});

/**
 * Private marina/Wi-Fi details for the sit's vessel — owner or accepted sitter only.
 */
sitsRouter.get("/:id/access", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const sit = await db.query.sits.findFirst({ where: eq(sits.id, c.req.param("id")) });
  if (!sit) return c.json({ error: "Sit not found" }, 404);

  const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, sit.vesselId) });
  if (!vessel) return c.json({ error: "Vessel not found" }, 404);

  const isOwner = vessel.ownerUserId === user.id;
  if (!isOwner) {
    const mine = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.sitId, sit.id),
          eq(applications.applicantUserId, user.id),
          eq(applications.status, "accepted"),
        ),
      )
      .limit(1);
    if (!mine.length) return c.json({ error: "Forbidden" }, 403);
  }

  const privateAccess = vessel.privateAccess ?? undefined;
  const fullAddress = sit.fullAddress?.trim() || undefined;
  if (!privateAccess && !fullAddress) {
    return c.json({ data: null });
  }
  return c.json({
    data: {
      ...(privateAccess ?? {}),
      ...(fullAddress ? { fullAddress } : {}),
    },
  });
});

sitsRouter.put("/:id", requireUser, zValidator("json", sitSchema), async (c) => {
  const id = c.req.param("id");
  const body = c.req.valid("json");
  if (body.id !== id) return c.json({ error: "Body id does not match URL" }, 400);

  const db = getDb(c.env);
  const user = c.get("user")!;

  const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, body.boatId) });
  if (!vessel) return c.json({ error: "Referenced vessel does not exist" }, 400);
  if (vessel.ownerUserId !== user.id) {
    return c.json({ error: "You do not own this vessel" }, 403);
  }

  const row = toRow(body);
  const [saved] = await db
    .insert(sits)
    .values(row)
    .onConflictDoUpdate({ target: sits.id, set: { ...row, updatedAt: sql`CURRENT_TIMESTAMP` } })
    .returning();

  const { vesselId, ...rest } = saved;
  return c.json({ data: { ...rest, boatId: vesselId } });
});

sitsRouter.delete("/:id", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;

  const existing = await db.query.sits.findFirst({ where: eq(sits.id, c.req.param("id")) });
  if (!existing) return c.json({ error: "Sit not found" }, 404);

  const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, existing.vesselId) });
  if (vessel?.ownerUserId !== user.id) {
    return c.json({ error: "You do not own this listing" }, 403);
  }

  const [row] = await db.delete(sits).where(eq(sits.id, existing.id)).returning();
  return c.json({ data: { id: row.id, deleted: true } });
});
