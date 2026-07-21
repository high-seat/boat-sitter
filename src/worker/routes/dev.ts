import { Hono } from "hono";
import { getDb } from "../db";
import { boats } from "../db/schema";
import { seedBoats } from "../db/seed-data";
import { requireAdmin } from "../middleware/auth";
import { devConsoleHtml } from "./dev-console-html";

/**
 * Developer-only routes. Mounted at /api/dev.
 *
 * The whole router 404s when ENVIRONMENT === "production", so it cannot be
 * reached on a real deploy even if someone guesses the path. Set that var in
 * wrangler.json (or per-environment) before shipping.
 */
export const devRouter = new Hono<{ Bindings: Env }>();

devRouter.use("*", async (c, next) => {
  if (c.env.ENVIRONMENT === "production") {
    return c.json({ error: "Not found" }, 404);
  }
  await next();
});

/** GET /api/dev — interactive HTML console for exercising the API. */
devRouter.get("/", (c) => c.html(devConsoleHtml));

/** GET /api/dev/status — row count and environment, for a quick sanity check. */
devRouter.get("/status", async (c) => {
  const db = getDb(c.env);
  const rows = await db.select().from(boats);
  return c.json({
    environment: c.env.ENVIRONMENT,
    adminTokenConfigured: Boolean(c.env.ADMIN_TOKEN),
    boatCount: rows.length,
    ids: rows.map((r) => r.id),
  });
});

/**
 * POST /api/dev/reset — wipe and re-seed from src/worker/db/seed-data.ts.
 * Requires the admin token, since it is destructive.
 */
devRouter.post("/reset", requireAdmin, async (c) => {
  const db = getDb(c.env);

  await db.delete(boats);
  await db.insert(boats).values(seedBoats);

  const rows = await db.select().from(boats);
  return c.json({
    reset: true,
    inserted: rows.length,
    ids: rows.map((r) => r.id),
  });
});

/**
 * GET /api/dev/sample — a valid boat payload with a unique id, ready to POST.
 * Saves you hand-writing JSON when testing creates.
 */
devRouter.get("/sample", (c) => {
  const suffix = Math.random().toString(36).slice(2, 7);
  return c.json({
    id: `test-boat-${suffix}`,
    name: "Test Boat",
    type: "Sailing yacht",
    length: "34 ft",
    location: "Palma, Mallorca",
    country: "Spain",
    region: "Mediterranean",
    dates: "1 Jun – 15 Jun",
    dateStart: "2027-06-01",
    dateEnd: "2027-06-15",
    duration: "14 nights",
    nights: 14,
    image:
      "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    owner: "Test Owner",
    ownerImage: "https://i.pravatar.cc/160?img=5",
    rating: 4.5,
    reviews: 3,
    applicants: 1,
    description: "A test listing created from the dev console.",
    home: "Aft cabin with a proper mattress and a kettle that works.",
    responsibilities: ["Check bilge daily", "Run engine weekly"],
    systems: ["Volvo Penta diesel", "Solar"],
    requirements: ["Some sailing experience"],
    amenities: ["Wi-Fi", "Shore power"],
    pet: null,
    featured: false,
    published: true,
  });
});
