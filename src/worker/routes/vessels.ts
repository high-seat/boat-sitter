import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { isValidYearBuilt, maxYearBuilt, MIN_YEAR_BUILT } from "../../shared/yearBuilt";
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
 *
 * `privateAccess` is stored on the vessel but only returned to the owner on
 * GET; accepted sitters use GET /api/sits/:id/access instead.
 */
export const vesselsRouter = new Hono<AppEnv>();

const privateAccessSchema = z
  .object({
    wifiNetwork: z.string().optional(),
    wifiPassword: z.string().optional(),
    accessCodes: z.string().optional(),
    otherNotes: z.string().optional(),
  })
  .nullish();

const vesselSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1),
  type: z.string().min(1),
  length: z.string().min(1),
  yearBuilt: z
    .number()
    .int()
    .nullable()
    .optional()
    .refine((value) => value == null || isValidYearBuilt(value), {
      message: `yearBuilt must be null or between ${MIN_YEAR_BUILT} and ${maxYearBuilt()}`,
    }),
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
  privateAccess: privateAccessSchema,
});

function stripPrivateAccess<T extends { privateAccess?: unknown }>(row: T, include: boolean) {
  if (include) return row;
  const { privateAccess: _ignored, ...rest } = row;
  return rest;
}

vesselsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const owner = c.req.query("owner");
  const user = c.get("user");
  const rows = owner
    ? await db.select().from(vessels).where(eq(vessels.owner, owner))
    : await db.select().from(vessels);
  return c.json({
    data: rows.map((row) => stripPrivateAccess(row, Boolean(user && row.ownerUserId === user.id))),
  });
});

vesselsRouter.get("/:id", async (c) => {
  const db = getDb(c.env);
  const user = c.get("user");
  const row = await db.query.vessels.findFirst({ where: eq(vessels.id, c.req.param("id")) });
  if (!row) return c.json({ error: "Vessel not found" }, 404);
  return c.json({
    data: stripPrivateAccess(row, Boolean(user && row.ownerUserId === user.id)),
  });
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
    return c.json({ error: "You do not own this vessel" }, 403);
  }

  const privateAccess = body.privateAccess
    ? {
        wifiNetwork: body.privateAccess.wifiNetwork?.trim() || undefined,
        wifiPassword: body.privateAccess.wifiPassword?.trim() || undefined,
        accessCodes: body.privateAccess.accessCodes?.trim() || undefined,
        otherNotes: body.privateAccess.otherNotes?.trim() || undefined,
      }
    : null;
  const hasPrivate =
    privateAccess &&
    Boolean(
      privateAccess.wifiNetwork ||
      privateAccess.wifiPassword ||
      privateAccess.accessCodes ||
      privateAccess.otherNotes,
    );

  const values = {
    id: body.id,
    name: body.name,
    type: body.type,
    length: body.length,
    yearBuilt: body.yearBuilt ?? null,
    homePort: body.homePort,
    image: body.image,
    gallery: body.gallery,
    owner: user.name,
    ownerImage: user.image ?? body.ownerImage,
    ownerUserId: user.id,
    rating: body.rating,
    reviews: body.reviews,
    description: body.description,
    home: body.home,
    systems: body.systems,
    engineType: body.engineType,
    voltageType: body.voltageType,
    stoveFuelType: body.stoveFuelType,
    amenities: body.amenities,
    privateAccess: hasPrivate ? privateAccess : null,
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
