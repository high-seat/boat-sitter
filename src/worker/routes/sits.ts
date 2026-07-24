import { zValidator } from "@hono/zod-validator";
import { and, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { computeStartEarlySchedule, isSitUnderway } from "../../shared/sitSchedule";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import {
  applicationMessages,
  applications,
  sits,
  sitterAvailability,
  user,
  vessels,
} from "../db/schema";
import { sendNotificationEmail } from "../email";
import { insertNotification, shouldEmail } from "../lib/notifications";
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
  const sessionUser = c.get("user");
  const rows = await db
    .select({
      sit: sits,
      ownerUserId: vessels.ownerUserId,
      accepted: sql<number>`case when ${hasAcceptedApplicationSql()} then 1 else 0 end`.mapWith(
        Number,
      ),
    })
    .from(sits)
    .innerJoin(vessels, eq(sits.vesselId, vessels.id));
  return c.json({
    data: rows.map(({ sit, ownerUserId, accepted }) => {
      const { vesselId, fullAddress, ...rest } = sit;
      const isAccepted = Boolean(accepted);
      const isOwner = Boolean(sessionUser && ownerUserId === sessionUser.id);
      return {
        ...rest,
        ...(isOwner && fullAddress?.trim() ? { fullAddress: fullAddress.trim() } : {}),
        boatId: vesselId,
        accepted: isAccepted,
        applicationsOpen: rest.published !== false && !isAccepted,
        cancelledAt: rest.cancelledAt ?? null,
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
  const fullAddress = sit.fullAddress?.trim() || vessel.fullAddress?.trim() || undefined;
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
      cancelledAt: rest.cancelledAt ?? null,
    },
  });
});

/**
 * Owner-only: cancel an underway sit.
 * - Default: end the sit entirely (cancelled, closed, sitter notified).
 * - reopenApplications: unaccept the sitter and reopen for new applicants.
 */
sitsRouter.post(
  "/:id/cancel",
  requireUser,
  zValidator(
    "json",
    z.object({
      reopenApplications: z.boolean().optional().default(false),
    }),
  ),
  async (c) => {
    const db = getDb(c.env);
    const sessionUser = c.get("user")!;
    const id = c.req.param("id");
    const { reopenApplications } = c.req.valid("json");

    const sit = await db.query.sits.findFirst({ where: eq(sits.id, id) });
    if (!sit) return c.json({ error: "Sit not found" }, 404);

    const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, sit.vesselId) });
    if (!vessel) return c.json({ error: "Vessel not found" }, 404);
    if (vessel.ownerUserId != null && vessel.ownerUserId !== sessionUser.id) {
      return c.json({ error: "You do not own this listing" }, 403);
    }
    if (vessel.ownerUserId == null && vessel.owner !== sessionUser.name) {
      return c.json({ error: "You do not own this listing" }, 403);
    }

    if (sit.cancelledAt) {
      return c.json({ error: "SIT_CANCEL_NOT_ALLOWED" }, 400);
    }

    const acceptedApps = await db
      .select()
      .from(applications)
      .where(and(eq(applications.sitId, sit.id), eq(applications.status, "accepted")));
    if (!acceptedApps.length) {
      return c.json({ error: "SIT_CANCEL_NOT_ALLOWED" }, 400);
    }

    if (
      !isSitUnderway({
        dateStart: sit.dateStart,
        duration: sit.duration,
        accepted: true,
        cancelledAt: sit.cancelledAt,
      })
    ) {
      return c.json({ error: "SIT_CANCEL_NOT_ALLOWED" }, 400);
    }

    const nowIso = new Date().toISOString();

    if (reopenApplications) {
      const [saved] = await db
        .update(sits)
        .set({
          published: true,
          cancelledAt: null,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(sits.id, sit.id))
        .returning();

      for (const app of acceptedApps) {
        await db
          .update(applications)
          .set({ status: "new", ownerPhone: null })
          .where(eq(applications.id, app.id));

        await db.insert(applicationMessages).values({
          id: `message-unaccepted-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          applicationId: app.id,
          senderName: sessionUser.name,
          text: `${sessionUser.name} unaccepted this application`,
          kind: "system",
          systemKind: "unaccepted",
          payload: null,
          createdAt: nowIso,
        });
        if (app.applicantUserId || app.applicantName) {
          await insertNotification(db, {
            userId: app.applicantUserId,
            userName: app.applicantName,
            type: "applicationUnaccepted",
            actor: sessionUser.name,
            boatName: app.boatName,
            href: `/messages?application=${app.id}`,
          });
        }
        if (await shouldEmail(db, app.applicantUserId, "applicationUnaccepted")) {
          const applicantEmail = app.applicantUserId
            ? (await db.query.user.findFirst({ where: eq(user.id, app.applicantUserId) }))?.email
            : undefined;
          await sendNotificationEmail(c.env, {
            subject: `Update on your sit for ${app.boatName}`,
            heading: "Sit update",
            body: `${sessionUser.name} is no longer confirming you for ${app.boatName}. The owner has reopened the sit for other applicants.`,
            actionUrl: `${c.env.BETTER_AUTH_URL}/messages?application=${app.id}`,
            actionLabel: "View conversation",
            to: applicantEmail,
          });
        }
      }

      const { vesselId, ...rest } = saved;
      return c.json({
        data: {
          ...rest,
          boatId: vesselId,
          accepted: false,
          applicationsOpen: true,
          cancelledAt: null,
        },
      });
    }

    const [saved] = await db
      .update(sits)
      .set({
        cancelledAt: nowIso,
        published: false,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(sits.id, sit.id))
      .returning();

    for (const app of acceptedApps) {
      await db.insert(applicationMessages).values({
        id: `message-sitCancelled-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        applicationId: app.id,
        senderName: sessionUser.name,
        text: `${sessionUser.name} cancelled this sit`,
        kind: "system",
        systemKind: "sitCancelled",
        payload: null,
        createdAt: nowIso,
      });
      if (app.applicantUserId || app.applicantName) {
        await insertNotification(db, {
          userId: app.applicantUserId,
          userName: app.applicantName,
          type: "sitCancelled",
          actor: sessionUser.name,
          boatName: app.boatName,
          href: `/messages?application=${app.id}`,
        });
      }
      if (await shouldEmail(db, app.applicantUserId, "sitCancelled")) {
        const applicantEmail = app.applicantUserId
          ? (await db.query.user.findFirst({ where: eq(user.id, app.applicantUserId) }))?.email
          : undefined;
        await sendNotificationEmail(c.env, {
          subject: `Sit cancelled: ${app.boatName}`,
          heading: "Sit cancelled",
          body: `${sessionUser.name} cancelled the sit for ${app.boatName}. You can still open the conversation for any follow-up.`,
          actionUrl: `${c.env.BETTER_AUTH_URL}/messages?application=${app.id}`,
          actionLabel: "View conversation",
          to: applicantEmail,
        });
      }
    }

    const { vesselId, ...rest } = saved;
    return c.json({
      data: {
        ...rest,
        boatId: vesselId,
        accepted: true,
        applicationsOpen: false,
        cancelledAt: rest.cancelledAt ?? nowIso,
      },
    });
  },
);

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

  // PUT is an upsert; only a genuinely new row should fan out match alerts.
  const existed = await db.query.sits.findFirst({ where: eq(sits.id, body.id) });

  const row = toRow(body);
  const [saved] = await db
    .insert(sits)
    .values(row)
    .onConflictDoUpdate({ target: sits.id, set: { ...row, updatedAt: sql`CURRENT_TIMESTAMP` } })
    .returning();

  if (!existed && saved.published) {
    await notifyMatchingSitters(c.env, saved, vessel.name, {
      userId: vessel.ownerUserId ?? user.id,
      name: user.name,
      email: user.email,
    }).catch((err) => {
      // Best-effort: a notification failure must never fail the sit write.
      console.error("availability match notify failed:", err);
    });
  }

  const { vesselId, ...rest } = saved;
  return c.json({ data: { ...rest, boatId: vesselId } });
});

