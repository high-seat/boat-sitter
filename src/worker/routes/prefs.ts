import { zValidator } from "@hono/zod-validator";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import {
  sits,
  userArchivedConversations,
  userArchivedSits,
  userBlocks,
  userReports,
  userSaved,
  vessels,
} from "../db/schema";
import { joinBoat } from "../lib/join";
import { requireUser } from "../middleware/auth";

/**
 * Per-user saved sits, conversation/sit archives, block list, and reports.
 */
export const prefsRouter = new Hono<AppEnv>();

function hasAcceptedApplicationSql() {
  return sql`exists (
    select 1 from applications
    where applications.sit_id = ${sits.id}
      and applications.status = 'accepted'
    limit 1
  )`;
}

prefsRouter.get("/", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;

  const [savedRows, archivedConvRows, archivedSitRows, blockRows, reportRows] = await Promise.all([
    db.select().from(userSaved).where(eq(userSaved.userId, user.id)),
    db.select().from(userArchivedConversations).where(eq(userArchivedConversations.userId, user.id)),
    db.select().from(userArchivedSits).where(eq(userArchivedSits.userId, user.id)),
    db.select().from(userBlocks).where(eq(userBlocks.userId, user.id)),
    db.select().from(userReports).where(eq(userReports.reporterUserId, user.id)),
  ]);

  return c.json({
    data: {
      saved: [...new Set(savedRows.map((r) => r.sitId))],
      archivedConversations: [...new Set(archivedConvRows.map((r) => r.applicationId))],
      archivedSits: [...new Set(archivedSitRows.map((r) => r.sitId))],
      blockedUsers: blockRows.map((r) => ({
        name: r.blockedName,
        image: r.blockedImage,
        blockedAt: r.blockedAt,
      })),
      userReports: reportRows.map((r) => ({
        id: r.id,
        targetName: r.targetName,
        reason: r.reason,
        details: r.details,
        createdAt: r.createdAt,
        escalated: r.escalated || undefined,
        applicationId: r.applicationId ?? undefined,
        boatName: r.boatName ?? undefined,
        messageId: r.messageId ?? undefined,
        messageText: r.messageText ?? undefined,
        messageCreatedAt: r.messageCreatedAt ?? undefined,
      })),
    },
  });
});

/**
 * Full listings for the signed-in user's saved sits.
 * `availability=open` (default) omits sits that already have a sitter chosen.
 * `availability=all` includes accepted / completed / unpublished saved sits.
 */
prefsRouter.get("/saved/listings", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const availability = c.req.query("availability") === "all" ? "all" : "open";

  const savedRows = await db.select().from(userSaved).where(eq(userSaved.userId, user.id));
  const sitIds = [...new Set(savedRows.map((row) => row.sitId))];
  if (sitIds.length === 0) {
    return c.json({ data: [], availability });
  }

  const acceptedSql = hasAcceptedApplicationSql();
  const where =
    availability === "all"
      ? inArray(sits.id, sitIds)
      : and(inArray(sits.id, sitIds), eq(sits.published, true), sql`not (${acceptedSql})`);

  const rows = await db
    .select({
      vessel: vessels,
      sit: sits,
      accepted: sql<number>`case when ${acceptedSql} then 1 else 0 end`.mapWith(Number),
    })
    .from(sits)
    .innerJoin(vessels, eq(sits.vesselId, vessels.id))
    .where(where)
    .orderBy(asc(sits.dateStart), asc(sits.id));

  const byId = new Map(rows.map((row) => [row.sit.id, row]));
  // Preserve the user's save order when possible.
  const ordered = sitIds
    .map((id) => byId.get(id))
    .filter((row): row is (typeof rows)[number] => Boolean(row));

  return c.json({
    data: ordered.map((row) => {
      const accepted = Boolean(row.accepted);
      return {
        ...joinBoat(row.vessel, row.sit),
        accepted,
        applicationsOpen: row.sit.published && !accepted,
      };
    }),
    availability,
  });
});

prefsRouter.put("/saved/:sitId", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const sitId = c.req.param("sitId");
  await db
    .delete(userSaved)
    .where(and(eq(userSaved.userId, user.id), eq(userSaved.sitId, sitId)));
  await db.insert(userSaved).values({ userId: user.id, sitId });
  return c.json({ data: { saved: true, sitId } });
});

