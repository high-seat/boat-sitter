import { Hono } from "hono";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { applicationMessages, applications, sits, supportRequests, vessels } from "../db/schema";
import { seedApplications, seedSits, seedVessels } from "../db/seed-data";
import { requireAdmin } from "../middleware/auth";
import { sendNotificationEmail } from "../email";
import { devConsoleHtml } from "./dev-console-html";

/**
 * Developer-only routes. Mounted at /api/dev.
 *
 * The whole router 404s when ENVIRONMENT === "production", so it cannot be
 * reached on a real deploy even if someone guesses the path.
 */
export const devRouter = new Hono<AppEnv>();

devRouter.use("*", async (c, next) => {
  if (c.env.ENVIRONMENT === "production") {
    return c.json({ error: "Not found" }, 404);
  }
  await next();
});

devRouter.get("/", (c) => c.html(devConsoleHtml));

devRouter.get("/status", async (c) => {
  const db = getDb(c.env);
  const [v, s, a] = await Promise.all([
    db.select().from(vessels),
    db.select().from(sits),
    db.select().from(applications),
  ]);
  return c.json({
    environment: c.env.ENVIRONMENT,
    adminTokenConfigured: Boolean(c.env.ADMIN_TOKEN),
    vessels: v.length,
    sits: s.length,
    applications: a.length,
    sitIds: s.map((r) => r.id),
  });
});

/** POST /api/dev/reset — wipe and re-seed from seed-data.ts. */
devRouter.post("/reset", requireAdmin, async (c) => {
  const db = getDb(c.env);

  // Order matters: children before parents (FKs cascade, but be explicit).
  await db.delete(applicationMessages);
  await db.delete(applications);
  await db.delete(sits);
  await db.delete(vessels);
  await db.delete(supportRequests);

  await db.insert(vessels).values(seedVessels);
  await db.insert(sits).values(seedSits);

  for (const app of seedApplications) {
    const { messages, ...rest } = app;
    await db.insert(applications).values({ ...rest, applicantName: rest.applicant.name });
    if (messages.length) {
      await db
        .insert(applicationMessages)
        .values(messages.map((m) => ({ ...m, applicationId: app.id })));
    }
  }

  const s = await db.select().from(sits);
  return c.json({ reset: true, vessels: seedVessels.length, sits: s.length });
});

/** GET /api/dev/test-email — send one test email via Resend to NOTIFY_EMAIL. */
devRouter.get("/test-email", async (c) => {
  if (!c.env.RESEND_API_KEY) {
    return c.json({ ok: false, error: "RESEND_API_KEY not set in .dev.vars" }, 400);
  }
  if (!c.env.NOTIFY_EMAIL) {
    return c.json({ ok: false, error: "NOTIFY_EMAIL not set in .dev.vars" }, 400);
  }
  await sendNotificationEmail(c.env, {
    subject: "Boatstead test email ✅",
    heading: "Your email notifications work",
    body: "If you're reading this in your inbox, Resend is configured correctly.",
    actionUrl: c.env.BETTER_AUTH_URL,
    actionLabel: "Open the app",
    to: c.env.NOTIFY_EMAIL,
  });
  return c.json({ ok: true, sentTo: c.env.NOTIFY_EMAIL, note: "Check your inbox (and spam)." });
});

/** GET /api/dev/sample — a valid vessel + sit pair ready to PUT. */
devRouter.get("/sample", (c) => {
  const suffix = Math.random().toString(36).slice(2, 7);
  const vesselId = `test-boat-${suffix}`;
  const sitId = `test-sit-${suffix}`;
  return c.json({
    vessel: {
      id: vesselId,
      name: "Test Boat",
      type: "Sailing yacht",
      length: "34 ft",
      homePort: "Palma, Spain",
      image:
        "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1400&q=85",
      gallery: [],
      owner: "Test Owner",
      ownerImage: "https://i.pravatar.cc/160?img=5",
      rating: 4.5,
      reviews: 3,
      description: "A test listing created from the dev console.",
      home: "Aft cabin with a proper mattress and a kettle that works.",
      systems: ["Volvo Penta diesel", "Solar"],
      engineType: "Inboard diesel",
      voltageType: "12 V DC",
      stoveFuelType: "LPG / propane",
      amenities: ["Wi-Fi", "Shore power"],
    },
    sit: {
      id: sitId,
      boatId: vesselId,
      dates: "1 Jun – 15 Jun",
      dateStart: "2027-06-01",
      duration: "14 nights",
      location: "Palma",
      country: "Spain",
      latitude: 39.5696,
      longitude: 2.6502,
      responsibilities: ["Check bilge daily", "Run engine weekly"],
      requirements: ["Some sailing experience"],
      minYearsExperience: 1,
      requiredExperience: [],
      requiredCertifications: [],
      requiredSkills: ["Mooring & lines"],
      applicants: 0,
      pet: null,
      featured: false,
      published: true,
    },
  });
});
