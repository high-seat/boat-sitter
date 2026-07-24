import {
  computeEndEarlySchedule,
  computeStartEarlySchedule,
  isoLocalDate,
  isSitListingEditBlockedByPhase,
  isSitUnderway,
  sitInclusiveEndDate,
} from "../../src/shared/sitSchedule";

describe("isoLocalDate", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(isoLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(isoLocalDate(new Date(2026, 11, 9))).toBe("2026-12-09");
  });
});

describe("sitInclusiveEndDate", () => {
  it("returns inclusive end from nights", () => {
    const end = sitInclusiveEndDate("2026-07-01", "3 nights");
    expect(end).not.toBeNull();
    expect(isoLocalDate(end!)).toBe("2026-07-04");
  });
});

describe("isSitUnderway", () => {
  const sit = { dateStart: "2026-07-10", duration: "5 nights", accepted: true };

  it("is true only for accepted sits between start and inclusive end", () => {
    expect(isSitUnderway(sit, new Date(2026, 6, 10))).toBe(true);
    expect(isSitUnderway(sit, new Date(2026, 6, 15))).toBe(true);
    expect(isSitUnderway(sit, new Date(2026, 6, 9))).toBe(false);
    expect(isSitUnderway(sit, new Date(2026, 6, 16))).toBe(false);
  });

  it("is false when cancelled or not accepted", () => {
    expect(isSitUnderway({ ...sit, accepted: false }, new Date(2026, 6, 12))).toBe(false);
    expect(
      isSitUnderway({ ...sit, cancelledAt: "2026-07-11T00:00:00Z" }, new Date(2026, 6, 12)),
    ).toBe(false);
  });
});

describe("isSitListingEditBlockedByPhase", () => {
  const sit = { dateStart: "2026-07-10", duration: "5 nights", accepted: true };

  it("blocks once an accepted sit has started, or when cancelled", () => {
    expect(isSitListingEditBlockedByPhase(sit, new Date(2026, 6, 9))).toBe(false);
    expect(isSitListingEditBlockedByPhase(sit, new Date(2026, 6, 10))).toBe(true);
    expect(isSitListingEditBlockedByPhase(sit, new Date(2026, 6, 20))).toBe(true);
    expect(
      isSitListingEditBlockedByPhase(
        { ...sit, cancelledAt: "2026-07-01T00:00:00Z" },
        new Date(2026, 6, 1),
      ),
    ).toBe(true);
  });

  it("does not block unaccepted sits", () => {
    expect(isSitListingEditBlockedByPhase({ ...sit, accepted: false }, new Date(2026, 6, 20))).toBe(
      false,
    );
  });
});

describe("computeStartEarlySchedule", () => {
  it("moves start to today and shortens nights to keep the end", () => {
    const result = computeStartEarlySchedule("2026-07-20", "10 nights", new Date(2026, 6, 15));
    expect(result).toEqual({
      dateStart: "2026-07-15",
      duration: "15 nights",
      dates: expect.stringContaining("–"),
    });
    // original end = Jul 30; from Jul 15 → 15 nights
    expect(result!.duration).toBe("15 nights");
  });

  it("returns null when already started or completed", () => {
    expect(computeStartEarlySchedule("2026-07-10", "5 nights", new Date(2026, 6, 10))).toBeNull();
    expect(computeStartEarlySchedule("2026-07-01", "2 nights", new Date(2026, 6, 10))).toBeNull();
  });
});

describe("computeEndEarlySchedule", () => {
  it("ends yesterday while keeping the original start", () => {
    const result = computeEndEarlySchedule("2026-07-10", "10 nights", new Date(2026, 6, 15));
    expect(result).toEqual({
      dateStart: "2026-07-10",
      duration: "4 nights",
      dates: expect.stringContaining("–"),
    });
  });

  it("shifts start back one day when the sit started today", () => {
    const result = computeEndEarlySchedule("2026-07-15", "5 nights", new Date(2026, 6, 15));
    expect(result).toEqual({
      dateStart: "2026-07-14",
      duration: "0 nights",
      dates: expect.stringContaining("–"),
    });
  });

  it("returns null when not underway", () => {
    expect(computeEndEarlySchedule("2026-07-20", "5 nights", new Date(2026, 6, 15))).toBeNull();
    expect(computeEndEarlySchedule("2026-07-01", "2 nights", new Date(2026, 6, 15))).toBeNull();
  });
});
