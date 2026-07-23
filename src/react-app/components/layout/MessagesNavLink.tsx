import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { NavCountBadge } from "@/components/ui/NavCountBadge";
import { queries } from "@/queries";
import { useAppStore } from "@/store";
import { unreadNewMessageCount } from "@/unreadMessages";

export function MessagesNavLink() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user)!;

  // Keep applications warm site-wide so conversations refresh even off /messages.
  useQuery(queries.applications.user(user.name));

  const { data: notifications = [] } = useQuery(queries.notifications.user(user.name));

  const unreadCount = unreadNewMessageCount(notifications);
  const ariaLabel =
    unreadCount > 0 ? t("nav.messagesWithUnread", { count: unreadCount }) : t("nav.messages");

  return (
    <IconTooltip label={t("nav.messages")}>
      <Link
        aria-label={ariaLabel}
        className="relative inline-flex items-center justify-center rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
        data-testid="messages-nav-link"
        to="/messages"
      >
        <MessageCircle size={19} />
        <NavCountBadge count={unreadCount} testId="messages-unread-count" />
      </Link>
    </IconTooltip>
  );
}
