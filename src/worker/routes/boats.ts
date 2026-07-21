import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db";
import { boats } from "../db/schema";
import { requireAdmin } from "../middleware/auth";

const listQuerySchema = z.object({
  region: z.string().optional(),
  country: z.string().optional(),
  type: z.string().optional(),
  featured: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  minRating: z.coerce.number().min(0).max(5).optional(),
  // ISO dates — filter listings whose start date falls in the window
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  availableTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  sort: z
    .enum(["dateStart", "-dateStart", "rating", "-rating", "applicants", "-applicants", "name"])
    .optional()
    .default("dateStart"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

const boatBodySchema = z.object({
  id: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "id must be a lowercase slug"),
  name: z.string().min(1),
  type: z.string().min(1),
  length: z.string().min(1),
  location: z.string().min(1),
  country: z.string().min(1),
  region: z.string().min(1),
  dates: z.string().min(1),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  duration: z.string().min(1),
  nights: z.number().int().positive().nullish(),
  image: z.string().url(),
  gallery: z.array(z.string().url()).default([]),
  owner: z.string().min(1),
  ownerImage: z.string().url().nullish(),
  rating: z.number().min(0).max(5).default(0),
  reviews: z.number().int().min(0).default(0),
  applicants: z.number().int().min(0).default(0),
  description: z.string().min(1),
  home: z.string().nullish(),
  responsibilities: z.array(z.string()).default([]),
  systems: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  pet: z.string().nullish(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

const sortMap = {
  dateStart: asc(boats.dateStart),
  "-dateStart": desc(boats.dateStart),
  rating: asc(boats.rating),
  "-rating": desc(boats.rating),
  applicants: asc(boats.applicants),
  "-applicants": desc(boats.applicants),
  name: asc(boats.name),
} as const;

export const boatsRouter = new Hono<{ Bindings: Env }>();

/**
 * GET /api/boats
 * List published boats with filtering, search, sorting and pagination.
 */
boatsRouter.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { region, country, type, featured, minRating, availableFrom, availableTo, q, sort, page, limit } =
    c.req.valid("query");

  const db = getDb(c.env);

  const filters = [eq(boats.published, true)];
  if (region) filters.push(eq(boats.region, region));
  if (country) filters.push(eq(boats.country, country));
  if (type) filters.push(eq(boats.type, type));
  if (featured !== undefined) filters.push(eq(boats.featured, featured));
  if (minRating !== undefined) filters.push(gte(boats.rating, minRating));
  if (availableFrom) filters.push(gte(boats.dateStart, availableFrom));
  if (availableTo) filters.push(lte(boats.dateStart, availableTo));

  if (q) {
    const needle = `%${q.toLowerCase()}%`;
    filters.push(
      or(
        like(sql`lower(${boats.name})`, needle),
        like(sql`lower(${boats.location})`, needle),
        like(sql`lower(${boats.country})`, needle),
        like(sql`lower(${boats.description})`, needle),
      )!,
    );
  }

  const where = and(...filters);

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(boats)
      .where(where)
      .orderBy(sortMap[sort])
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: sql<number>`count(*)` }).from(boats).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return c.json({
    data: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total,
    },
  });
});

/**
 * GET /api/boats/facets
 * Distinct filter values with counts — for building filter UI.
 * Declared before /:id so "facets" is not swallowed as an id.
 */
boatsRouter.get("/facets", async (c) => {
  const db = getDb(c.env);
  const published = eq(boats.published, true);

  const [regions, countries, types] = await Promise.all([
    db
      .select({ value: boats.region, count: sql<number>`count(*)` })
      .from(boats)
      .where(published)
      .groupBy(boats.region)
      .orderBy(boats.region),
    db
      .select({ value: boats.country, count: sql<number>`count(*)` })
      .from(boats)
      .where(published)
      .groupBy(boats.country)
      .orderBy(boats.country),
    db
      .select({ value: boats.type, count: sql<number>`count(*)` })
      .from(boats)
      .where(published)
      .groupBy(boats.type)
      .orderBy(boats.type),
  ]);

  return c.json({ regions, countries, types });
});

/**
 * GET /api/boats/:id
 */
boatsRouter.get("/:id", async (c) => {
  const db = getDb(c.env);
  const row = await db.query.boats.findFirst({
    where: and(eq(boats.id, c.req.param("id")), eq(boats.published, true)),
  });

  if (!row) return c.json({ error: "Boat not found" }, 404);
  return c.json({ data: row });
});

/**
 * POST /api/boats  (admin)
 */
boatsRouter.post("/", requireAdmin, zValidator("json", boatBodySchema), async (c) => {
  const body = c.req.valid("json");
  const db = getDb(c.env);

  const existing = await db.query.boats.findFirst({ where: eq(boats.id, body.id) });
  if (existing) return c.json({ error: `Boat "${body.id}" already exists` }, 409);

  const [row] = await db.insert(boats).values(body).returning();
  return c.json({ data: row }, 201);
});

/**
 * PATCH /api/boats/:id  (admin)
 */
boatsRouter.patch(
  "/:id",
  requireAdmin,
  zValidator("json", boatBodySchema.partial().omit({ id: true })),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb(c.env);

    if (Object.keys(body).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const [row] = await db
      .update(boats)
      .set({ ...body, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(boats.id, id))
      .returning();

    if (!row) return c.json({ error: "Boat not found" }, 404);
    return c.json({ data: row });
  },
);

/**
 * DELETE /api/boats/:id  (admin)
 */
boatsRouter.delete("/:id", requireAdmin, async (c) => {
  const db = getDb(c.env);
  const [row] = await db.delete(boats).where(eq(boats.id, c.req.param("id"))).returning();

  if (!row) return c.json({ error: "Boat not found" }, 404);
  return c.json({ data: { id: row.id, deleted: true } });
});
