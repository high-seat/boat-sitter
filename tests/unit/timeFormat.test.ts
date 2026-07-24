import {
  dayPeriodLabel,
  detectTimeFormat,
  formatClockTime,
  formatStoredClockTime,
  is24HourClockTime,
  parseClockTime,
  timeFormatHour12,
  to12HourClock,
  to24HourClock,
  withTimeFormat,
} from "../../src/shared/timeFormat";

describe("detectTimeFormat", () => {
  it("detects 12h vs 24h from locale hints", () => {
    expect(detectTimeFormat("en-US")).toBe("12h");
    expect(detectTimeFormat("de-DE")).toBe("24h");
  });

  it("defaults to 24h without a locale", () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: undefined,
    });
    try {
      expect(detectTimeFormat()).toBe("24h");
      expect(detectTimeFormat("   ")).toBe("24h");
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: original,
      });
    }
  });
});

describe("clock conversion helpers", () => {
  it("converts between 12h and 24h clocks", () => {
    expect(to12HourClock(0)).toEqual({ hour12: 12, period: "am" });
    expect(to12HourClock(12)).toEqual({ hour12: 12, period: "pm" });
    expect(to12HourClock(15)).toEqual({ hour12: 3, period: "pm" });
    expect(to24HourClock(12, "am")).toBe(0);
    expect(to24HourClock(12, "pm")).toBe(12);
    expect(to24HourClock(3, "pm")).toBe(15);
  });

  it("parses and validates stored HH:mm values", () => {
    expect(parseClockTime("09:30")).toEqual({ hour: 9, minute: 30 });
    expect(parseClockTime("23:59")).toEqual({ hour: 23, minute: 59 });
    expect(parseClockTime("bad")).toEqual({ hour: 10, minute: 0 });
    expect(is24HourClockTime("09:30")).toBe(true);
    expect(is24HourClockTime("9:30")).toBe(false);
    expect(is24HourClockTime("24:00")).toBe(false);
  });

  it("formats canonical stored clock times", () => {
    expect(formatStoredClockTime(9, 5)).toBe("09:05");
    expect(formatStoredClockTime(23.9, 60)).toBe("23:59");
    expect(formatStoredClockTime(-1, -5)).toBe("00:00");
  });
});

describe("formatting helpers", () => {
  it("maps time format prefs into Intl options", () => {
    expect(timeFormatHour12("12h")).toBe(true);
    expect(timeFormatHour12("24h")).toBe(false);
    expect(withTimeFormat("12h", { hour: "numeric" })).toEqual({
      hour: "numeric",
      hour12: true,
    });
  });

  it("formats clock times for the preferred format", () => {
    expect(formatClockTime(15, 5, "24h", "en-GB")).toMatch(/15/);
    expect(formatClockTime(15, 5, "12h", "en-US")).toMatch(/3/);
    expect(dayPeriodLabel("en-US", "am")).toMatch(/AM/i);
    expect(dayPeriodLabel("en-US", "pm")).toMatch(/PM/i);
  });
});
