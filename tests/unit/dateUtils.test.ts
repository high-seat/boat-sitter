import {
  canLeaveReview,
  daysUntilSitStarts,
  formatDisplayDate,
  formatInclusiveDateRange,
  formatSitDates,
  getReviewDeadline,
  getSitPhase,
  isHappeningSoon,
  isSitEndedMoreThanDaysAgo,
  isWithinReviewWindow,
  parseSitDate,
  reviewDaysRemaining,
  sitDateRangesOverlap,
  sitDayProgress,
  sitEndDate,
  startOfLocalDay,
} from "../../src/react-app/dateUtils";

describe("parseSitDate", () => {
  it("parses a valid local YMD date", () => {
    const date = parseSitDate("2026-07-15");
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(6);
    expect(date!.getDate()).toBe(15);
  });

  it("rejects invalid calendar dates and formats", () => {
    expect(parseSitDate("2026-02-30")).toBeNull();
    expect(parseSitDate("07/15/2026")).toBeNull();
    expect(parseSitDate("")).toBeNull();
  });
});

describe("sitEndDate", () => {
  it("adds nights inclusively from dateStart", () => {
    const end = sitEndDate("2026-07-01", "3 nights");
    expect(end).not.toBeNull();
    expect(end!.getFullYear()).toBe(2026);
    expect(end!.getMonth()).toBe(6);
    expect(end!.getDate()).toBe(4);
  });

  it("returns null for bad inputs", () => {
    expect(sitEndDate("bad", "3 nights")).toBeNull();
    expect(sitEndDate("2026-07-01", "nights")).toBeNull();
    expect(sitEndDate("2026-07-01", "-1 nights")).toBeNull();
  });
});

describe("startOfLocalDay / isHappeningSoon", () => {
  it("strips time from a Date", () => {
    const noon = new Date(2026, 6, 24, 12, 30);
    const start = startOfLocalDay(noon);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getDate()).toBe(24);
  });

  it("is true for starts within the next 30 days inclusive", () => {
    const now = new Date(2026, 6, 24, 15);
    expect(isHappeningSoon("2026-07-24", now)).toBe(true);
    expect(isHappeningSoon("2026-08-23", now)).toBe(true);
    expect(isHappeningSoon("2026-08-24", now)).toBe(false);
    expect(isHappeningSoon("2026-07-23", now)).toBe(false);
  });
});

describe("formatDisplayDate / formatInclusiveDateRange / formatSitDates", () => {
  it("omits year for a single date in the current year", () => {
    const now = new Date(2026, 6, 1);
    expect(formatDisplayDate("en-US", new Date(2026, 11, 30), now)).toBe("Dec 30");
  });

  it("includes year for a single date outside the current year", () => {
    const now = new Date(2026, 6, 1);
    expect(formatDisplayDate("en-US", new Date(2027, 0, 8), now)).toBe("Jan 8, 2027");
  });

  it("omits year when both ends are in the current year", () => {
    const now = new Date(2026, 6, 1);
    const text = formatInclusiveDateRange("en-US", new Date(2026, 0, 5), new Date(2026, 1, 2), now);
    expect(text).toBe("Jan 5 – Feb 2");
  });

  it("includes year when either end is outside the current year", () => {
    const now = new Date(2026, 6, 1);
    const text = formatInclusiveDateRange(
      "en-US",
      new Date(2026, 11, 28),
      new Date(2027, 0, 4),
      now,
    );
    expect(text).toBe("Dec 28, 2026 – Jan 4, 2027");
  });

  it("formats sit dates from dateStart + duration", () => {
    const now = new Date(2026, 6, 1);
    expect(formatSitDates("en-US", "2026-01-05", "28 nights", now)).toBe("Jan 5 – Feb 2");
  });
});

describe("sitDateRangesOverlap", () => {
  it("detects inclusive overlap", () => {
    expect(
      sitDateRangesOverlap(
        { dateStart: "2026-07-01", duration: "5 nights" },
        { dateStart: "2026-07-06", duration: "2 nights" },
      ),
    ).toBe(true);
    expect(
      sitDateRangesOverlap(
        { dateStart: "2026-07-01", duration: "5 nights" },
        { dateStart: "2026-07-07", duration: "2 nights" },
      ),
    ).toBe(false);
  });
});

