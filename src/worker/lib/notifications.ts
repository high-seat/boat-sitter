import { eq } from "drizzle-orm";
import type { Db } from "../db";
import { notifications, profiles, vessels } from "../db/schema";

export type NotificationType =
  | "applicationAccepted"
  | "applicationDeclined"
  | "applicationUnaccepted"
  | "availabilityMatch"
  | "availabilitySitsFound"
  | "newApplication"
  | "newMessage"
  | "sitAccepted"
  | "sitCancelled"
  | "sitReminder"
  | "sitSittersFound"
  | "welcome";

/** The email-preference toggles a user can turn off (profiles.emailNotifications). */
export type EmailPrefKey =
  | "newApplications"
  | "applicationUpdates"
  | "messages"
  | "sitReminders"
  | "productUpdates";

/**
 * Which email-preference toggle gates the email for each notification type.
 * `null` means "always email" (transactional, no user toggle).
 *
 * This is a `Record<NotificationType, …>`, so adding a new NotificationType
 * without deciding its email preference is a COMPILE ERROR. That's deliberate:
 * it stops new notifications from silently bypassing the user's preferences.
 */
export const NOTIFICATION_EMAIL_PREF: Record<NotificationType, EmailPrefKey | null> = {
  applicationAccepted: "applicationUpdates",
  applicationDeclined: "applicationUpdates",
  applicationUnaccepted: "applicationUpdates",
  availabilityMatch: "newApplications",
  availabilitySitsFound: "newApplications",
  newApplication: "newApplications",
  newMessage: "messages",
  sitAccepted: "applicationUpdates",
  sitCancelled: "applicationUpdates",
  sitReminder: "sitReminders",
  sitSittersFound: "newApplications",
  welcome: null,
};

/**
 * Whether the recipient still wants the email for this notification type.
 * Defaults ON (only an explicit `false` in their prefs suppresses it), and
 * always ON for types mapped to `null`.
 */
export async function shouldEmail(
  db: Db,
  userId: string | null | undefined,
  type: NotificationType,
): Promise<boolean> {
  const key = NOTIFICATION_EMAIL_PREF[type];
  if (key === null) return true;
  if (!userId) return true;
  const row = await db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
  const prefs = (row?.emailNotifications ?? {}) as Record<string, boolean>;
  return prefs[key] !== false;
}

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
