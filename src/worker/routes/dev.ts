import { Hono } from "hono";
import { and, eq, isNull, like, ne, or, sql } from "drizzle-orm";
import type { AppEnv } from "../context";
import { hashPassword } from "better-auth/crypto";
import { buildAuth } from "../auth";
import { getDb } from "../db";
import { account, user } from "../db/auth-schema";
import {
  applicationMessages,
  applications,
  notifications,
  profiles,
  reviews,
  sits,
  sitterAvailability,
  supportRequests,
  userArchivedConversations,
  userBlocks,
  userReports,
  userSaved,
  vessels,
} from "../db/schema";
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

/**
 * Tool-created test users all use this email shape (see freshTestUser() on the
 * client). Listing and deletion are hard-restricted to it so this tooling can
 * never touch a real account, a seed user, or the qatest core-test user.
 */
const TEST_USER_EMAIL_LIKE = "dev-%@boatstead.test";
const isToolTestUserEmail = (email: string) => /^dev-.*@boatstead\.test$/i.test(email);

/** On staging a shared secret gates the account-creating/-deleting endpoints. */
function devSecretOk(c: { env: Env; req: { header: (name: string) => string | undefined } }) {
  return !c.env.DEV_LOGIN_SECRET || c.req.header("x-dev-secret") === c.env.DEV_LOGIN_SECRET;
}

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
    // Client uses this to decide whether to prompt for the dev login secret.
    requiresDevSecret: Boolean(c.env.DEV_LOGIN_SECRET),
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
      fullAddress: "Real Club Náutico de Palma, Palma, Spain",
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

const DEV_PASSWORD = "dev-password-boatstead";

/**
 * POST /api/dev/login — email/password sign-in (or sign-up) for local/e2e use.
 * Also claims seed vessels whose display `owner` matches the user's name.
 */
devRouter.post("/login", async (c) => {
  // On reachable non-prod envs (staging) a secret is configured to keep this
  // from being an open "create a logged-in account" backdoor. Locally the
  // secret is unset, so e2e/dev keep working with no header.
  if (!devSecretOk(c)) {
    return c.json({ error: "Dev login secret required or incorrect" }, 401);
  }

  const body = (await c.req.json().catch(() => null)) as {
    email?: string;
    name?: string;
    password?: string;
    image?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();
  if (!email || !name) {
    return c.json({ error: "email and name are required" }, 400);
  }
  const password = body?.password?.trim() || DEV_PASSWORD;
  const image =
    body?.image?.trim() ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

  const db = getDb(c.env);
  const auth = buildAuth(c.env, c.req.raw);

  // Ensure a credential user exists WITHOUT Better Auth's sign-up flow — that
  // flow fires a verification email (which on staging lands in NOTIFY_EMAIL).
  // Instead we upsert the user + a credential account directly, email
  // pre-verified, then just sign in. Silent, and idempotent for repeat logins.
  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  let userId: string;
  if (existing) {
    userId = existing.id;
    if (!existing.emailVerified) {
      await db.update(user).set({ emailVerified: true }).where(eq(user.id, userId));
    }
  } else {
    userId = crypto.randomUUID();
    const now = new Date();
    await db
      .insert(user)
      .values({
        id: userId,
        name,
        email,
        emailVerified: true,
        image,
        createdAt: now,
        updatedAt: now,
      });
  }

  // A credential (email+password) account is what sign-in checks against.
  const credential = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "credential")),
  });
  if (!credential) {
    const now = new Date();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });
  }

  const authResponse = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  if (!authResponse.ok) {
    const detail = await authResponse.text().catch(() => "");
    return c.json({ error: "Dev login failed", detail: detail || authResponse.statusText }, 400);
  }

  const setCookies = authResponse.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookies.map((entry) => entry.split(";")[0]).join("; ");
  const session = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader || c.req.header("cookie") || "" }),
  });
  const sessionUser = session?.user;
  if (!sessionUser) {
    return c.json({ error: "Dev login created no session" }, 500);
  }

  // Claim vessels whose owner matches this name. Include seed-user-* IDs so
  // e2e tests can log in as seed owners and properly own their seed vessels.
  await db
    .update(vessels)
    .set({
      ownerUserId: sessionUser.id,
      owner: sessionUser.name,
      ownerImage: sessionUser.image ?? image,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(
      and(
        eq(vessels.owner, name),
        or(isNull(vessels.ownerUserId), sql`${vessels.ownerUserId} LIKE 'seed-user-%'`),
      ),
    );

  // Claim applications whose applicant matches this name.
  await db
    .update(applications)
    .set({ applicantUserId: sessionUser.id })
    .where(
      and(
        eq(applications.applicantName, name),
        or(
          isNull(applications.applicantUserId),
          sql`${applications.applicantUserId} LIKE 'seed-user-%'`,
        ),
      ),
    );

  // Prefer a JSON body for clients while preserving auth cookies.
  const headers = new Headers(authResponse.headers);
  headers.set("content-type", "application/json");
  return new Response(
    JSON.stringify({
      ok: true,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        image: sessionUser.image ?? image,
      },
    }),
    { status: 200, headers },
  );
});

