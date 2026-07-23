import { eq } from "drizzle-orm";
import type { Db } from "../db";
import { notifications, vessels } from "../db/schema";

export type NotificationType =
  | "applicationAccepted"
  | "applicationDeclined"
  | "applicationUnaccepted"
  | "newApplication"
  | "newMessage"
  | "sitAccepted"
  | "sitReminder"
  | "welcome";

export async function insertNotification(
  db: Db,
  input: {
    userId?: string | null;
    userName: string;
    type: NotificationType;
    actor?: string;
    boatName?: string;
    href: string;
  },
) {
  // Prefer resolving a user id from vessels when only a display name is known
  // (owners of seed rows may lack a user id).
  let userId = input.userId ?? null;
  if (!userId) {
    const vessel = await db.query.vessels.findFirst({
      where: eq(vessels.owner, input.userName),
    });
    userId = vessel?.ownerUserId ?? null;
  }
  if (!userId) {
    // Still store by display name so GET ?user= works before profile exists.
    userId = `name:${input.userName}`;
  }

  await db.insert(notifications).values({
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    userName: input.userName,
    type: input.type,
    actor: input.actor,
    boatName: input.boatName,
    href: input.href,
    createdAt: new Date().toISOString(),
  });
}
