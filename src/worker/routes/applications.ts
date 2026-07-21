import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb } from "../db";
import { applicationMessages, applications, sits, vessels } from "../db/schema";

/**
 * Sitter applications and their message threads.
 * Staged-auth caveat applies: sender/applicant identity is client-supplied.
 */
export const applicationsRouter = new Hono<{ Bindings: Env }>();

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
});

const createSchema = z.object({
  sitId: z.string().min(1),
  message: z.string().min(1),
  applicant: applicantSchema,
});

const messageSchema = z.object({
  senderName: z.string().min(1),
  text: z.string().min(1),
});

const statusSchema = z.object({
  status: z.enum(["new", "shortlisted", "accepted", "declined"]),
});

type MessageRow = typeof applicationMessages.$inferSelect;
type ApplicationRow = typeof applications.$inferSelect;

/** Assemble the nested SitApplication the frontend expects. */
function shape(app: ApplicationRow, messages: MessageRow[]) {
  return {
    id: app.id,
    sitId: app.sitId,
    boatName: app.boatName,
    ownerName: app.ownerName,
    applicant: app.applicant,
    initialMessage: app.initialMessage,
    status: app.status,
    createdAt: app.createdAt,
    messages: messages
      .filter((m) => m.applicationId === app.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => ({ id: m.id, senderName: m.senderName, text: m.text, createdAt: m.createdAt })),
  };
}

async function loadMessages(env: Env, ids: string[]): Promise<MessageRow[]> {
  if (ids.length === 0) return [];
  const db = getDb(env);
  const all = await db.select().from(applicationMessages);
  const set = new Set(ids);
  return all.filter((m) => set.has(m.applicationId));
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

applicationsRouter.post("/", zValidator("json", createSchema), async (c) => {
  const db = getDb(c.env);
  const { sitId, message, applicant } = c.req.valid("json");

  // Idempotency: one application per (sit, applicant), matching the mock.
  const existing = await db
    .select()
    .from(applications)
    .where(and(eq(applications.sitId, sitId), eq(applications.applicantName, applicant.name)))
    .limit(1);
  if (existing.length) {
    const msgs = await loadMessages(c.env, [existing[0].id]);
    return c.json({ data: shape(existing[0], msgs) });
  }

  // Resolve the listing to snapshot boat + owner names.
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
    applicant,
    applicantName: applicant.name,
    initialMessage: trimmed,
    status: "new",
    createdAt,
  });
  await db.insert(applicationMessages).values({
    id: `message-${Date.now()}`,
    applicationId: id,
    senderName: applicant.name,
    text: trimmed,
    createdAt,
  });

  const row = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  const msgs = await loadMessages(c.env, [id]);
  return c.json({ data: shape(row!, msgs) }, 201);
});

applicationsRouter.patch("/:id", zValidator("json", statusSchema), async (c) => {
  const db = getDb(c.env);
  const id = c.req.param("id");
  const [row] = await db
    .update(applications)
    .set({ status: c.req.valid("json").status })
    .where(eq(applications.id, id))
    .returning();
  if (!row) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);
  const msgs = await loadMessages(c.env, [id]);
  return c.json({ data: shape(row, msgs) });
});

applicationsRouter.post("/:id/messages", zValidator("json", messageSchema), async (c) => {
  const db = getDb(c.env);
  const id = c.req.param("id");
  const { senderName, text } = c.req.valid("json");

  const app = await db.query.applications.findFirst({ where: eq(applications.id, id) });
  if (!app) return c.json({ error: "APPLICATION_NOT_FOUND" }, 404);

  await db.insert(applicationMessages).values({
    id: `message-${Date.now()}`,
    applicationId: id,
    senderName,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  });

  const msgs = await loadMessages(c.env, [id]);
  return c.json({ data: shape(app, msgs) });
});
