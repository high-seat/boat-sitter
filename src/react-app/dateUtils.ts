export function isHappeningSoon(dateStart: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStart);
  if (!match) return false;
  const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    target.getFullYear() !== Number(match[1]) ||
    target.getMonth() !== Number(match[2]) - 1 ||
    target.getDate() !== Number(match[3])
  ) {
    return false;
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 30);
  return target >= today && target <= limit;
}

export function startOfLocalDay(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parseSitDate(dateStart: string) {
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

export function sitEndDate(dateStart: string, duration: string) {
  const start = parseSitDate(dateStart);
  if (!start) return null;
  const nights = Number.parseInt(duration, 10);
  if (!Number.isFinite(nights) || nights < 0) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  return end;
}

export type SitDateRange = {
  dateStart: string;
  duration: string;
};

/** Inclusive calendar-day overlap using dateStart and nights from duration. */
export function sitDateRangesOverlap(a: SitDateRange, b: SitDateRange) {
  const aStart = parseSitDate(a.dateStart);
  const aEnd = sitEndDate(a.dateStart, a.duration);
  const bStart = parseSitDate(b.dateStart);
  const bEnd = sitEndDate(b.dateStart, b.duration);
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

export type SitPhase =
  | "acceptingApplicants"
  | "applicantChosen"
  | "stayUnderway"
  | "stayCompleted";

export const SIT_PHASES: SitPhase[] = [
  "acceptingApplicants",
  "applicantChosen",
  "stayUnderway",
  "stayCompleted",
];

export function getSitPhase(
  sit: {
    dateStart: string;
    duration: string;
    applicationsOpen?: boolean;
    accepted?: boolean;
    applicants?: number;
  },
  now = new Date(),
): SitPhase {
  const today = startOfLocalDay(now);
  const start = parseSitDate(sit.dateStart);
  const end = sitEndDate(sit.dateStart, sit.duration);

  if (sit.accepted) {
    if (end && today > end) return "stayCompleted";
    if (start && today >= start) return "stayUnderway";
    return "applicantChosen";
  }

  return "acceptingApplicants";
}

export const REVIEW_WINDOW_DAYS = 7;

export function getReviewDeadline(dateStart: string, duration: string) {
  const end = sitEndDate(dateStart, duration);
  if (!end) return null;
  const deadline = new Date(end);
  deadline.setDate(deadline.getDate() + REVIEW_WINDOW_DAYS);
  return deadline;
}

export function isSitCompletedForReview(
  sit: { dateStart: string; duration: string; accepted?: boolean },
  now = new Date(),
) {
  return getSitPhase(sit, now) === "stayCompleted";
}

export function isWithinReviewWindow(
  sit: { dateStart: string; duration: string; accepted?: boolean },
  now = new Date(),
) {
  if (!isSitCompletedForReview(sit, now)) return false;
  const deadline = getReviewDeadline(sit.dateStart, sit.duration);
  if (!deadline) return false;
  return startOfLocalDay(now) <= deadline;
}

export function reviewDaysRemaining(
  sit: { dateStart: string; duration: string },
  now = new Date(),
) {
  const deadline = getReviewDeadline(sit.dateStart, sit.duration);
  if (!deadline) return 0;
  const today = startOfLocalDay(now);
  if (today > deadline) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((deadline.getTime() - today.getTime()) / msPerDay) + 1;
}

export function canLeaveReview(
  sit:
    | {
        dateStart: string;
        duration: string;
        accepted?: boolean;
        phase?: SitPhase;
      }
    | null
    | undefined,
  now = new Date(),
) {
  if (!sit) return false;
  const phase = sit.phase ?? getSitPhase(sit, now);
  return phase === "stayCompleted" && isWithinReviewWindow(sit, now);
}
