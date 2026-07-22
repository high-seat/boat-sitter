import { and, desc, eq, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { notifications } from "../db/schema";
import { requireUser } from "../middleware/auth";

export const notificationsRouter = new Hono<AppEnv>();

function shape(row: typeof notifications.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    actor: row.actor ?? undefined,
    boatName: row.boatName ?? undefined,
    href: row.href,
    createdAt: row.createdAt,
    read: Boolean(row.readAt),
  };
}

function forUser(user: { id: string; name: string }) {
  return or(eq(notifications.userId, user.id), eq(notifications.userName, user.name));
}

notificationsRouter.get("/", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const rows = await db
    .select()
    .from(notifications)
    .where(forUser(user))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  // Seed a welcome notification once for brand-new accounts with an empty inbox.
  if (!rows.length) {
    const createdAt = new Date().toISOString();
    const [welcome] = await db
      .insert(notifications)
      .values({
        id: `notification-welcome-${user.id}`,
        userId: user.id,
        userName: user.name,
        type: "welcome",
        href: "/boats",
        createdAt,
        readAt: null,
      })
      .returning();
    return c.json({ data: [shape(welcome)] });
  }

  return c.json({ data: rows.map(shape) });
});

notificationsRouter.post("/read-all", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const readAt = new Date().toISOString();
  await db
    .update(notifications)
    .set({ readAt })
    .where(and(forUser(user), isNull(notifications.readAt)));

  const rows = await db
    .select()
    .from(notifications)
    .where(forUser(user))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return c.json({ data: rows.map(shape) });
});

notificationsRouter.post("/:id/read", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const id = c.req.param("id");
  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, id), forUser(user)),
  });
  if (!existing) return c.json({ error: "Notification not found" }, 404);

  if (!existing.readAt) {
    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date().toISOString() })
      .where(eq(notifications.id, id))
      .returning();
    return c.json({ data: shape(updated) });
  }

  return c.json({ data: shape(existing) });
});
