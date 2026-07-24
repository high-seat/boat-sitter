import type { MockNotification } from "@/mockApi";

/** Chat unread markers live as `newMessage` rows but are shown on the messages
 * nav badge, not in the notifications bell. */
export function isChatMessageNotification(notification: MockNotification): boolean {
  if (notification.type !== "newMessage") return false;
  try {
    return new URL(notification.href, "https://boatstead.local").pathname === "/messages";
  } catch {
    return notification.href.startsWith("/messages");
  }
}

export function applicationIdFromNotificationHref(href: string): string | null {
  try {
    return new URL(href, "https://boatstead.local").searchParams.get("application");
  } catch {
    return null;
  }
}

export function unreadNewMessageCount(notifications: MockNotification[]): number {
  return notifications.filter(
    (notification) => isChatMessageNotification(notification) && !notification.read,
  ).length;
}

export function unreadNewMessageNotificationsForApplication(
  notifications: MockNotification[],
  applicationId: string,
): MockNotification[] {
  return notifications.filter(
    (notification) =>
      isChatMessageNotification(notification) &&
      !notification.read &&
      applicationIdFromNotificationHref(notification.href) === applicationId,
  );
}

export function unreadNewMessageCountForApplication(
  notifications: MockNotification[],
  applicationId: string,
): number {
  return unreadNewMessageNotificationsForApplication(notifications, applicationId).length;
}

export function notificationsForBell(notifications: MockNotification[]): MockNotification[] {
  return notifications.filter((notification) => !isChatMessageNotification(notification));
}