describe("getSitPhase", () => {
  const base = { dateStart: "2026-07-10", duration: "5 nights" };

  it("returns stayCompleted when cancelled", () => {
    expect(getSitPhase({ ...base, cancelledAt: "2026-07-01T00:00:00Z" })).toBe("stayCompleted");
  });

  it("returns acceptingApplicants when not accepted", () => {
    expect(getSitPhase(base, new Date(2026, 6, 1))).toBe("acceptingApplicants");
  });

  it("returns applicantChosen / stayUnderway / stayCompleted for accepted sits", () => {
    const accepted = { ...base, accepted: true };
    expect(getSitPhase(accepted, new Date(2026, 6, 1))).toBe("applicantChosen");
    expect(getSitPhase(accepted, new Date(2026, 6, 10))).toBe("stayUnderway");
    expect(getSitPhase(accepted, new Date(2026, 6, 16))).toBe("stayCompleted");
  });
});

describe("review window helpers", () => {
  const sit = { dateStart: "2026-07-01", duration: "5 nights", accepted: true };
  // end = Jul 6; deadline = Jul 13

  it("computes review deadline seven days after inclusive end", () => {
    const deadline = getReviewDeadline(sit.dateStart, sit.duration);
    expect(deadline).not.toBeNull();
    expect(deadline!.getDate()).toBe(13);
  });

  it("is within the review window only while completed and before deadline", () => {
    expect(isWithinReviewWindow(sit, new Date(2026, 6, 10))).toBe(true);
    expect(isWithinReviewWindow(sit, new Date(2026, 6, 14))).toBe(false);
    expect(isWithinReviewWindow({ ...sit, accepted: false }, new Date(2026, 6, 10))).toBe(false);
  });

  it("counts inclusive remaining review days", () => {
    expect(reviewDaysRemaining(sit, new Date(2026, 6, 13))).toBe(1);
    expect(reviewDaysRemaining(sit, new Date(2026, 6, 10))).toBe(4);
    expect(reviewDaysRemaining(sit, new Date(2026, 6, 14))).toBe(0);
  });

  it("canLeaveReview requires completed phase inside the window", () => {
    expect(canLeaveReview(sit, new Date(2026, 6, 10))).toBe(true);
    expect(canLeaveReview({ ...sit, phase: "stayUnderway" }, new Date(2026, 6, 10))).toBe(false);
    expect(canLeaveReview(null)).toBe(false);
  });

  it("isSitEndedMoreThanDaysAgo matches the review-window cutoff", () => {
    // end Jul 6; over 7 days after Jul 13
    expect(isSitEndedMoreThanDaysAgo(sit, 7, new Date(2026, 6, 13))).toBe(false);
    expect(isSitEndedMoreThanDaysAgo(sit, 7, new Date(2026, 6, 14))).toBe(true);
    expect(isSitEndedMoreThanDaysAgo({ dateStart: "bad", duration: "5 nights" })).toBe(false);
  });
});

describe("daysUntilSitStarts", () => {
  it("counts whole days until a future start", () => {
    expect(daysUntilSitStarts("2026-07-25", new Date(2026, 6, 24))).toBe(1);
    expect(daysUntilSitStarts("2026-08-03", new Date(2026, 6, 24))).toBe(10);
  });

  it("returns null once the sit has started or the date is invalid", () => {
    expect(daysUntilSitStarts("2026-07-24", new Date(2026, 6, 24))).toBeNull();
    expect(daysUntilSitStarts("2026-07-20", new Date(2026, 6, 24))).toBeNull();
    expect(daysUntilSitStarts("bad", new Date(2026, 6, 24))).toBeNull();
  });
});

describe("sitDayProgress", () => {
  it("reports day-of-total across the inclusive sit window", () => {
    // 5 nights: Jul 10–15 inclusive → 6 days
    expect(sitDayProgress("2026-07-10", "5 nights", new Date(2026, 6, 10))).toEqual({
      day: 1,
      totalDays: 6,
    });
    expect(sitDayProgress("2026-07-10", "5 nights", new Date(2026, 6, 12))).toEqual({
      day: 3,
      totalDays: 6,
    });
    expect(sitDayProgress("2026-07-10", "5 nights", new Date(2026, 6, 15))).toEqual({
      day: 6,
      totalDays: 6,
    });
  });

  it("returns null outside the window or for bad input", () => {
    expect(sitDayProgress("2026-07-10", "5 nights", new Date(2026, 6, 9))).toBeNull();
    expect(sitDayProgress("2026-07-10", "5 nights", new Date(2026, 6, 16))).toBeNull();
    expect(sitDayProgress("bad", "5 nights", new Date(2026, 6, 12))).toBeNull();
  });
});
