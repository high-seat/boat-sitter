import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import {
  applications,
  notifications,
  profiles,
  reviews,
  sits,
  user,
  vessels,
} from "../db/schema";
import { requireUser } from "../middleware/auth";

/**
 * /api/me — session identity, profile CRUD, and account deletion.
 */
export const meRouter = new Hono<AppEnv>();

const DEFAULT_EMAIL_NOTIFICATIONS = {
  newApplications: true,
  applicationUpdates: true,
  messages: true,
  sitReminders: true,
  productUpdates: false,
};

const DEFAULT_SIT_DEFAULTS = { nonSmokerRequired: false };

const profilePatchSchema = z.object({
  name: z.string().min(1).optional(),
  legalName: z.string().optional(),
  image: z.string().optional(),
  coverImage: z.string().nullish(),
  bio: z.string().optional(),
  location: z.string().optional(),
  languages: z.array(z.string()).optional(),
  preferredCountries: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  preferredLanguage: z.string().optional(),
  measurementSystem: z.enum(["metric", "imperial"]).optional(),
  emailNotifications: z.record(z.string(), z.boolean()).optional(),
  sitDefaults: z.record(z.string(), z.unknown()).optional(),
  phoneCountryCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  yearsExperience: z.number().int().min(0).optional(),
  certifications: z.array(z.string()).optional(),
  completedSits: z.number().int().min(0).optional(),
});

function shapeProfile(row: typeof profiles.$inferSelect) {
  return {
    userId: row.userId,
    email: row.email,
    emailConfirmed: true,
    name: row.name,
    legalName: row.legalName || row.name,
    image: row.image,
    coverImage: row.coverImage ?? undefined,
    bio: row.bio,
    location: row.location,
    languages: row.languages,
    preferredCountries: row.preferredCountries,
    skills: row.skills,
    preferredLanguage: row.preferredLanguage,
    measurementSystem: row.measurementSystem === "imperial" ? "imperial" : "metric",
    emailNotifications: {
      ...DEFAULT_EMAIL_NOTIFICATIONS,
      ...(row.emailNotifications ?? {}),
    },
    sitDefaults: {
      ...DEFAULT_SIT_DEFAULTS,
      ...(row.sitDefaults ?? {}),
    },
    memberSince: row.memberSince,
    phoneCountryCode: row.phoneCountryCode,
    phoneNumber: row.phoneNumber,
    yearsExperience: row.yearsExperience,
    certifications: row.certifications,
    completedSits: row.completedSits,
  };
}

async function ensureProfile(
  env: Env,
  sessionUser: { id: string; name: string; email: string; image?: string | null },
) {
  const db = getDb(env);
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessionUser.id),
  });
  if (existing) return existing;

  const year = new Date().getFullYear();
  const [created] = await db
    .insert(profiles)
    .values({
      userId: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      legalName: sessionUser.name,
      image:
        sessionUser.image ??
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(sessionUser.name)}`,
      bio: "Practical, calm and happiest near the water. I value transparent communication, careful preparation and thorough handovers.",
      location: "",
      languages: ["English"],
      preferredCountries: [],
      skills: ["Detailed handovers", "Fast responder"],
      preferredLanguage: "en-US",
      measurementSystem: "metric",
      emailNotifications: DEFAULT_EMAIL_NOTIFICATIONS,
      sitDefaults: DEFAULT_SIT_DEFAULTS,
      phoneCountryCode: "+44",
      phoneNumber: "",
      memberSince: year,
      yearsExperience: 0,
      certifications: [],
      completedSits: 0,
    })
    .returning();
  return created;
}

meRouter.get("/", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) return c.json({ user: null, profile: null });
  const profile = await ensureProfile(c.env, sessionUser);
  return c.json({
    user: sessionUser,
    profile: shapeProfile(profile),
  });
});

meRouter.get("/profile", requireUser, async (c) => {
  const sessionUser = c.get("user")!;
  const profile = await ensureProfile(c.env, sessionUser);
  return c.json({ data: shapeProfile(profile) });
});

meRouter.put("/profile", requireUser, zValidator("json", profilePatchSchema), async (c) => {
  const sessionUser = c.get("user")!;
  const patch = c.req.valid("json");
  const db = getDb(c.env);
  await ensureProfile(c.env, sessionUser);

  const [row] = await db
    .update(profiles)
    .set({
      ...patch,
      coverImage: patch.coverImage === null ? null : patch.coverImage,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(profiles.userId, sessionUser.id))
    .returning();

  // Keep Better Auth display name/image in sync when changed.
  if (patch.name || patch.image) {
    await db
      .update(user)
      .set({
        ...(patch.name ? { name: patch.name } : {}),
        ...(patch.image ? { image: patch.image } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, sessionUser.id));
  }

  return c.json({ data: shapeProfile(row) });
});

/** Hard-delete the authenticated account and owned data. */
meRouter.delete("/", requireUser, async (c) => {
  const sessionUser = c.get("user")!;
  const db = getDb(c.env);
  const userId = sessionUser.id;

  // Owned vessels (cascade sits → applications that reference sits are not FK'd
  // on sitId, so clean applications for those sits explicitly).
  const ownedVessels = await db.select().from(vessels).where(eq(vessels.ownerUserId, userId));
  for (const vessel of ownedVessels) {
    const vesselSits = await db.select().from(sits).where(eq(sits.vesselId, vessel.id));
    for (const sit of vesselSits) {
      await db.delete(applications).where(eq(applications.sitId, sit.id));
      await db.delete(reviews).where(eq(reviews.sitId, sit.id));
    }
    await db.delete(sits).where(eq(sits.vesselId, vessel.id));
    await db.delete(vessels).where(eq(vessels.id, vessel.id));
  }

  await db.delete(applications).where(eq(applications.applicantUserId, userId));
  await db.delete(reviews).where(eq(reviews.sitterUserId, userId));
  await db.delete(reviews).where(eq(reviews.ownerUserId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(profiles).where(eq(profiles.userId, userId));
  // Cascades session + account rows.
  await db.delete(user).where(eq(user.id, userId));

  return c.json({ data: { deleted: true } });
});

/** Public profile lookup by display name. */
export const profilesRouter = new Hono<AppEnv>();

profilesRouter.get("/:name", async (c) => {
  const db = getDb(c.env);
  const name = decodeURIComponent(c.req.param("name"));
  const row = await db.query.profiles.findFirst({ where: eq(profiles.name, name) });
  if (!row) return c.json({ error: "Profile not found" }, 404);
  return c.json({
    data: {
      name: row.name,
      image: row.image,
      coverImage: row.coverImage ?? undefined,
      location: row.location,
      bio: row.bio,
      languages: row.languages,
      preferredCountries: row.preferredCountries,
      skills: row.skills,
      yearsExperience: row.yearsExperience,
      certifications: row.certifications,
      memberSince: row.memberSince,
      completedSits: row.completedSits,
    },
  });
});
