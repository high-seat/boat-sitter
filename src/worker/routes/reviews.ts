import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { applications, reviews, sits, vessels } from "../db/schema";
import { insertNotification } from "../lib/notifications";
import { requireUser } from "../middleware/auth";

export const reviewsRouter = new Hono<AppEnv>();

const authorRoleSchema = z.enum(["owner", "sitter"]);

function shapeReview(row: typeof reviews.$inferSelect) {
  return {
    id: row.id,
    sitId: row.sitId,
    boatName: row.boatName,
    applicationId: row.applicationId,
    authorRole: (row.authorRole === "sitter" ? "sitter" : "owner") as "owner" | "sitter",
    sitterName: row.sitterName,
    ownerName: row.ownerName,
    ownerImage: row.ownerImage,
    authorImage: row.authorImage || row.ownerImage,
    rating: row.rating,
    text: row.text,
    createdAt: row.createdAt,
    location: row.location,
    response:
      row.responseText && row.responseCreatedAt
        ? { text: row.responseText, createdAt: row.responseCreatedAt }
        : undefined,
  };
}

function defaultAvatar(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

reviewsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const sitter = c.req.query("sitter");
  const owner = c.req.query("owner");
  const applicationId = c.req.query("applicationId");
  const authorRoleParam = c.req.query("authorRole");
  const authorRole = authorRoleSchema.safeParse(authorRoleParam);

  if (applicationId) {
    if (authorRole.success) {
      const row = await db.query.reviews.findFirst({
        where: and(
          eq(reviews.applicationId, applicationId),
          eq(reviews.authorRole, authorRole.data),
        ),
      });
      return c.json({ data: row ? shapeReview(row) : null });
    }
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.applicationId, applicationId))
      .orderBy(desc(reviews.createdAt));
    return c.json({ data: rows.map(shapeReview) });
  }
  if (sitter) {
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.sitterName, sitter), eq(reviews.authorRole, "owner")))
      .orderBy(desc(reviews.createdAt));
    return c.json({ data: rows.map(shapeReview) });
  }
  if (owner) {
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.ownerName, owner), eq(reviews.authorRole, "sitter")))
      .orderBy(desc(reviews.createdAt));
    return c.json({ data: rows.map(shapeReview) });
  }
  return c.json({ error: "Provide sitter, owner, or applicationId" }, 400);
});

const createSchema = z.object({
  applicationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(20),
});

reviewsRouter.post("/", requireUser, zValidator("json", createSchema), async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const body = c.req.valid("json");

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, body.applicationId),
  });
  if (!application) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);
  if (application.status !== "accepted") {
    return c.json({ error: "REVIEW_APPLICATION_NOT_ACCEPTED" }, 400);
  }

  const sit = await db.query.sits.findFirst({ where: eq(sits.id, application.sitId) });
  if (!sit) return c.json({ error: "REVIEW_SIT_NOT_COMPLETED" }, 400);
  const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, sit.vesselId) });
  if (!vessel) return c.json({ error: "REVIEW_SIT_NOT_COMPLETED" }, 400);

  const isOwner =
    (vessel.ownerUserId != null && vessel.ownerUserId === user.id) ||
    (vessel.ownerUserId == null && vessel.owner === user.name);
  const isSitter =
    (application.applicantUserId != null && application.applicantUserId === user.id) ||
    (application.applicantUserId == null && application.applicantName === user.name);

  if (!isOwner && !isSitter) {
    return c.json({ error: "REVIEW_FORBIDDEN" }, 403);
  }

  const authorRole = isOwner ? "owner" : "sitter";

  const existing = await db.query.reviews.findFirst({
    where: and(eq(reviews.applicationId, body.applicationId), eq(reviews.authorRole, authorRole)),
  });
  if (existing) return c.json({ error: "REVIEW_ALREADY_EXISTS" }, 409);

  const authorImage = user.image ?? defaultAvatar(user.name);
  const createdAt = new Date().toISOString();
  const [row] = await db
    .insert(reviews)
    .values({
      id: `review-${Date.now()}-${authorRole}`,
      sitId: application.sitId,
      boatName: application.boatName,
      applicationId: application.id,
      authorRole,
      sitterName: application.applicantName,
      sitterUserId: application.applicantUserId,
      ownerName: application.ownerName,
      ownerUserId: vessel.ownerUserId ?? null,
      ownerImage: isOwner
        ? authorImage
        : (vessel.ownerImage ?? defaultAvatar(application.ownerName)),
      authorImage,
      rating: body.rating,
      text: body.text.trim(),
      location: `${sit.location}, ${sit.country}`,
      createdAt,
    })
    .returning();

  if (authorRole === "owner" && application.applicantUserId) {
    await insertNotification(db, {
      userId: application.applicantUserId,
      userName: application.applicantName,
      type: "newMessage",
      actor: user.name,
      boatName: application.boatName,
      href: `/members/${encodeURIComponent(application.applicantName)}`,
    });
  }
  if (authorRole === "sitter" && (vessel.ownerUserId || application.ownerName)) {
    await insertNotification(db, {
      userId: vessel.ownerUserId,
      userName: application.ownerName,
      type: "newMessage",
      actor: user.name,
      boatName: application.boatName,
      href: `/members/${encodeURIComponent(application.ownerName)}`,
    });
  }

  return c.json({ data: shapeReview(row) }, 201);
});

const responseSchema = z.object({
  text: z.string().min(8),
});

reviewsRouter.post("/:id/response", requireUser, zValidator("json", responseSchema), async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const id = c.req.param("id");
  const { text } = c.req.valid("json");

  const existing = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
  if (!existing) return c.json({ error: "REVIEW_NOT_FOUND" }, 404);

  const authorRole = existing.authorRole === "sitter" ? "sitter" : "owner";
  const isReviewee =
    authorRole === "owner"
      ? (existing.sitterUserId && existing.sitterUserId === user.id) ||
        (!existing.sitterUserId && existing.sitterName === user.name)
      : (existing.ownerUserId && existing.ownerUserId === user.id) ||
        (!existing.ownerUserId && existing.ownerName === user.name);

  if (!isReviewee) {
    return c.json({ error: "REVIEW_RESPONSE_FORBIDDEN" }, 403);
  }
  if (existing.responseText) return c.json({ error: "REVIEW_RESPONSE_EXISTS" }, 409);

  const [row] = await db
    .update(reviews)
    .set({
      responseText: text.trim(),
      responseCreatedAt: new Date().toISOString(),
    })
    .where(eq(reviews.id, id))
    .returning();

  return c.json({ data: shapeReview(row) });
});