/**
 * Cascade-delete a user and everything they own. Mirrors the account-deletion
 * cleanup in routes/me.ts — keep the two in sync if per-user tables change.
 */
async function deleteUserAndData(db: ReturnType<typeof getDb>, userId: string) {
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
  await db.delete(sitterAvailability).where(eq(sitterAvailability.sitterUserId, userId));
  await db.delete(userSaved).where(eq(userSaved.userId, userId));
  await db.delete(userArchivedConversations).where(eq(userArchivedConversations.userId, userId));
  await db.delete(userBlocks).where(eq(userBlocks.userId, userId));
  await db.delete(userReports).where(eq(userReports.reporterUserId, userId));
  await db.delete(profiles).where(eq(profiles.userId, userId));
  await db.delete(user).where(eq(user.id, userId)); // cascades session + account
}

/**
 * GET /api/dev/test-users — list tool-created test users (dev-%@boatstead.test),
 * newest first. Secret-gated on staging.
 */
devRouter.get("/test-users", async (c) => {
  if (!devSecretOk(c)) return c.json({ error: "Dev secret required or incorrect" }, 401);
  const db = getDb(c.env);
  const rows = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(like(user.email, TEST_USER_EMAIL_LIKE));
  rows.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));
  return c.json({ data: rows });
});

/**
 * DELETE /api/dev/test-users/:id — delete ONE tool-created test user + all their
 * data. Refuses any id whose email isn't a dev-%@boatstead.test address, so it
 * can never remove a real/seed/qatest account. Secret-gated on staging.
 */
devRouter.delete("/test-users/:id", async (c) => {
  if (!devSecretOk(c)) return c.json({ error: "Dev secret required or incorrect" }, 401);
  const db = getDb(c.env);
  const id = c.req.param("id");
  const target = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!target) return c.json({ error: "User not found" }, 404);
  if (!isToolTestUserEmail(target.email)) {
    return c.json({ error: "Refusing to delete a non-test user" }, 400);
  }
  await deleteUserAndData(db, id);
  return c.json({ data: { id, deleted: true } });
});

/**
 * DELETE /api/dev/test-users — delete ALL tool-created test users at once.
 * Same hard restriction to dev-%@boatstead.test. Secret-gated on staging.
 */
devRouter.delete("/test-users", async (c) => {
  if (!devSecretOk(c)) return c.json({ error: "Dev secret required or incorrect" }, 401);
  const db = getDb(c.env);
  const rows = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(like(user.email, TEST_USER_EMAIL_LIKE));
  let deleted = 0;
  for (const row of rows) {
    if (!isToolTestUserEmail(row.email)) continue; // belt-and-braces
    await deleteUserAndData(db, row.id);
    deleted += 1;
  }
  return c.json({ data: { deleted } });
});

/**
 * POST /api/dev/fixture — insert e2e-only rows that used to live in localStorage.
 * Body: `{ kind: string, phase?: "accepting" | "accepted" | "underway" | "completed" }`
 */