/** Add whole days to a YYYY-MM-DD date, returning YYYY-MM-DD (UTC-safe). */
function addNights(dateStart: string, nights: number): string {
  const d = new Date(`${dateStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + nights);
  return d.toISOString().slice(0, 10);
}

/**
 * When a new published sit appears:
 *  - alert every sitter whose open availability window overlaps its dates and
 *    covers its region (or is open to anywhere), and
 *  - send the owner one summary alert ("N sitters are available").
 * Mirrors the /api/availability matching predicate, run at creation time.
 */
async function notifyMatchingSitters(
  env: Env,
  sit: typeof sits.$inferSelect,
  vesselName: string,
  owner: { userId: string | null; name: string; email?: string | null },
) {
  const db = getDb(env);
  const today = new Date().toISOString().slice(0, 10);
  const nights = Number.parseInt(sit.duration, 10);
  const sitEnd = addNights(sit.dateStart, Number.isFinite(nights) && nights > 0 ? nights : 0);
  const country = sit.country.toLowerCase();

  const windows = await db
    .select()
    .from(sitterAvailability)
    .where(and(eq(sitterAvailability.status, "open"), gte(sitterAvailability.dateEnd, today)));

  const matches = windows.filter(
    (w) =>
      w.dateStart <= sitEnd &&
      w.dateEnd >= sit.dateStart &&
      (w.regions.length === 0 || w.regions.some((r) => r.toLowerCase() === country)),
  );

  const baseUrl = env.BETTER_AUTH_URL ?? "";
  for (const w of matches) {
    await insertNotification(db, {
      userId: w.sitterUserId,
      userName: w.sitterName,
      type: "availabilityMatch",
      actor: vesselName,
      boatName: vesselName,
      href: `/boats/${sit.id}`,
    });

    if (await shouldEmail(db, w.sitterUserId, "availabilityMatch")) {
      const u = await db.query.user.findFirst({ where: eq(user.id, w.sitterUserId) });
      await sendNotificationEmail(env, {
        subject: `A new sit matches your availability: ${vesselName}`,
        heading: "A boat needs a sitter during your free dates",
        body: `${vesselName} in ${sit.location}, ${sit.country} (${sit.dates}) matches an availability window you published. Take a look and apply if it suits.`,
        actionUrl: `${baseUrl}/boats/${sit.id}`,
        actionLabel: "View the sit",
        to: u?.email ?? undefined,
      });
    }
  }

  // Owner summary: one alert with the count of available sitters.
  if (matches.length > 0) {
    await insertNotification(db, {
      userId: owner.userId,
      userName: owner.name,
      type: "sitSittersFound",
      actor: String(matches.length),
      boatName: vesselName,
      href: `/boats/${sit.id}`,
    });

    if (await shouldEmail(db, owner.userId, "sitSittersFound")) {
      await sendNotificationEmail(env, {
        subject: `${matches.length} sitters are available for ${vesselName}`,
        heading: "Sitters are free for your new sit",
        body: `${matches.length} sitter(s) have published availability that fits ${vesselName} (${sit.dates}).`,
        actionUrl: `${baseUrl}/boats/${sit.id}`,
        actionLabel: "View the sit",
        to: owner.email ?? undefined,
      });
    }
  }
}

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
