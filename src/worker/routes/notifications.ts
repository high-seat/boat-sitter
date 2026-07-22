import { desc, eq, or } from "drizzle-orm";
import { Hono } from "hono";
import type { AppEnv } from "../context";
import { getDb } from "../db";
import { notifications } from "../db/schema";
import { requireUser } from "../middleware/auth";

export const notificationsRouter = new Hono<AppEnv>();

notificationsRouter.get("/", requireUser, async (c) => {
  const db = getDb(c.env);
  const user = c.get("user")!;
  const rows = await db
    .select()
    .from(notifications)
    .where(or(eq(notifications.userId, user.id), eq(notifications.userName, user.name)))
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
      })
      .returning();
    return c.json({
      data: [
        {
          id: welcome.id,
          type: welcome.type,
          actor: welcome.actor ?? undefined,
          boatName: welcome.boatName ?? undefined,
          href: welcome.href,
          createdAt: welcome.createdAt,
        },
      ],
    });
  }

  return c.json({
    data: rows.map((row) => ({
      id: row.id,
      type: row.type,
      actor: row.actor ?? undefined,
      boatName: row.boatName ?? undefined,
      href: row.href,
      createdAt: row.createdAt,
    })),
  });
});
