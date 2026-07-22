export type VideoCallCalendarEvent = {
  title: string;
  description: string;
  startsAt: string;
  durationMinutes: number;
};

function toUtcCompact(date: Date) {
  return date
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function eventBounds(event: VideoCallCalendarEvent) {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + Math.max(5, event.durationMinutes) * 60_000);
  return { start, end };
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

export function buildGoogleCalendarUrl(event: VideoCallCalendarEvent) {
  const { start, end } = eventBounds(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toUtcCompact(start)}/${toUtcCompact(end)}`,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildAppleCalendarIcs(event: VideoCallCalendarEvent) {
  const { start, end } = eventBounds(event);
  const uid = `boatstead-video-call-${toUtcCompact(start)}@boatstead.app`;
  const stamp = toUtcCompact(new Date());
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Boatstead//Video Call//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toUtcCompact(start)}`,
    `DTEND:${toUtcCompact(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildAppleCalendarUrl(event: VideoCallCalendarEvent) {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildAppleCalendarIcs(event))}`;
}
