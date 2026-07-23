import type { MockNotification } from "@/mockApi";

export function applicationIdFromNotificationHref(href: string): string | null {
  try {
    return new URL(href, "https://boatstead.local").searchParams.get("application");
  } catch {
    return null;
  }
}

export function unreadNewMessageCount(notifications: MockNotification[]): number {
  return notifications.filter(
    (notification) => notification.type === "newMessage" && !notification.read,
  ).length;
}

export function unreadNewMessageNotificationsForApplication(
  notifications: MockNotification[],
  applicationId: string,
): MockNotification[] {
  return notifications.filter(
    (notification) =>
      notification.type === "newMessage" &&
      !notification.read &&
      applicationIdFromNotificationHref(notification.href) === applicationId,
  );
}
