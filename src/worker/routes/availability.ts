import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { sits, sitterAvailability } from "../db/schema";
import { requireUser } from "../middleware/auth";

/**
 * Sitter availability — the supply side of the marketplace.
 *
 * A signed-in sitter publishes windows (date range + optional regions) when
 * they are free. Owners use the matching engine (`GET /match?sitId=`) to find
 * open sitters whose window overlaps a sit's dates and region.
 *
 * Net-new and fully additive: no existing route reads or writes this table, so
 * nothing in the current owner → sit → application flow changes.
 *
 * Stored status is `open | booked | withdrawn`. `completed` / `expired` are
 * DERIVED from the dates at read time (see derivePhase), never stored.
 */
export const availabilityRouter = new Hono<AppEnv>();

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const windowSchema = z
  .object({
    dateStart: z.string().regex(ISO_DATE, "dateStart must be YYYY-MM-DD"),
    dateEnd: z.string().regex(ISO_DATE, "dateEnd must be YYYY-MM-DD"),
    regions: z.array(z.string().min(1)).max(50).default([]),
    notes: z.string().max(2000).default(""),
  })
  .refine((v) => v.dateEnd >= v.dateStart, {
    message: "dateEnd must be on or after dateStart",
    path: ["dateEnd"],
  });

// PATCH allows partial edits; the date-order check only runs when both given.
const windowPatchSchema = z
  .object({
    dateStart: z.string().regex(ISO_DATE).optional(),
    dateEnd: z.string().regex(ISO_DATE).optional(),
    regions: z.array(z.string().min(1)).max(50).optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((v) => !(v.dateStart && v.dateEnd) || v.dateEnd >= v.dateStart, {
    message: "dateEnd must be on or after dateStart",
    path: ["dateEnd"],
  });

type WindowRow = typeof sitterAvailability.$inferSelect;

/** Today as a YYYY-MM-DD string (UTC), for lexical comparison with ISO dates. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The effective, user-facing phase. `completed`/`expired` are never stored —
 * they emerge once the window's end date passes.
 */
function derivePhase(row: WindowRow, today = todayIso()): string {
  if (row.status === "withdrawn") return "withdrawn";
  const past = row.dateEnd < today;
  if (row.status === "booked") return past ? "completed" : "booked";
  return past ? "expired" : "open";
}

function withPhase(row: WindowRow) {
  return { ...row, phase: derivePhase(row) };
}

/** GET /api/availability/mine — the signed-in sitter's own windows. */
availabilityRouter.get("/mine", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const rows = await db
    .select()
    .from(sitterAvailability)
    .where(eq(sitterAvailability.sitterUserId, user.id))
    .orderBy(desc(sitterAvailability.dateStart));
  return c.json({ data: rows.map(withPhase) });
});

/** POST /api/availability — publish a new window. */
availabilityRouter.post("/", requireUser, zValidator("json", windowSchema), async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const body = c.req.valid("json");

  const values = {
    id: crypto.randomUUID(),
    sitterUserId: user.id,
    sitterName: user.name,
    dateStart: body.dateStart,
    dateEnd: body.dateEnd,
    regions: body.regions,
    notes: body.notes,
    status: "open",
    bookedApplicationId: null,
  };

  const [row] = await db.insert(sitterAvailability).values(values).returning();
  return c.json({ data: withPhase(row) }, 201);
});

