import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  MessageCircle,
  ShipWheel,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { NavCountBadge } from "@/components/ui/NavCountBadge";
import { NotificationsMenuSkeleton } from "@/components/ui/NotificationsMenuSkeleton";
import { getIntlLocale } from "@/i18n";
import { markAllNotificationsRead, markNotificationRead, type MockNotification } from "@/mockApi";
import { queries } from "@/queries";
import { useAppStore } from "@/store";

function NotificationIcon({ type }: { type: MockNotification["type"] }) {
  const className = "size-4";
  if (type === "newMessage") return <MessageCircle className={className} />;
  if (type === "newApplication") return <UserPlus className={className} />;
  if (type === "sitReminder") return <CalendarClock className={className} />;
  if (type === "welcome") return <ShipWheel className={className} />;
  if (type === "applicationDeclined" || type === "applicationUnaccepted") {
    return <XCircle className={className} />;
  }
  return <CheckCircle2 className={className} />;
}

export function NotificationsMenu() {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user)!;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notificationsQuery = queries.notifications.user(user.name);
  const queryKey = notificationsQuery.queryKey;
  const { data, isPending, isFetching } = useQuery(notificationsQuery);
  const notifications = data ?? [];
  const showSkeleton = isPending || (isFetching && data === undefined);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const relativeTime = new Intl.RelativeTimeFormat(getIntlLocale(i18n.language), {
    numeric: "auto",
  });

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, user.name),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MockNotification[]>(queryKey);
      queryClient.setQueryData<MockNotification[]>(queryKey, (current = []) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user.name),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MockNotification[]>(queryKey);
      queryClient.setQueryData<MockNotification[]>(queryKey, (current = []) =>
        current.map((item) => ({ ...item, read: true })),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  function formatRelativeTime(createdAt: string) {
    const minutes = Math.round((new Date(createdAt).getTime() - Date.now()) / 60_000);
    if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour");
    return relativeTime.format(Math.round(hours / 24), "day");
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
          <NavCountBadge count={unreadCount} />
        </button>
      </IconTooltip>
      {open && (
        <div
          aria-label={t("notifications.heading")}
          className="fixed top-[4.75rem] right-4 left-4 z-60 flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-float md:absolute md:top-[calc(100%+0.5rem)] md:right-0 md:left-auto md:w-80 md:max-w-[calc(100vw-2rem)] md:max-h-none"
          role="menu"
        >
          <p className="shrink-0 border-b border-line px-4 py-3 font-display text-sm font-bold text-navy">
            {t("notifications.heading")}
          </p>
          {showSkeleton ? <NotificationsMenuSkeleton /> : null}
          {!showSkeleton && notifications.length ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto p-2 md:max-h-96 md:flex-none">
                {notifications.map((notification) => (
                  <Link
                    className="relative flex gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-cream"
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) markOne.mutate(notification.id);
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
                    {!notification.read && (
                      <span
                        aria-hidden="true"
                        className="absolute top-4 right-3 size-2 rounded-full bg-coral"
                      />
                    )}
                  </Link>
                ))}
              </div>
              <div className="shrink-0 border-t border-line p-2">
                <button
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-bold text-teal transition hover:bg-cream disabled:cursor-default disabled:text-slate disabled:hover:bg-transparent"
                  disabled={unreadCount === 0 || markAll.isPending}
                  onClick={() => markAll.mutate()}
                  type="button"
                >
                  {t("notifications.markAllRead")}
                </button>
              </div>
            </>
          ) : null}
          {!showSkeleton && !notifications.length ? (
            <p className="m-4 rounded-xl bg-cream px-4 py-5 text-center text-sm text-slate">
              {t("notifications.empty")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
