import type { MockNotification } from "../../src/react-app/mockApi";
import {
  applicationIdFromNotificationHref,
  isChatMessageNotification,
  notificationsForBell,
  unreadNewMessageCount,
  unreadNewMessageCountForApplication,
  unreadNewMessageNotificationsForApplication,
} from "../../src/react-app/unreadMessages";

function note(
  partial: Partial<MockNotification> & Pick<MockNotification, "id" | "type" | "href" | "read">,
): MockNotification {
  return {
    actor: "Alex Morgan",
    boatName: "Solstice",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe("unreadMessages", () => {
  const chatUnread = note({
    id: "n1",
    type: "newMessage",
    href: "/messages?application=application-alex-solstice",
    read: false,
  });
  const chatRead = note({
    id: "n2",
    type: "newMessage",
    href: "/messages?application=application-alex-solstice",
    read: true,
  });
  const otherChatUnread = note({
    id: "n3",
    type: "newMessage",
    href: "/messages?application=application-other",
    read: false,
  });
  const bellItem = note({
    id: "n4",
    type: "newApplication",
    href: "/owner/sits/solstice/applications",
    read: false,
  });

  it("detects chat message notifications by messages href", () => {
    expect(isChatMessageNotification(chatUnread)).toBe(true);
    expect(isChatMessageNotification(bellItem)).toBe(false);
  });

  it("parses application ids from notification hrefs", () => {
    expect(applicationIdFromNotificationHref(chatUnread.href)).toBe("application-alex-solstice");
    expect(applicationIdFromNotificationHref("/messages")).toBe(null);
  });

  it("counts unread chat messages and scopes them per application", () => {
    const notifications = [chatUnread, chatRead, otherChatUnread, bellItem];
    expect(unreadNewMessageCount(notifications)).toBe(2);
    expect(unreadNewMessageCountForApplication(notifications, "application-alex-solstice")).toBe(1);
    expect(unreadNewMessageCountForApplication(notifications, "application-other")).toBe(1);
    expect(unreadNewMessageCountForApplication(notifications, "missing")).toBe(0);
    expect(
      unreadNewMessageNotificationsForApplication(notifications, "application-alex-solstice").map(
        (item) => item.id,
      ),
    ).toEqual(["n1"]);
  });

  it("keeps chat unread markers out of the notifications bell", () => {
    expect(notificationsForBell([chatUnread, bellItem]).map((item) => item.id)).toEqual(["n4"]);
  });
});
