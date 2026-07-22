import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { applications, reviews, sits, vessels } from "../db/schema";
import { insertNotification } from "../lib/notifications";
import { requireUser } from "../middleware/auth";

export const reviewsRouter = new Hono<AppEnv>();

function shapeReview(row: typeof reviews.$inferSelect) {
  return {
    id: row.id,
    sitId: row.sitId,
    boatName: row.boatName,
    applicationId: row.applicationId,
    sitterName: row.sitterName,
    ownerName: row.ownerName,
    ownerImage: row.ownerImage,
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

reviewsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const sitter = c.req.query("sitter");
  const applicationId = c.req.query("applicationId");

  if (applicationId) {
    const row = await db.query.reviews.findFirst({
      where: eq(reviews.applicationId, applicationId),
    });
    return c.json({ data: row ? shapeReview(row) : null });
  }
  if (sitter) {
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.sitterName, sitter))
      .orderBy(desc(reviews.createdAt));
    return c.json({ data: rows.map(shapeReview) });
  }
  return c.json({ error: "Provide sitter or applicationId" }, 400);
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
  if (!vessel || vessel.ownerUserId !== user.id) {
    return c.json({ error: "REVIEW_OWNER_ONLY" }, 403);
  }

  const existing = await db.query.reviews.findFirst({
    where: eq(reviews.applicationId, body.applicationId),
  });
  if (existing) return c.json({ error: "REVIEW_ALREADY_EXISTS" }, 409);

  const createdAt = new Date().toISOString();
  const [row] = await db
    .insert(reviews)
    .values({
      id: `review-${Date.now()}`,
      sitId: application.sitId,
      boatName: application.boatName,
      applicationId: application.id,
      sitterName: application.applicantName,
      sitterUserId: application.applicantUserId,
      ownerName: application.ownerName,
      ownerUserId: user.id,
      ownerImage:
        user.image ??
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
      rating: body.rating,
      text: body.text.trim(),
      location: `${sit.location}, ${sit.country}`,
      createdAt,
    })
    .returning();

  if (application.applicantUserId) {
    await insertNotification(db, {
      userId: application.applicantUserId,
      userName: application.applicantName,
      type: "newMessage",
      actor: user.name,
      boatName: application.boatName,
      href: `/members/${encodeURIComponent(application.applicantName)}`,
    });
  }

  return c.json({ data: shapeReview(row) }, 201);
});

const responseSchema = z.object({
  text: z.string().min(8),
});

reviewsRouter.post(
  "/:id/response",
  requireUser,
  zValidator("json", responseSchema),
  async (c) => {
    const db = getDb(c.env);
    const user = c.get("user")!;
    const id = c.req.param("id");
    const { text } = c.req.valid("json");

    const existing = await db.query.reviews.findFirst({ where: eq(reviews.id, id) });
    if (!existing) return c.json({ error: "REVIEW_NOT_FOUND" }, 404);
    if (existing.sitterUserId && existing.sitterUserId !== user.id) {
      return c.json({ error: "REVIEW_SITTER_ONLY" }, 403);
    }
    if (!existing.sitterUserId && existing.sitterName !== user.name) {
      return c.json({ error: "REVIEW_SITTER_ONLY" }, 403);
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
  },
);
