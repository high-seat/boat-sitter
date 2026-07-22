import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  buildAppleCalendarUrl,
  buildGoogleCalendarUrl,
  type VideoCallCalendarEvent,
} from "@/videoCallCalendar";

export function VideoCallCalendarLinks({ event }: { event: VideoCallCalendarEvent }) {
  const { t } = useTranslation();
  const googleUrl = buildGoogleCalendarUrl(event);
  const appleUrl = buildAppleCalendarUrl(event);

  return (
    <div className="mt-3 rounded-xl border border-teal/20 bg-white/70 px-3 py-2.5">
      <p className="flex items-center gap-2 text-xs font-bold text-navy">
        <CalendarDays aria-hidden="true" className="text-teal" size={15} />
        {t("applications.videoCall.addToCalendar")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold text-navy hover:border-teal"
          href={googleUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t("applications.videoCall.googleCalendar")}
        </a>
        <a
          className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold text-navy hover:border-teal"
          download="boatstead-video-call.ics"
          href={appleUrl}
        >
          {t("applications.videoCall.appleCalendar")}
        </a>
      </div>
    </div>
  );
}
