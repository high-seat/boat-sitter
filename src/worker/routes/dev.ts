import { Hono } from "hono";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { AppEnv } from "../context";
import { buildAuth } from "../auth";
import { getDb } from "../db";
import {
  applicationMessages,
  applications,
  sits,
  supportRequests,
  userArchivedSits,
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

const DEV_PASSWORD = "dev-password-boatstead";

/**
 * POST /api/dev/login — email/password sign-in (or sign-up) for local/e2e use.
 * Also claims seed vessels whose display `owner` matches the user's name.
 */
devRouter.post("/login", async (c) => {
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

  const auth = buildAuth(c.env, c.req.raw);

  let authResponse = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  if (!authResponse.ok) {
    authResponse = await auth.api.signUpEmail({
      body: { email, password, name, image },
      asResponse: true,
    });
    // Concurrent e2e workers may create the same user — retry sign-in.
    if (!authResponse.ok) {
      authResponse = await auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      });
    }
  }
  if (!authResponse.ok) {
    const detail = await authResponse.text().catch(() => "");
    return c.json({ error: "Dev login failed", detail: detail || authResponse.statusText }, 400);
  }

  // Re-read session from the Set-Cookie headers Better Auth just issued.
  const setCookies = authResponse.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookies.map((entry) => entry.split(";")[0]).join("; ");
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: cookieHeader || c.req.header("cookie") || "",
    }),
  });
  const sessionUser = session?.user;
  if (!sessionUser) {
    return c.json({ error: "Dev login created no session" }, 500);
  }

  const db = getDb(c.env);
  await db
    .update(vessels)
    .set({
      ownerUserId: sessionUser.id,
      owner: sessionUser.name,
      ownerImage: sessionUser.image ?? image,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(and(eq(vessels.owner, name), isNull(vessels.ownerUserId)));

  await db
    .update(applications)
    .set({ applicantUserId: sessionUser.id })
    .where(and(eq(applications.applicantName, name), isNull(applications.applicantUserId)));

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
        applicants: 1,
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
          applicants: 1,
          published,
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

    await db
      .delete(userArchivedSits)
      .where(and(eq(userArchivedSits.userId, sessionUser.id), eq(userArchivedSits.sitId, sitId)));

    return c.json({ ok: true, sitId, applicationId, phase, dateStart, duration });
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
        set: { status: "accepted" },
      });

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

    // Ensure the sit is not left archived from a previous e2e run.
    await db
      .delete(userArchivedSits)
      .where(and(eq(userArchivedSits.userId, sessionUser.id), eq(userArchivedSits.sitId, sitId)));

    return c.json({ ok: true, sitId, applicationId });
  }

  if (kind === "paginated-applications") {
    for (let n = 1; n <= 22; n += 1) {
      const id = `application-solstice-page-${n}`;
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
          initialMessage: "Hello from the pagination suite.",
          status: "new",
          createdAt: `2026-03-${String((n % 28) + 1).padStart(2, "0")}T12:00:00.000Z`,
        })
        .onConflictDoUpdate({
          target: applications.id,
          set: { status: "new" },
        });
    }
    return c.json({ ok: true, count: 22 });
  }

  if (kind === "accept-solstice") {
    await db
      .update(applications)
      .set({ status: "accepted" })
      .where(eq(applications.id, "application-alex-solstice"));
    await db
      .update(sits)
      .set({ published: false, updatedAt: sql`CURRENT_TIMESTAMP` })
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
      .set({ published: true, updatedAt: sql`CURRENT_TIMESTAMP` })
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

  return c.json({ error: `Unknown fixture kind: ${kind ?? "(missing)"}` }, 400);
});
