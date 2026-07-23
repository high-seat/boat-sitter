import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  APPLICATIONS_PAGE_SIZE,
  paginateApplicationList,
  parseApplicationExperienceFilter,
  parseApplicationListSort,
  parseApplicationStatusFilter,
  prepareApplicationReviewLists,
} from "../../shared/applicationsSearch";
import { isSitUnderway } from "../../shared/sitSchedule";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import {
  applicationMessages,
  applications,
  sits,
  user,
  vessels,
  type MessagePayload,
} from "../db/schema";
import { insertNotification } from "../lib/notifications";
import { sendNotificationEmail } from "../email";
import { createMeetLink } from "../gcal";
import { requireUser } from "../middleware/auth";

/**
 * Sitter applications and their message threads.
 *
 * Writes require login. The applicant's identity (name/image/user id) comes
 * from the session, not the body, so it can't be spoofed. Status changes are
 * restricted to the listing owner; messages to the two participants.
 */
export const applicationsRouter = new Hono<AppEnv>();

const applicantSchema = z.object({
  name: z.string().min(1),
  image: z.string().default(""),
  location: z.string().default(""),
  bio: z.string().default(""),
  languages: z.array(z.string()).default([]),
  preferredCountries: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  yearsExperience: z.number().int().min(0).default(0),
  certifications: z.array(z.string()).default([]),
  memberSince: z.number().int().optional(),
  completedSits: z.number().int().min(0).optional(),
});

const createSchema = z.object({
  sitId: z.string().min(1),
  message: z.string().min(1),
  partySize: z.number().int().min(1).default(1),
  applicant: applicantSchema,
});

const messageSchema = z.object({
  text: z.string().min(1),
});

const statusSchema = z.object({
  status: z.enum(["new", "shortlisted", "accepted", "declined"]),
  ownerPhone: z.string().optional(),
});

const withdrawSchema = z.object({
  explanation: z.string().optional(),
});

const phoneShareSchema = z.object({
  phoneNumber: z.string().min(1),
});

type MessageRow = typeof applicationMessages.$inferSelect;
type ApplicationRow = typeof applications.$inferSelect;

function shapeMessage(m: MessageRow) {
  const payload = (m.payload ?? null) as MessagePayload | null;
  return {
    id: m.id,
    senderName: m.senderName,
    text: m.text,
    createdAt: m.createdAt,
    kind: (m.kind === "system" ? "system" : "user") as "user" | "system",
    systemKind: m.systemKind ?? undefined,
    videoCall: payload?.videoCall,
    sharedPhone: payload?.sharedPhone,
  };
}