prefsRouter.delete("/saved/:sitId", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const sitId = c.req.param("sitId");
  await db
    .delete(userSaved)
    .where(and(eq(userSaved.userId, user.id), eq(userSaved.sitId, sitId)));
  return c.json({ data: { saved: false, sitId } });
});

prefsRouter.put("/archived-conversations/:id", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const applicationId = c.req.param("id");
  await db
    .delete(userArchivedConversations)
    .where(
      and(
        eq(userArchivedConversations.userId, user.id),
        eq(userArchivedConversations.applicationId, applicationId),
      ),
    );
  await db.insert(userArchivedConversations).values({ userId: user.id, applicationId });
  return c.json({ data: { archived: true, applicationId } });
});

prefsRouter.delete("/archived-conversations/:id", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const applicationId = c.req.param("id");
  await db
    .delete(userArchivedConversations)
    .where(
      and(
        eq(userArchivedConversations.userId, user.id),
        eq(userArchivedConversations.applicationId, applicationId),
      ),
    );
  return c.json({ data: { archived: false, applicationId } });
});

prefsRouter.put("/archived-sits/:sitId", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const sitId = c.req.param("sitId");
  await db
    .delete(userArchivedSits)
    .where(and(eq(userArchivedSits.userId, user.id), eq(userArchivedSits.sitId, sitId)));
  await db.insert(userArchivedSits).values({ userId: user.id, sitId });
  return c.json({ data: { archived: true, sitId } });
});

prefsRouter.delete("/archived-sits/:sitId", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const sitId = c.req.param("sitId");
  await db
    .delete(userArchivedSits)
    .where(and(eq(userArchivedSits.userId, user.id), eq(userArchivedSits.sitId, sitId)));
  return c.json({ data: { archived: false, sitId } });
});

const blockSchema = z.object({
  name: z.string().min(1),
  image: z.string().default(""),
});

prefsRouter.post("/blocks", requireUser, zValidator("json", blockSchema), async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const body = c.req.valid("json");
  const existing = await db
    .select()
    .from(userBlocks)
    .where(and(eq(userBlocks.userId, user.id), eq(userBlocks.blockedName, body.name)))
    .limit(1);
  if (existing.length) {
    return c.json({
      data: {
        name: existing[0].blockedName,
        image: existing[0].blockedImage,
        blockedAt: existing[0].blockedAt,
      },
    });
  }
  const blockedAt = new Date().toISOString();
  const id = `block-${user.id}-${Date.now()}`;
  await db.insert(userBlocks).values({
    id,
    userId: user.id,
    blockedName: body.name,
    blockedImage: body.image,
    blockedAt,
  });
  return c.json({ data: { name: body.name, image: body.image, blockedAt } });
});

prefsRouter.delete("/blocks/:name", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const name = decodeURIComponent(c.req.param("name"));
  await db
    .delete(userBlocks)
    .where(and(eq(userBlocks.userId, user.id), eq(userBlocks.blockedName, name)));
  return c.json({ data: { blocked: false, name } });
});

const reportSchema = z.object({
  targetName: z.string().min(1),
  reason: z.enum(["spam", "harassment", "scam", "inappropriate", "other"]),
  details: z.string().default(""),
  escalated: z.boolean().optional(),
  applicationId: z.string().optional(),
  boatName: z.string().optional(),
  messageId: z.string().optional(),
  messageText: z.string().optional(),
  messageCreatedAt: z.string().optional(),
});

prefsRouter.post("/reports", requireUser, zValidator("json", reportSchema), async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const body = c.req.valid("json");
  const id = `report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = new Date().toISOString();
  await db.insert(userReports).values({
    id,
    reporterUserId: user.id,
    targetName: body.targetName,
    reason: body.reason,
    details: body.details.trim(),
    createdAt,
    escalated: Boolean(body.escalated),
    applicationId: body.applicationId ?? null,
    boatName: body.boatName ?? null,
    messageId: body.messageId ?? null,
    messageText: body.messageText ?? null,
    messageCreatedAt: body.messageCreatedAt ?? null,
  });
  return c.json({
    data: {
      id,
      targetName: body.targetName,
      reason: body.reason,
      details: body.details.trim(),
      createdAt,
      escalated: body.escalated || undefined,
      applicationId: body.applicationId,
      boatName: body.boatName,
      messageId: body.messageId,
      messageText: body.messageText,
      messageCreatedAt: body.messageCreatedAt,
    },
  });
});