/** PATCH /api/availability/:id — edit your own window. */
availabilityRouter.patch("/:id", requireUser, zValidator("json", windowPatchSchema), async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const existing = await db.query.sitterAvailability.findFirst({
    where: eq(sitterAvailability.id, id),
  });
  if (!existing) return c.json({ error: "Availability not found" }, 404);
  if (existing.sitterUserId !== user.id) {
    return c.json({ error: "You do not own this availability" }, 403);
  }

  // Guard the combined date order across stored + incoming values.
  const nextStart = body.dateStart ?? existing.dateStart;
  const nextEnd = body.dateEnd ?? existing.dateEnd;
  if (nextEnd < nextStart) {
    return c.json({ error: "dateEnd must be on or after dateStart" }, 400);
  }

  const [row] = await db
    .update(sitterAvailability)
    .set({
      ...(body.dateStart !== undefined && { dateStart: body.dateStart }),
      ...(body.dateEnd !== undefined && { dateEnd: body.dateEnd }),
      ...(body.regions !== undefined && { regions: body.regions }),
      ...(body.notes !== undefined && { notes: body.notes }),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sitterAvailability.id, id))
    .returning();

  return c.json({ data: withPhase(row) });
});

/**
 * DELETE /api/availability/:id — withdraw your own window.
 *
 * Soft delete: sets status to `withdrawn` (a terminal state in the lifecycle)
 * so history is preserved and any coupled booking reference stays intact.
 */
availabilityRouter.delete("/:id", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const id = c.req.param("id");

  const existing = await db.query.sitterAvailability.findFirst({
    where: eq(sitterAvailability.id, id),
  });
  if (!existing) return c.json({ error: "Availability not found" }, 404);
  if (existing.sitterUserId !== user.id) {
    return c.json({ error: "You do not own this availability" }, 403);
  }

  const [row] = await db
    .update(sitterAvailability)
    .set({ status: "withdrawn", updatedAt: new Date().toISOString() })
    .where(eq(sitterAvailability.id, id))
    .returning();

  return c.json({ data: withPhase(row) });
});

/**
 * GET /api/availability/match?sitId=... — the matching engine.
 *
 * Given a sit, return the open availability windows that could cover it:
 *   1. status = open (bookable)
 *   2. window not yet expired (dateEnd >= today)
 *   3. dates overlap the sit's [start, start + duration nights]
 *   4. region matches — sit.country is in the window's regions, or the window
 *      lists no regions (open to anywhere)
 *
 * Read-only discovery; no auth required (mirrors public sit browsing). Only the
 * public fields we store are returned.
 */
availabilityRouter.get("/match", async (c) => {
  const sitId = c.req.query("sitId");
  if (!sitId) return c.json({ error: "sitId query param is required" }, 400);

  const db = getDb(c.env);
  const sit = await db.query.sits.findFirst({ where: eq(sits.id, sitId) });
  if (!sit) return c.json({ error: "Sit not found" }, 404);

  const sitStart = sit.dateStart; // YYYY-MM-DD
  const nights = Number.parseInt(sit.duration, 10);
  const sitEnd = addNights(sitStart, Number.isFinite(nights) && nights > 0 ? nights : 0);
  const today = todayIso();

  // Coarse filter in SQL: open windows that haven't expired and start on or
  // before the sit ends. The remaining overlap edge + region are refined in JS.
  const candidates = await db
    .select()
    .from(sitterAvailability)
    .where(and(eq(sitterAvailability.status, "open"), gte(sitterAvailability.dateEnd, today)));

  const sitCountry = sit.country.toLowerCase();
  const matches = candidates
    .filter((w) => w.dateStart <= sitEnd && w.dateEnd >= sitStart)
    .filter((w) => {
      if (w.regions.length === 0) return true;
      return w.regions.some((r) => r.toLowerCase() === sitCountry);
    })
    // Soonest-available first.
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))
    .map((w) => ({
      id: w.id,
      sitterUserId: w.sitterUserId,
      sitterName: w.sitterName,
      dateStart: w.dateStart,
      dateEnd: w.dateEnd,
      regions: w.regions,
      notes: w.notes,
    }));

  return c.json({
    data: matches,
    sit: { id: sit.id, dateStart: sitStart, dateEnd: sitEnd, country: sit.country },
  });
});

/** Add whole days to a YYYY-MM-DD date, returning YYYY-MM-DD (UTC-safe). */
function addNights(dateStart: string, nights: number): string {
  const d = new Date(`${dateStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + nights);
  return d.toISOString().slice(0, 10);
}
