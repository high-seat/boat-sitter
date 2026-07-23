import { zValidator } from "@hono/zod-validator";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { computeStartEarlySchedule } from "../../shared/sitSchedule";
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

function hasAcceptedApplicationSql() {
  return sql`exists (
    select 1 from applications
    where applications.sit_id = ${sits.id}
      and applications.status = 'accepted'
    limit 1
  )`;
}
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
  const rows = await db
    .select({
      sit: sits,
      accepted: sql<number>`case when ${hasAcceptedApplicationSql()} then 1 else 0 end`.mapWith(
        Number,
      ),
    })
    .from(sits);
  return c.json({
    data: rows.map(({ sit, accepted }) => {
      const { vesselId, ...rest } = sit;
      const isAccepted = Boolean(accepted);
      return {
        ...rest,
        boatId: vesselId,
        accepted: isAccepted,
        applicationsOpen: rest.published !== false && !isAccepted,
      };
    }),
  });
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

/**
 * Owner-only: move dateStart to today while keeping the original end date,
 * so an accepted sit becomes underway immediately.
 */
sitsRouter.post("/:id/start-early", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const id = c.req.param("id");

  const sit = await db.query.sits.findFirst({ where: eq(sits.id, id) });
  if (!sit) return c.json({ error: "Sit not found" }, 404);

  const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, sit.vesselId) });
  if (!vessel) return c.json({ error: "Vessel not found" }, 404);
  if (vessel.ownerUserId != null && vessel.ownerUserId !== user.id) {
    return c.json({ error: "You do not own this listing" }, 403);
  }
  if (vessel.ownerUserId == null && vessel.owner !== user.name) {
    return c.json({ error: "You do not own this listing" }, 403);
  }

  const accepted = await db
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.sitId, sit.id), eq(applications.status, "accepted")))
    .limit(1);
  if (!accepted.length) {
    return c.json({ error: "SIT_START_EARLY_NOT_ALLOWED" }, 400);
  }

  const schedule = computeStartEarlySchedule(sit.dateStart, sit.duration);
  if (!schedule) {
    return c.json({ error: "SIT_START_EARLY_NOT_ALLOWED" }, 400);
  }

  const [saved] = await db
    .update(sits)
    .set({
      dateStart: schedule.dateStart,
      duration: schedule.duration,
      dates: schedule.dates,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(sits.id, sit.id))
    .returning();

  const { vesselId, ...rest } = saved;
  return c.json({
    data: {
      ...rest,
      boatId: vesselId,
      accepted: true,
      applicationsOpen: false,
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
  if (vessel.ownerUserId != null && vessel.ownerUserId !== user.id) {
    return c.json({ error: "You do not own this vessel" }, 403);
  }
  if (vessel.ownerUserId == null) {
    if (vessel.owner !== user.name) {
      return c.json({ error: "You do not own this vessel" }, 403);
    }
    await db
      .update(vessels)
      .set({
        ownerUserId: user.id,
        owner: user.name,
        ownerImage: user.image ?? vessel.ownerImage,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(vessels.id, vessel.id));
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
  if (!vessel) return c.json({ error: "Vessel not found" }, 404);
  if (vessel.ownerUserId != null && vessel.ownerUserId !== user.id) {
    return c.json({ error: "You do not own this listing" }, 403);
  }
  if (vessel.ownerUserId == null && vessel.owner !== user.name) {
    return c.json({ error: "You do not own this listing" }, 403);
  }

  const [row] = await db.delete(sits).where(eq(sits.id, existing.id)).returning();
  return c.json({ data: { id: row.id, deleted: true } });
});