/** Assemble the nested SitApplication the frontend expects. */
function shape(
  app: ApplicationRow,
  messages: MessageRow[],
  ownerImages: Map<string, string> = new Map(),
  options?: { viewerName?: string | null; revealShortlist?: boolean },
) {
  const viewerName = options?.viewerName ?? null;
  const revealShortlist =
    options?.revealShortlist === true || Boolean(viewerName && viewerName === app.ownerName);
  // Shortlist is an owner-only tracking flag; never reveal it to applicants.
  const status = app.status === "shortlisted" && !revealShortlist ? "new" : app.status;

  return {
    id: app.id,
    sitId: app.sitId,
    boatName: app.boatName,
    ownerName: app.ownerName,
    ownerImage: ownerImages.get(app.ownerName) || undefined,
    partySize: app.partySize ?? 1,
    applicant: {
      ...app.applicant,
      memberSince: app.applicant.memberSince ?? new Date(app.createdAt).getFullYear(),
      completedSits: app.applicant.completedSits ?? 0,
    },
    initialMessage: app.initialMessage,
    status,
    createdAt: app.createdAt,
    ownerPhone: app.ownerPhone ?? undefined,
    messages: messages
      .filter((m) => m.applicationId === app.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(shapeMessage),
  };
}

async function loadOwnerImages(env: Env, apps: ApplicationRow[]): Promise<Map<string, string>> {
  const names = [...new Set(apps.map((app) => app.ownerName))];
  if (!names.length) return new Map();
  const db = getDb(env);
  const rows = await db
    .select({ owner: vessels.owner, ownerImage: vessels.ownerImage })
    .from(vessels);
  const images = new Map<string, string>();
  for (const row of rows) {
    if (names.includes(row.owner) && row.ownerImage) {
      images.set(row.owner, row.ownerImage);
    }
  }
  return images;
}

async function shapeMany(
  env: Env,
  apps: ApplicationRow[],
  messages: MessageRow[],
  options?: { viewerName?: string | null; revealShortlist?: boolean },
) {
  const ownerImages = await loadOwnerImages(env, apps);
  return apps.map((app) => shape(app, messages, ownerImages, options));
}

async function shapeOne(
  env: Env,
  app: ApplicationRow,
  messages: MessageRow[],
  options?: { viewerName?: string | null; revealShortlist?: boolean },
) {
  const [shaped] = await shapeMany(env, [app], messages, options);
  return shaped;
}

async function loadMessages(env: Env, ids: string[]): Promise<MessageRow[]> {
  if (ids.length === 0) return [];
  const db = getDb(env);
  const all = await db.select().from(applicationMessages);
  const set = new Set(ids);
  return all.filter((m) => set.has(m.applicationId));
}

async function insertSystemMessage(
  env: Env,
  input: {
    applicationId: string;
    senderName: string;
    text: string;
    systemKind: string;
    payload?: MessagePayload | null;
  },
) {
  const db = getDb(env);
  await db.insert(applicationMessages).values({
    id: `message-${input.systemKind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    applicationId: input.applicationId,
    senderName: input.senderName,
    text: input.text,
    kind: "system",
    systemKind: input.systemKind,
    payload: input.payload ?? null,
    createdAt: new Date().toISOString(),
  });
}

/**
 * GET /api/applications?sitId=…  — applications for one listing
 *   Optional: sort, status, experience, page, limit (paginated review filters)
 * GET /api/applications?user=…   — applications where user is owner or applicant
 */
applicationsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const sitId = c.req.query("sitId");
  const user = c.req.query("user");

  if (sitId) {
    const sort = parseApplicationListSort(c.req.query("sort"));
    const status = parseApplicationStatusFilter(c.req.query("status"));
    const experience = parseApplicationExperienceFilter(c.req.query("experience"));
    const pageRaw = c.req.query("page");
    const limitRaw = c.req.query("limit");
    const pageNum = pageRaw != null && pageRaw !== "" ? Number(pageRaw) : 0;
    const limitNum =
      limitRaw != null && limitRaw !== "" ? Number(limitRaw) : APPLICATIONS_PAGE_SIZE;
    const page = Number.isFinite(pageNum) ? pageNum : 0;
    const limit = Number.isFinite(limitNum) ? limitNum : APPLICATIONS_PAGE_SIZE;

    const [rows, sitRow] = await Promise.all([
      db
        .select()
        .from(applications)
        .where(eq(applications.sitId, sitId))
        .orderBy(desc(applications.createdAt)),
      db.select().from(sits).where(eq(sits.id, sitId)).limit(1),
    ]);

    const sit = sitRow[0]
      ? {
          minYearsExperience: sitRow[0].minYearsExperience,
          requiredSkills: sitRow[0].requiredSkills,
          requiredCertifications: sitRow[0].requiredCertifications,
        }
      : undefined;

    const { list, accepted } = prepareApplicationReviewLists(rows, {
      status,
      experience,
      sort,
      sit,
    });
    const paged = paginateApplicationList(list, page, limit);
    const messageIds = [
      ...new Set([...paged.items.map((r) => r.id), ...accepted.map((r) => r.id)]),
    ];
    const messages = await loadMessages(c.env, messageIds);
    const [shapedList, shapedAccepted] = await Promise.all([
      shapeMany(c.env, paged.items, messages, { revealShortlist: true }),
      shapeMany(c.env, accepted, messages, { revealShortlist: true }),
    ]);

    return c.json({
      data: shapedList,
      accepted: shapedAccepted,
      total: paged.total,
      page: paged.page,
      limit: paged.limit,
      totalPages: paged.totalPages,
      sitTotal: rows.length,
    });
  }

  if (user) {
    const rows = await db
      .select()
      .from(applications)
      .where(or(eq(applications.ownerName, user), eq(applications.applicantName, user)))
      .orderBy(desc(applications.createdAt));
    const messages = await loadMessages(
      c.env,
      rows.map((r) => r.id),
    );
    return c.json({ data: await shapeMany(c.env, rows, messages, { viewerName: user }) });
  }

  return c.json({ error: "Provide sitId or user" }, 400);
});

applicationsRouter.post("/", requireUser, zValidator("json", createSchema), async (c) => {
  const db = getDb(c.env);
  const { sitId, message, partySize, applicant } = c.req.valid("json");
  const user = c.get("user")!;

  const applicantName = user.name;
  const safeApplicant = {
    ...applicant,
    name: user.name,
    image: user.image ?? applicant.image,
  };

  const existing = await db
    .select()
    .from(applications)
    .where(and(eq(applications.sitId, sitId), eq(applications.applicantUserId, user.id)))
    .limit(1);
  if (existing.length) {
    const msgs = await loadMessages(c.env, [existing[0].id]);
    return c.json({ data: await shapeOne(c.env, existing[0], msgs, { viewerName: user.name }) });
  }

  const listing = await db
    .select({ vessel: vessels, sit: sits })
    .from(sits)
    .innerJoin(vessels, eq(sits.vesselId, vessels.id))
    .where(eq(sits.id, sitId))
    .limit(1);
  if (!listing.length) return c.json({ error: "APPLICATION_SIT_NOT_FOUND" }, 404);

  const createdAt = new Date().toISOString();
  const id = `application-${sitId}-${Date.now()}`;
  const trimmed = message.trim();

  await db.insert(applications).values({
    id,
    sitId,
    boatName: listing[0].vessel.name,
    ownerName: listing[0].vessel.owner,
    applicant: safeApplicant,
    applicantName,
    applicantUserId: user.id,
    initialMessage: trimmed,
    status: "new",
    partySize,
    createdAt,
  });
  await db.insert(applicationMessages).values({
    id: `message-${Date.now()}`,
    applicationId: id,
    senderName: applicantName,
    text: trimmed,
    kind: "user",
    createdAt,
  });

  await db
    .update(sits)
    .set({ applicants: sql`${sits.applicants} + 1`, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(sits.id, sitId));

  await insertNotification(db, {
    userId: listing[0].vessel.ownerUserId,
    userName: listing[0].vessel.owner,
    type: "newApplication",
    actor: applicantName,
    boatName: listing[0].vessel.name,
    href: `/owner/sits/${sitId}/applications`,
  });

  await sendNotificationEmail(c.env, {
    subject: `New application for ${listing[0].vessel.name}`,
    heading: "You have a new sitter application",
    body: `${applicantName} applied to sit ${listing[0].vessel.name}.`,
    actionUrl: `${c.env.BETTER_AUTH_URL}/owner/sits/${sitId}/applications`,
    actionLabel: "Review application",
    to: await emailForUserId(c.env, listing[0].vessel.ownerUserId),
  });

  const row = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  const msgs = await loadMessages(c.env, [id]);
  return c.json({ data: await shapeOne(c.env, row!, msgs, { viewerName: user.name }) }, 201);
});

/** Look up a logged-in user's real email by their auth user id. */
async function emailForUserId(env: Env, userId: string | null | undefined) {
  if (!userId) return undefined;
  const db = getDb(env);
  const u = await db.query.user.findFirst({ where: eq(user.id, userId) });
  return u?.email ?? undefined;
}

async function ownerIdForApplication(env: Env, appRow: ApplicationRow) {
  const db = getDb(env);
  const sit = await db.query.sits.findFirst({ where: eq(sits.id, appRow.sitId) });
  if (!sit) return null;
  const vessel = await db.query.vessels.findFirst({ where: eq(vessels.id, sit.vesselId) });
  return vessel?.ownerUserId ?? null;
}

applicationsRouter.patch("/:id", requireUser, zValidator("json", statusSchema), async (c) => {
  const db = getDb(c.env);
  const id = c.req.param("id");
  const user = c.get("user")!;
  const { status, ownerPhone } = c.req.valid("json");

  const appRow = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  if (!appRow) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);
  if ((await ownerIdForApplication(c.env, appRow)) !== user.id) {
    return c.json({ error: "Only the listing owner can change this" }, 403);
  }

  // Once a sit is underway (or already cancelled), owners must cancel the sit
  // rather than unaccept the sitter.
  if (appRow.status === "accepted" && status !== "accepted") {
    const sit = await db.query.sits.findFirst({ where: eq(sits.id, appRow.sitId) });
    if (sit?.cancelledAt) {
      return c.json({ error: "SIT_UNACCEPT_NOT_ALLOWED" }, 400);
    }
    if (
      sit &&
      isSitUnderway({
        dateStart: sit.dateStart,
        duration: sit.duration,
        accepted: true,
        cancelledAt: sit.cancelledAt,
      })
    ) {
      return c.json({ error: "SIT_UNACCEPT_NOT_ALLOWED" }, 400);
    }
  }

  const [row] = await db
    .update(applications)
    .set({
      status,
      ownerPhone: status === "accepted" ? ownerPhone?.trim() || null : null,
    })
    .where(eq(applications.id, id))
    .returning();

  if (status === "accepted") {
    await insertSystemMessage(c.env, {
      applicationId: id,
      senderName: user.name,
      text: `${user.name} accepted this application`,
      systemKind: "accepted",
    });
    const openSiblings = await db
      .select()
      .from(applications)
      .where(eq(applications.sitId, appRow.sitId));
    for (const sibling of openSiblings) {
      if (sibling.id === id) continue;
      if (sibling.status !== "new" && sibling.status !== "shortlisted") continue;
      await insertSystemMessage(c.env, {
        applicationId: sibling.id,
        senderName: user.name,
        text: "Applications for this sit are now closed",
        systemKind: "applicantsClosed",
      });
    }
    await db
      .update(sits)
      .set({ published: false, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(sits.id, appRow.sitId));

    if (appRow.applicantUserId) {
      await insertNotification(db, {
        userId: appRow.applicantUserId,
        userName: appRow.applicantName,
        type: "applicationAccepted",
        actor: user.name,
        boatName: appRow.boatName,
        href: `/messages?application=${id}`,
      });
    }
    await insertNotification(db, {
      userId: user.id,
      userName: user.name,
      type: "sitAccepted",
      actor: appRow.applicantName,
      boatName: appRow.boatName,
      href: `/owner/sits/${appRow.sitId}/applications`,
    });
    await sendNotificationEmail(c.env, {
      subject: `Your application for ${appRow.boatName} was accepted`,
      heading: "Your application was accepted 🎉",
      body: `${user.name} accepted your application to sit ${appRow.boatName}.`,
      actionUrl: `${c.env.BETTER_AUTH_URL}/messages?application=${id}`,
      actionLabel: "Open conversation",
      to: await emailForUserId(c.env, appRow.applicantUserId),
    });
  } else if (status === "declined") {
    await insertSystemMessage(c.env, {
      applicationId: id,
      senderName: user.name,
      text: `${user.name} declined this application`,
      systemKind: "declined",
    });
    if (appRow.applicantUserId) {
      await insertNotification(db, {
        userId: appRow.applicantUserId,
        userName: appRow.applicantName,
        type: "applicationDeclined",
        actor: user.name,
        boatName: appRow.boatName,
        href: `/messages?application=${id}`,
      });
    }
    await sendNotificationEmail(c.env, {
      subject: `Update on your application for ${appRow.boatName}`,
      heading: "Application update",
      body: `Your application to sit ${appRow.boatName} was not taken forward this time.`,
      actionUrl: `${c.env.BETTER_AUTH_URL}/messages?application=${id}`,
      actionLabel: "View details",
      to: await emailForUserId(c.env, appRow.applicantUserId),
    });
  }

  // Unaccept / move away from accepted: notify applicant, then reopen when nobody else is accepted.
  if (appRow.status === "accepted" && status !== "accepted") {
    // Decline already posts its own system message + notification above.
    if (status !== "declined") {
      await insertSystemMessage(c.env, {
        applicationId: id,
        senderName: user.name,
        text: `${user.name} unaccepted this application`,
        systemKind: "unaccepted",
      });
      await insertNotification(db, {
        userId: appRow.applicantUserId,
        userName: appRow.applicantName,
        type: "applicationUnaccepted",
        actor: user.name,
        boatName: appRow.boatName,
        href: `/messages?application=${id}`,
      });
    }

    const stillAccepted = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.sitId, appRow.sitId),
          eq(applications.status, "accepted"),
          ne(applications.id, id),
        ),
      )
      .limit(1);
    if (!stillAccepted.length) {
      await db
        .update(sits)
        .set({ published: true, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(sits.id, appRow.sitId));
    }
  }

  const msgs = await loadMessages(c.env, [id]);
  return c.json({ data: await shapeOne(c.env, row, msgs, { viewerName: user.name }) });
});

applicationsRouter.post(
  "/:id/withdraw",
  requireUser,
  zValidator("json", withdrawSchema),
  async (c) => {
    const db = getDb(c.env);
    const id = c.req.param("id");
    const user = c.get("user")!;
    const { explanation } = c.req.valid("json");

    const app = await db.query.applications.findFirst({ where: eq(applications.id, id) });
    if (!app) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);
    if (app.applicantUserId !== user.id) {
      return c.json({ error: "WITHDRAW_NOT_ALLOWED" }, 403);
    }
    if (app.status === "withdrawn" || app.status === "declined") {
      return c.json({ error: "WITHDRAW_NOT_ALLOWED" }, 400);
    }

    const wasAccepted = app.status === "accepted";
    const [row] = await db
      .update(applications)
      .set({ status: "withdrawn", ownerPhone: null })
      .where(eq(applications.id, id))
      .returning();

    await insertSystemMessage(c.env, {
      applicationId: id,
      senderName: user.name,
      text: explanation?.trim() ?? "",
      systemKind: "withdrawn",
    });

    const sit = await db.query.sits.findFirst({ where: eq(sits.id, app.sitId) });
    if (sit) {
      await db
        .update(sits)
        .set({
          applicants: Math.max(0, sit.applicants - 1),
          ...(wasAccepted ? { published: true } : {}),
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(sits.id, app.sitId));
    }

    const ownerId = await ownerIdForApplication(c.env, app);
    await insertNotification(db, {
      userId: ownerId,
      userName: app.ownerName,
      type: "newMessage",
      actor: user.name,
      boatName: app.boatName,
      href: `/messages?application=${id}`,
    });

    const msgs = await loadMessages(c.env, [id]);
    return c.json({ data: await shapeOne(c.env, row, msgs, { viewerName: user.name }) });
  },
);

applicationsRouter.post(
  "/:id/messages",
  requireUser,
  zValidator("json", messageSchema),
  async (c) => {
    const db = getDb(c.env);
    const id = c.req.param("id");
    const { text } = c.req.valid("json");
    const user = c.get("user")!;

    const app = await db.query.applications.findFirst({ where: eq(applications.id, id) });
    if (!app) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);

    const ownerId = await ownerIdForApplication(c.env, app);
    const isParticipant = user.id === app.applicantUserId || user.id === ownerId;
    if (!isParticipant) {
      return c.json({ error: "You are not part of this conversation" }, 403);
    }

    await db.insert(applicationMessages).values({
      id: `message-${Date.now()}`,
      applicationId: id,
      senderName: user.name,
      text: text.trim(),
      kind: "user",
      createdAt: new Date().toISOString(),
    });

    const recipientName = user.id === app.applicantUserId ? app.ownerName : app.applicantName;
    const recipientId = user.id === app.applicantUserId ? ownerId : app.applicantUserId;
    await insertNotification(db, {
      userId: recipientId,
      userName: recipientName,
      type: "newMessage",
      actor: user.name,
      boatName: app.boatName,
      href: `/messages?application=${id}`,
    });
    await sendNotificationEmail(c.env, {
      subject: `New message about ${app.boatName}`,
      heading: `New message from ${user.name}`,
      body: `${user.name} sent you a message about ${app.boatName}.`,
      actionUrl: `${c.env.BETTER_AUTH_URL}/messages?application=${id}`,
      actionLabel: "Reply",
      to: await emailForUserId(c.env, recipientId),
    });

    const msgs = await loadMessages(c.env, [id]);
    return c.json({ data: await shapeOne(c.env, app, msgs, { viewerName: user.name }) });
  },
);

applicationsRouter.post(
  "/:id/phone",
  requireUser,
  zValidator("json", phoneShareSchema),
  async (c) => {
    const db = getDb(c.env);
    const id = c.req.param("id");
    const { phoneNumber } = c.req.valid("json");
    const user = c.get("user")!;

    const app = await db.query.applications.findFirst({ where: eq(applications.id, id) });
    if (!app) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);

    const ownerId = await ownerIdForApplication(c.env, app);
    const isParticipant = user.id === app.applicantUserId || user.id === ownerId;
    if (!isParticipant) {
      return c.json({ error: "You are not part of this conversation" }, 403);
    }

    const sharedPhone = phoneNumber.trim();
    if (!sharedPhone) return c.json({ error: "PHONE_NUMBER_REQUIRED" }, 400);

    await insertSystemMessage(c.env, {
      applicationId: id,
      senderName: user.name,
      text: `${user.name} shared their phone number`,
      systemKind: "phoneShared",
      payload: { sharedPhone },
    });

    const recipientName = user.id === app.applicantUserId ? app.ownerName : app.applicantName;
    const recipientId = user.id === app.applicantUserId ? ownerId : app.applicantUserId;
    await insertNotification(db, {
      userId: recipientId,
      userName: recipientName,
      type: "newMessage",
      actor: user.name,
      boatName: app.boatName,
      href: `/messages?application=${id}`,
    });

    const msgs = await loadMessages(c.env, [id]);
    return c.json({ data: await shapeOne(c.env, app, msgs, { viewerName: user.name }) });
  },
);

const videoCallSchema = z.object({
  startsAt: z.string().min(1),
  durationMinutes: z.number().min(5).max(180),
  counter: z.boolean().optional(),
});

applicationsRouter.post(
  "/:id/video-call",
  requireUser,
  zValidator("json", videoCallSchema),
  async (c) => {
    const db = getDb(c.env);
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const user = c.get("user")!;

    const app = await db.query.applications.findFirst({ where: eq(applications.id, id) });
    if (!app) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);
    const ownerId = await ownerIdForApplication(c.env, app);
    if (user.id !== app.applicantUserId && user.id !== ownerId) {
      return c.json({ error: "You are not part of this conversation" }, 403);
    }

    const startsAt = new Date(body.startsAt);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      return c.json({ error: "VIDEO_CALL_TIME_PAST" }, 400);
    }
    const durationMinutes = Math.max(5, Math.round(body.durationMinutes));
    const isCounter = Boolean(body.counter);
    const systemKind = isCounter ? "videoCallCounter" : "videoCallRequest";

    // If the proposer signed in with Google (with calendar access), create a
    // real Google Meet + calendar invite for the other party. Returns null and
    // degrades gracefully for non-Google users or any API issue.
    const otherId = user.id === app.applicantUserId ? ownerId : app.applicantUserId;
    const attendeeEmail = await emailForUserId(c.env, otherId);
    const meetUrl = await createMeetLink(c.env, user.id, {
      summary: `Boatstead video call — ${app.boatName}`,
      startsAt: startsAt.toISOString(),
      durationMinutes,
      attendeeEmail,
    });

    await insertSystemMessage(c.env, {
      applicationId: id,
      senderName: user.name,
      text: isCounter
        ? `${user.name} suggested a different video call time`
        : `${user.name} proposed a video call`,
      systemKind,
      payload: {
        videoCall: {
          startsAt: startsAt.toISOString(),
          durationMinutes,
          ...(meetUrl ? { meetUrl } : {}),
        },
      },
    });

    const msgs = await loadMessages(c.env, [id]);
    return c.json({ data: await shapeOne(c.env, app, msgs, { viewerName: user.name }) });
  },
);

applicationsRouter.post("/:id/video-call/:messageId/accept", requireUser, async (c) => {
  const db = getDb(c.env);
  const id = c.req.param("id");
  const messageId = c.req.param("messageId");
  const user = c.get("user")!;

  const app = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  if (!app) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);
  const ownerId = await ownerIdForApplication(c.env, app);
  if (user.id !== app.applicantUserId && user.id !== ownerId) {
    return c.json({ error: "You are not part of this conversation" }, 403);
  }

  const msgs = await loadMessages(c.env, [id]);
  const proposal = msgs.find((m) => m.id === messageId);
  const payload = (proposal?.payload ?? null) as {
    videoCall?: { startsAt: string; durationMinutes: number };
  } | null;
  if (
    !proposal ||
    !payload?.videoCall ||
    (proposal.systemKind !== "videoCallRequest" && proposal.systemKind !== "videoCallCounter")
  ) {
    return c.json({ error: "VIDEO_CALL_PROPOSAL_NOT_FOUND" }, 404);
  }
  if (proposal.senderName === user.name) {
    return c.json({ error: "VIDEO_CALL_CANNOT_ACCEPT_OWN" }, 400);
  }

  await insertSystemMessage(c.env, {
    applicationId: id,
    senderName: user.name,
    text: `${user.name} accepted the video call time`,
    systemKind: "videoCallAccepted",
    payload: { videoCall: { ...payload.videoCall } },
  });

  const next = await loadMessages(c.env, [id]);
  return c.json({ data: await shapeOne(c.env, app, next, { viewerName: user.name }) });
});

applicationsRouter.post("/:id/video-call/:messageId/decline", requireUser, async (c) => {
  const id = c.req.param("id");
  const messageId = c.req.param("messageId");
  const user = c.get("user")!;

  const db = getDb(c.env);
  const app = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  if (!app) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);
  const ownerId = await ownerIdForApplication(c.env, app);
  if (user.id !== app.applicantUserId && user.id !== ownerId) {
    return c.json({ error: "You are not part of this conversation" }, 403);
  }

  const msgs = await loadMessages(c.env, [id]);
  const proposal = msgs.find((m) => m.id === messageId);
  const payload = (proposal?.payload ?? null) as {
    videoCall?: { startsAt: string; durationMinutes: number };
  } | null;
  if (
    !proposal ||
    !payload?.videoCall ||
    (proposal.systemKind !== "videoCallRequest" && proposal.systemKind !== "videoCallCounter")
  ) {
    return c.json({ error: "VIDEO_CALL_PROPOSAL_NOT_FOUND" }, 404);
  }
  if (proposal.senderName === user.name) {
    return c.json({ error: "VIDEO_CALL_CANNOT_DECLINE_OWN" }, 400);
  }

  await insertSystemMessage(c.env, {
    applicationId: id,
    senderName: user.name,
    text: `${user.name} declined the video call proposal`,
    systemKind: "videoCallDeclined",
    payload: { videoCall: { ...payload.videoCall } },
  });

  const next = await loadMessages(c.env, [id]);
  return c.json({ data: await shapeOne(c.env, app, next, { viewerName: user.name }) });
});
