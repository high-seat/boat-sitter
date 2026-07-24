import {
  addDaysIso,
  anySitOverlapsAnyAvailabilityWindow,
  isoDateRangesOverlap,
  regionMatchesSit,
  sitOverlapsAvailabilityWindow,
} from "../../src/shared/availabilityMatch";

describe("availabilityMatch", () => {
  it("adds calendar days in UTC ISO form", () => {
    expect(addDaysIso("2026-09-12", 22)).toBe("2026-10-04");
    expect(addDaysIso("bad", 1)).toBeNull();
  });

  it("detects inclusive ISO date range overlap", () => {
    expect(isoDateRangesOverlap("2026-09-01", "2026-09-10", "2026-09-10", "2026-09-20")).toBe(true);
    expect(isoDateRangesOverlap("2026-09-01", "2026-09-10", "2026-09-11", "2026-09-20")).toBe(
      false,
    );
  });

  it("matches empty regions as anywhere", () => {
    expect(regionMatchesSit([], "Greece", "Lefkada")).toBe(true);
  });

  it("matches country and city region shapes", () => {
    expect(regionMatchesSit(["Greece"], "Greece", "Lefkada")).toBe(true);
    expect(regionMatchesSit(["Lefkada, Greece"], "Greece", "Lefkada")).toBe(true);
    expect(regionMatchesSit(["Portugal"], "Greece", "Lefkada")).toBe(false);
  });

  it("requires both date and region overlap for a sit vs window", () => {
    const sit = {
      dateStart: "2026-09-12",
      duration: "22 nights",
      country: "Greece",
      location: "Lefkada",
    };
    expect(
      sitOverlapsAvailabilityWindow(sit, {
        dateStart: "2026-08-01",
        dateEnd: "2026-11-30",
        regions: ["Greece", "Italy"],
      }),
    ).toBe(true);
    expect(
      sitOverlapsAvailabilityWindow(sit, {
        dateStart: "2026-08-01",
        dateEnd: "2026-11-30",
        regions: ["Portugal"],
      }),
    ).toBe(false);
    expect(
      sitOverlapsAvailabilityWindow(sit, {
        dateStart: "2026-01-01",
        dateEnd: "2026-02-01",
        regions: ["Greece"],
      }),
    ).toBe(false);
  });

  it("matches when any sit overlaps any window", () => {
    const sits = [
      {
        dateStart: "2026-09-12",
        duration: "22 nights",
        country: "Greece",
        location: "Lefkada",
      },
    ];
    expect(
      anySitOverlapsAnyAvailabilityWindow(sits, [
        { dateStart: "2026-08-01", dateEnd: "2026-11-30", regions: ["Greece"] },
      ]),
    ).toBe(true);
    expect(
      anySitOverlapsAnyAvailabilityWindow(sits, [
        { dateStart: "2026-08-01", dateEnd: "2026-11-30", regions: ["Spain"] },
      ]),
    ).toBe(false);
    expect(
      anySitOverlapsAnyAvailabilityWindow(
        [],
        [{ dateStart: "2026-08-01", dateEnd: "2026-11-30", regions: [] }],
      ),
    ).toBe(false);
  });
});
