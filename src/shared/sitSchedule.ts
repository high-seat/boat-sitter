/** Calendar helpers for sit schedule adjustments (shared by worker + app). */

export function isoLocalDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(dateStart: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStart);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatScheduleDates(start: Date, end: Date, now = new Date()) {
  const currentYear = now.getFullYear();
  const includeYear = start.getFullYear() !== currentYear || end.getFullYear() !== currentYear;
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  if (includeYear) {
    options.year = "numeric";
  }
  const formatter = new Intl.DateTimeFormat("en-US", options);
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

/** Inclusive end date from dateStart + nights parsed from duration. */
export function sitInclusiveEndDate(dateStart: string, duration: string): Date | null {
  const start = parseYmd(dateStart);
  if (!start) return null;
  const nights = Number.parseInt(duration, 10);
  if (!Number.isFinite(nights) || nights < 0) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  return end;
}

export type StartEarlySchedule = {
  dateStart: string;
  duration: string;
  dates: string;
};

/**
 * True when an accepted sit has started and has not yet ended or been cancelled.
 * Used for cancel-sit eligibility (and similar underway-only actions).
 */
export function isSitUnderway(
  input: {
    dateStart: string;
    duration: string;
    accepted?: boolean;
    cancelledAt?: string | null;
  },
  now = new Date(),
): boolean {
  if (input.cancelledAt) return false;
  if (!input.accepted) return false;
  const start = parseYmd(input.dateStart);
  const end = sitInclusiveEndDate(input.dateStart, input.duration);
  if (!start || !end) return false;
  const today = startOfDay(now);
  return today.getTime() >= start.getTime() && today.getTime() <= end.getTime();
}

/**
 * True when sit listing details must not change because the sit is underway,
 * completed, or cancelled (completed). Applicant-based locks are separate.
 */
export function isSitListingEditBlockedByPhase(
  input: {
    dateStart: string;
    duration: string;
    accepted?: boolean;
    cancelledAt?: string | null;
  },
  now = new Date(),
): boolean {
  if (input.cancelledAt) return true;
  if (!input.accepted) return false;
  const start = parseYmd(input.dateStart);
  const end = sitInclusiveEndDate(input.dateStart, input.duration);
  if (!start || !end) return false;
  const today = startOfDay(now);
  return today.getTime() >= start.getTime();
}

/**
 * Move an accepted future sit to start today while keeping the same end date.
 * Returns null when the sit cannot be started early (already started/completed/invalid).
 */
export function computeStartEarlySchedule(
  dateStart: string,
  duration: string,
  now = new Date(),
): StartEarlySchedule | null {
  const start = parseYmd(dateStart);
  const end = sitInclusiveEndDate(dateStart, duration);
  if (!start || !end) return null;

  const today = startOfDay(now);
  if (today.getTime() >= start.getTime()) return null;
  if (today.getTime() > end.getTime()) return null;

  const msPerDay = 24 * 60 * 60 * 1000;
  const nights = Math.max(1, Math.round((end.getTime() - today.getTime()) / msPerDay));
  const newStart = isoLocalDate(today);
  return {
    dateStart: newStart,
    duration: `${nights} nights`,
    dates: formatScheduleDates(today, end, now),
  };
}

export type EndEarlySchedule = {
  dateStart: string;
  duration: string;
  dates: string;
};

/**
 * End an underway sit immediately by moving its inclusive end date to yesterday
 * (so phase becomes sit completed). Keeps the original start when possible; if the
 * sit started today, shifts start back one day so the schedule stays valid.
 * Returns null when the sit is not currently underway.
 */
export function computeEndEarlySchedule(
  dateStart: string,
  duration: string,
  now = new Date(),
): EndEarlySchedule | null {
  const start = parseYmd(dateStart);
  const end = sitInclusiveEndDate(dateStart, duration);
  if (!start || !end) return null;

  const today = startOfDay(now);
  if (today.getTime() < start.getTime()) return null;
  if (today.getTime() > end.getTime()) return null;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const newStart = start.getTime() > yesterday.getTime() ? yesterday : start;
  const msPerDay = 24 * 60 * 60 * 1000;
  const nights = Math.max(0, Math.round((yesterday.getTime() - newStart.getTime()) / msPerDay));
  return {
    dateStart: isoLocalDate(newStart),
    duration: `${nights} nights`,
    dates: formatScheduleDates(newStart, yesterday, now),
  };
}
