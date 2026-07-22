import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
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
function shape(app: ApplicationRow, messages: MessageRow[]) {
  return {
    id: app.id,
    sitId: app.sitId,
    boatName: app.boatName,
    ownerName: app.ownerName,
    partySize: app.partySize ?? 1,
    applicant: {
      ...app.applicant,
      memberSince: app.applicant.memberSince ?? new Date(app.createdAt).getFullYear(),
      completedSits: app.applicant.completedSits ?? 0,
    },
    initialMessage: app.initialMessage,
    status: app.status,
    createdAt: app.createdAt,
    ownerPhone: app.ownerPhone ?? undefined,
    messages: messages
      .filter((m) => m.applicationId === app.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(shapeMessage),
  };
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
 * GET /api/applications?user=…   — applications where user is owner or applicant
 */
applicationsRouter.get("/", async (c) => {
  const db = getDb(c.env);
  const sitId = c.req.query("sitId");
  const user = c.req.query("user");

  let rows: ApplicationRow[];
  if (sitId) {
    rows = await db
      .select()
      .from(applications)
      .where(eq(applications.sitId, sitId))
      .orderBy(desc(applications.createdAt));
  } else if (user) {
    rows = await db
      .select()
      .from(applications)
      .where(or(eq(applications.ownerName, user), eq(applications.applicantName, user)))
      .orderBy(desc(applications.createdAt));
  } else {
    return c.json({ error: "Provide sitId or user" }, 400);
  }

  const messages = await loadMessages(
    c.env,
    rows.map((r) => r.id),
  );
  return c.json({ data: rows.map((r) => shape(r, messages)) });
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
    return c.json({ data: shape(existing[0], msgs) });
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
  return c.json({ data: shape(row!, msgs) }, 201);
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

  const msgs = await loadMessages(c.env, [id]);
  return c.json({ data: shape(row, msgs) });
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
    return c.json({ data: shape(row, msgs) });
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
    return c.json({ data: shape(app, msgs) });
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
    return c.json({ data: shape(app, msgs) });
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

    await insertSystemMessage(c.env, {
      applicationId: id,
      senderName: user.name,
      text: isCounter
        ? `${user.name} suggested a different video call time`
        : `${user.name} proposed a video call`,
      systemKind,
      payload: { videoCall: { startsAt: startsAt.toISOString(), durationMinutes } },
    });

    const msgs = await loadMessages(c.env, [id]);
    return c.json({ data: shape(app, msgs) });
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
  return c.json({ data: shape(app, next) });
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
  return c.json({ data: shape(app, next) });
});
