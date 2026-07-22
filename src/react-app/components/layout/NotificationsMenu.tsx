import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  MessageCircle,
  ShipWheel,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { getIntlLocale } from "@/i18n";
import { getNotificationsForUser, type MockNotification } from "@/mockApi";
import { useAppStore } from "@/store";

function NotificationIcon({ type }: { type: MockNotification["type"] }) {
  const className = "size-4";
  if (type === "newMessage") return <MessageCircle className={className} />;
  if (type === "newApplication") return <UserPlus className={className} />;
  if (type === "sitReminder") return <CalendarClock className={className} />;
  if (type === "welcome") return <ShipWheel className={className} />;
  return <CheckCircle2 className={className} />;
}

export function NotificationsMenu() {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user)!;
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`boatstead-seen-notifications:${user.name}`) ?? "[]");
    } catch {
      return [];
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user.name],
    queryFn: () => getNotificationsForUser(user.name),
  });
  const unreadCount = notifications.filter(
    (notification) => !seenIds.includes(notification.id),
  ).length;
  const relativeTime = new Intl.RelativeTimeFormat(getIntlLocale(i18n.language), {
    numeric: "auto",
  });

  useEffect(() => {
    try {
      setSeenIds(
        JSON.parse(localStorage.getItem(`boatstead-seen-notifications:${user.name}`) ?? "[]"),
      );
    } catch {
      setSeenIds([]);
    }
  }, [user.name]);

  function formatRelativeTime(createdAt: string) {
    const minutes = Math.round((new Date(createdAt).getTime() - Date.now()) / 60_000);
    if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour");
    return relativeTime.format(Math.round(hours / 24), "day");
  }

  function markSeen(id: string) {
    if (seenIds.includes(id)) return;
    const nextSeenIds = [...seenIds, id];
    setSeenIds(nextSeenIds);
    localStorage.setItem(`boatstead-seen-notifications:${user.name}`, JSON.stringify(nextSeenIds));
  }

  function markAllSeen() {
    if (!notifications.length) return;
    const nextSeenIds = [
      ...new Set([...seenIds, ...notifications.map((notification) => notification.id)]),
    ];
    setSeenIds(nextSeenIds);
    localStorage.setItem(`boatstead-seen-notifications:${user.name}`, JSON.stringify(nextSeenIds));
  }

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <IconTooltip hidden={open} label={t("notifications.heading")}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={t("notifications.open")}
          className="relative inline-flex items-center justify-center rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-extrabold leading-none text-white ring-2 ring-cream"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </IconTooltip>
      {open && (
        <div
          aria-label={t("notifications.heading")}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-60 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-white shadow-float"
          role="menu"
        >
          <p className="border-b border-line px-4 py-3 font-display text-sm font-bold text-navy">
            {t("notifications.heading")}
          </p>
          {isLoading ? (
            <div className="space-y-2 p-4" aria-hidden="true">
              <div className="h-16 animate-pulse rounded-xl bg-cream" />
              <div className="h-16 animate-pulse rounded-xl bg-cream" />
            </div>
          ) : null}
          {!isLoading && notifications.length ? (
            <>
              <div className="max-h-96 overflow-y-auto p-2">
                {notifications.map((notification) => (
                  <Link
                    className="relative flex gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-cream"
                    key={notification.id}
                    onClick={() => {
                      markSeen(notification.id);
                      setOpen(false);
                    }}
                    role="menuitem"
                    to={notification.href}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-seafoam text-teal">
                      <NotificationIcon type={notification.type} />
                    </span>
                    <span className="min-w-0 pr-2">
                      <span className="block text-sm leading-5 text-navy">
                        {t(`notifications.items.${notification.type}`, {
                          actor: notification.actor,
                          boat: notification.boatName,
                        })}
                      </span>
                      <span className="mt-1 block text-xs text-slate">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                    {!seenIds.includes(notification.id) && (
                      <span
                        aria-hidden="true"
                        className="absolute top-4 right-3 size-2 rounded-full bg-coral"
                      />
                    )}
                  </Link>
                ))}
              </div>
              <div className="border-t border-line p-2">
                <button
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-bold text-teal transition hover:bg-cream disabled:cursor-default disabled:text-slate disabled:hover:bg-transparent"
                  disabled={unreadCount === 0}
                  onClick={markAllSeen}
                  type="button"
                >
                  {t("notifications.markAllRead")}
                </button>
              </div>
            </>
          ) : null}
          {!isLoading && !notifications.length ? (
            <p className="m-4 rounded-xl bg-cream px-4 py-5 text-center text-sm text-slate">
              {t("notifications.empty")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
