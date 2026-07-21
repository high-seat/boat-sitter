import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconTooltip } from "@/components/ui/IconTooltip";

export function NotificationsMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const notifications: Array<{ id: string; text: string }> = [];

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
    <div className="relative" ref={containerRef}>
      <IconTooltip hidden={open} label={t("notifications.heading")}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={t("notifications.open")}
          className="rounded-full p-2.5 text-slate hover:bg-white hover:text-navy"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <Bell size={19} />
        </button>
      </IconTooltip>
      {open && (
        <div
          aria-label={t("notifications.heading")}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-60 w-72 rounded-2xl border border-line bg-white p-4 shadow-float"
          role="menu"
        >
          <p className="font-display text-sm font-bold text-navy">{t("notifications.heading")}</p>
          {notifications.length ? (
            <div className="mt-3">
              {notifications.map((notification) => (
                <p className="text-sm text-slate" key={notification.id}>
                  {notification.text}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-cream px-4 py-5 text-center text-sm text-slate">
              {t("notifications.empty")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