devRouter.post("/fixture", async (c) => {
  const body = (await c.req.json().catch(() => null)) as {
    kind?: string;
    phase?: string;
  } | null;
  const kind = body?.kind;
  const db = getDb(c.env);
  const auth = buildAuth(c.env, c.req.raw);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const sessionUser = session?.user;
  if (!sessionUser) return c.json({ error: "Login required" }, 401);

  if (kind === "lifecycle-sit") {
    const phase = body?.phase ?? "accepting";
    if (!["accepting", "accepted", "underway", "completed"].includes(phase)) {
      return c.json({ error: "Invalid lifecycle phase" }, 400);
    }

    const sitId = "sit-lifecycle-e2e";
    const applicationId = "application-lifecycle-e2e";
    const today = new Date();
    const isoDay = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };
    const shiftDays = (days: number) => {
      const next = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      next.setDate(next.getDate() + days);
      return next;
    };

    let dateStart: string;
    let duration: string;
    let dates: string;
    if (phase === "completed") {
      dateStart = isoDay(shiftDays(-20));
      duration = "5 nights";
      dates = "Lifecycle completed window";
    } else if (phase === "underway") {
      dateStart = isoDay(shiftDays(-2));
      duration = "14 nights";
      dates = "Lifecycle underway window";
    } else {
      dateStart = isoDay(shiftDays(45));
      duration = "10 nights";
      dates = "Lifecycle upcoming window";
    }

    const accepted = phase !== "accepting";
    const published = phase === "accepting";

    await db
      .insert(sits)
      .values({
        id: sitId,
        vesselId: "solstice-boat",
        dates,
        dateStart,
        duration,
        location: "Lefkada",
        country: "Greece",
        fullAddress: "Berth B12, Lefkas Marina",
        latitude: 38.7066,
        longitude: 20.7019,
        responsibilities: ["Check lines daily", "Air the cabin"],
        requirements: [],
        minYearsExperience: 0,
        requiredExperience: [],
        requiredCertifications: [],
        requiredSkills: [],
        applicants: 2,
        pet: null,
        featured: false,
        published,
        sitType: "liveaboard",
      })
      .onConflictDoUpdate({
        target: sits.id,
        set: {
          dateStart,
          dates,
          duration,
          applicants: 2,
          published,
          cancelledAt: null,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    await db
      .insert(applications)
      .values({
        id: applicationId,
        sitId,
        boatName: "Solstice",
        ownerName: "Maya & Finn",
        applicant: {
          name: "Alex Morgan",
          image: "https://i.pravatar.cc/160?img=11",
          location: "Brighton, United Kingdom",
          bio: "Lifecycle test sitter",
          languages: ["English"],
          preferredCountries: [],
          skills: [],
          yearsExperience: 5,
          certifications: [],
          memberSince: 2020,
          completedSits: 3,
        },
        applicantName: "Alex Morgan",
        initialMessage: "Happy to help with the lifecycle sit.",
        status: accepted ? "accepted" : "new",
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: applications.id,
        set: {
          status: accepted ? "accepted" : "new",
          ownerPhone: null,
        },
      });

    const priorApplicationId = "application-lifecycle-prior-e2e";
    await db
      .insert(applications)
      .values({
        id: priorApplicationId,
        sitId,
        boatName: "Solstice",
        ownerName: "Maya & Finn",
        applicant: {
          name: "Prior Applicant E2E",
          image: "https://i.pravatar.cc/160?img=32",
          location: "Athens, Greece",
          bio: "Prior applicant for lifecycle tests",
          languages: ["English"],
          preferredCountries: [],
          skills: [],
          yearsExperience: 3,
          certifications: [],
          memberSince: 2021,
          completedSits: 1,
        },
        applicantName: "Prior Applicant E2E",
        initialMessage: "I also applied for the lifecycle sit.",
        status: accepted ? "declined" : "new",
        createdAt: new Date(Date.now() - 60_000).toISOString(),
      })
      .onConflictDoUpdate({
        target: applications.id,
        set: {
          status: accepted ? "declined" : "new",
          ownerPhone: null,
        },
      });

    await db
      .update(sits)
      .set({
        applicants: 2,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(sits.id, sitId));

    return c.json({
      ok: true,
      sitId,
      applicationId,
      priorApplicationId,
      phase,
      dateStart,
      duration,
    });
  }

  if (kind === "completed-sit" || kind === "underway-sit") {
    const sitId =
      kind === "completed-sit" ? "sit-completed-archive-e2e" : "sit-underway-emergency-e2e";
    const applicationId =
      kind === "completed-sit"
        ? "application-completed-archive-e2e"
        : "application-underway-emergency-e2e";
    const dateStart = kind === "completed-sit" ? "2026-01-02" : "2026-07-20";
    const dates = kind === "completed-sit" ? "Jan 2 – Jan 7" : "Jul 20 – Jul 30";
    const duration = kind === "completed-sit" ? "5 nights" : "14 nights";

    await db
      .insert(sits)
      .values({
        id: sitId,
        vesselId: "solstice-boat",
        dates,
        dateStart,
        duration,
        location: "Lefkada",
        country: "Greece",
        fullAddress: "Berth B12, Lefkas Marina",
        latitude: 38.7066,
        longitude: 20.7019,
        responsibilities: ["Check lines daily", "Air the cabin"],
        requirements: [],
        minYearsExperience: 0,
        requiredExperience: [],
        requiredCertifications: [],
        requiredSkills: [],
        applicants: 1,
        pet: null,
        featured: false,
        published: true,
        sitType: "liveaboard",
      })
      .onConflictDoUpdate({
        target: sits.id,
        set: {
          dateStart,
          dates,
          duration,
          applicants: 1,
          published: true,
          cancelledAt: null,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    await db
      .insert(applications)
      .values({
        id: applicationId,
        sitId,
        boatName: "Solstice",
        ownerName: "Maya & Finn",
        applicant: {
          name: "Alex Morgan",
          image: "https://i.pravatar.cc/160?img=11",
          location: "Brighton, United Kingdom",
          bio: "Test sitter",
          languages: ["English"],
          preferredCountries: [],
          skills: [],
          yearsExperience: 5,
          certifications: [],
          memberSince: 2020,
          completedSits: 3,
        },
        applicantName: "Alex Morgan",
        initialMessage:
          kind === "completed-sit" ? "Thanks for the completed stay." : "On board and settling in.",
        status: "accepted",
        createdAt:
          kind === "completed-sit" ? "2026-01-01T00:00:00.000Z" : "2026-07-01T00:00:00.000Z",
      })
      .onConflictDoUpdate({
        target: applications.id,
        set: { status: "accepted", ownerPhone: null },
      });

    await db
      .delete(applicationMessages)
      .where(
        and(
          eq(applicationMessages.applicationId, applicationId),
          sql`${applicationMessages.systemKind} in ('sitCancelled', 'sitEndedEarly', 'unaccepted')`,
        ),
      );

    await db.delete(reviews).where(eq(reviews.applicationId, applicationId));

    await db
      .insert(applicationMessages)
      .values({
        id:
          kind === "completed-sit"
            ? "message-completed-archive-e2e"
            : "message-underway-emergency-e2e",
        applicationId,
        senderName: "Alex Morgan",
        text:
          kind === "completed-sit" ? "Thanks for the completed stay." : "On board and settling in.",
        createdAt:
          kind === "completed-sit" ? "2026-01-08T00:00:00.000Z" : "2026-07-20T10:00:00.000Z",
      })
      .onConflictDoUpdate({
        target: applicationMessages.id,
        set: {
          text:
            kind === "completed-sit"
              ? "Thanks for the completed stay."
              : "On board and settling in.",
        },
      });

    return c.json({ ok: true, sitId, applicationId });
  }

  if (kind === "clear-underway-sit") {
    const sitId = "sit-underway-emergency-e2e";
    await db
      .update(sits)
      .set({
        dateStart: "2026-01-02",
        duration: "5 nights",
        dates: "Jan 2 – Jan 7",
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(sits.id, sitId));
    return c.json({ ok: true, sitId, cleared: true });
  }

  if (kind === "paginated-applications") {
    for (let n = 1; n <= 22; n += 1) {
      const id = `application-solstice-page-${n}`;
      const createdAt = `2026-03-${String((n % 28) + 1).padStart(2, "0")}T12:00:00.000Z`;
      const initialMessage = "Hello from the pagination suite.";
      await db
        .insert(applications)
        .values({
          id,
          sitId: "solstice",
          boatName: "Solstice",
          ownerName: "Maya & Finn",
          applicant: {
            name: `Pager Sitter ${n}`,
            image: `https://i.pravatar.cc/160?img=${(n % 70) + 1}`,
            location: "Athens, Greece",
            bio: "Pagination test sitter",
            languages: ["English"],
            preferredCountries: ["Greece"],
            skills: [],
            yearsExperience: n,
            certifications: [],
            memberSince: 2020,
            completedSits: n,
          },
          applicantName: `Pager Sitter ${n}`,
          initialMessage,
          status: "new",
          createdAt,
        })
        .onConflictDoUpdate({
          target: applications.id,
          set: { status: "new" },
        });
      await db
        .insert(applicationMessages)
        .values({
          id: `message-${id}-initial`,
          applicationId: id,
          senderName: `Pager Sitter ${n}`,
          text: initialMessage,
          kind: "user",
          createdAt,
        })
        .onConflictDoNothing();
    }
    return c.json({ ok: true, count: 22 });
  }

  if (kind === "accept-solstice") {
    await db
      .update(applications)
      .set({ status: "accepted" })
      .where(eq(applications.id, "application-alex-solstice"));
    await db
      .update(applications)
      .set({ status: "new", ownerPhone: null })
      .where(
        and(eq(applications.sitId, "solstice"), ne(applications.id, "application-alex-solstice")),
      );
    await db
      .update(sits)
      .set({
        dateStart: "2026-09-12",
        dates: "12 Sep – 4 Oct",
        duration: "22 nights",
        published: false,
        cancelledAt: null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(sits.id, "solstice"));
    return c.json({ ok: true });
  }

  if (kind === "reset-solstice-open") {
    await db
      .update(applications)
      .set({ status: "shortlisted", ownerPhone: null })
      .where(eq(applications.id, "application-alex-solstice"));
    await db
      .update(applications)
      .set({ status: "new", ownerPhone: null })
      .where(eq(applications.id, "application-samira-solstice"));
    await db
      .delete(applicationMessages)
      .where(
        and(
          eq(applicationMessages.applicationId, "application-alex-solstice"),
          eq(applicationMessages.systemKind, "unaccepted"),
        ),
      );
    await db
      .update(sits)
      .set({
        dateStart: "2026-09-12",
        dates: "12 Sep – 4 Oct",
        duration: "22 nights",
        published: true,
        cancelledAt: null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(sits.id, "solstice"));
    return c.json({ ok: true });
  }

  if (kind === "alex-blue-hour-accepted") {
    await db
      .insert(applications)
      .values({
        id: "application-alex-blue-hour",
        sitId: "blue-hour",
        boatName: "Blue Hour",
        ownerName: "Jonas",
        applicant: {
          name: "Alex Morgan",
          image: "https://i.pravatar.cc/160?img=11",
          location: "Brighton, United Kingdom",
          bio: "Sitter",
          languages: ["English"],
          preferredCountries: [],
          skills: [],
          yearsExperience: 7,
          certifications: [],
          memberSince: 2020,
          completedSits: 8,
        },
        applicantName: "Alex Morgan",
        applicantUserId: sessionUser.id,
        initialMessage: "Interested in Blue Hour.",
        status: "accepted",
        createdAt: "2026-07-19T10:00:00.000Z",
      })
      .onConflictDoUpdate({
        target: applications.id,
        set: {
          status: "accepted",
          applicantUserId: sessionUser.id,
        },
      });
    return c.json({ ok: true });
  }

  if (kind === "owner-second-boat") {
    const vesselId = "harbor-light-boat";
    const sitId = "harbor-light";
    await db
      .insert(vessels)
      .values({
        id: vesselId,
        name: "Harbor Light",
        type: "Motor yacht",
        length: "38 ft",
        yearBuilt: 2015,
        homePort: "Corfu, Greece",
        fullAddress: "Gouvia Marina, Corfu 491 00, Greece",
        image:
          "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1400&q=85",
        gallery: [],
        owner: sessionUser.name,
        ownerImage: sessionUser.image ?? "",
        ownerUserId: sessionUser.id,
        rating: 4.7,
        reviews: 4,
        description: "Compact motor yacht for Ionian hops.",
        home: "Two cabins and a bright saloon.",
        systems: ["Inboard diesel", "12V electrical"],
        engineType: "Inboard diesel",
        voltageType: "12 V DC",
        stoveFuelType: "LPG / propane",
        amenities: ["Bathroom", "Full kitchen", "Shore power"],
      })
      .onConflictDoUpdate({
        target: vessels.id,
        set: {
          owner: sessionUser.name,
          ownerImage: sessionUser.image ?? "",
          ownerUserId: sessionUser.id,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    await db
      .insert(sits)
      .values({
        id: sitId,
        vesselId,
        dates: "Oct 1 – Oct 15",
        dateStart: "2026-10-01",
        duration: "14 nights",
        location: "Corfu",
        country: "Greece",
        fullAddress: "Gouvia Marina, Corfu 491 00, Greece",
        latitude: 39.6489,
        longitude: 19.9106,
        responsibilities: ["Check lines daily", "Run engines weekly"],
        requirements: [],
        minYearsExperience: 0,
        requiredExperience: [],
        requiredCertifications: [],
        requiredSkills: [],
        applicants: 0,
        pet: null,
        featured: false,
        published: true,
        sitType: "liveaboard",
      })
      .onConflictDoUpdate({
        target: sits.id,
        set: {
          vesselId,
          dateStart: "2026-10-01",
          duration: "14 nights",
          dates: "Oct 1 – Oct 15",
          applicants: 0,
          published: true,
          cancelledAt: null,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    return c.json({ ok: true, vesselId, sitId });
  }

  if (kind === "owner-boat-no-sits") {
    const vesselId = "quiet-cove-boat";
    await db
      .insert(vessels)
      .values({
        id: vesselId,
        name: "Quiet Cove",
        type: "Sailboat",
        length: "32 ft",
        yearBuilt: 2008,
        homePort: "Athens, Greece",
        fullAddress: "Flisvos Marina, Paleo Faliro 175 61, Greece",
        image:
          "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85",
        gallery: [],
        owner: sessionUser.name,
        ownerImage: sessionUser.image ?? "",
        ownerUserId: sessionUser.id,
        rating: 4.5,
        reviews: 2,
        description: "Quiet day-sailer with no sits listed yet.",
        home: "Simple cabin and cockpit.",
        systems: ["Outboard", "12V electrical"],
        engineType: "Outboard",
        voltageType: "12 V DC",
        stoveFuelType: "Alcohol",
        amenities: ["Bathroom"],
      })
      .onConflictDoUpdate({
        target: vessels.id,
        set: {
          owner: sessionUser.name,
          ownerImage: sessionUser.image ?? "",
          ownerUserId: sessionUser.id,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });

    return c.json({ ok: true, vesselId });
  }

  if (kind === "unclaim-owned-vessels") {
    // Simulate seed/legacy vessels that match by display name but have no ownerUserId
    // (Google login never claimed them). Used to regression-test chat send authz.
    await db
      .update(vessels)
      .set({
        ownerUserId: null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(vessels.owner, sessionUser.name));
    return c.json({ ok: true });
  }

  return c.json({ error: `Unknown fixture kind: ${kind ?? "(missing)"}` }, 400);
});
