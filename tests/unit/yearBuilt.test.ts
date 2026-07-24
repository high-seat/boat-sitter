import {
  isValidYearBuilt,
  maxYearBuilt,
  MIN_YEAR_BUILT,
  normalizeYearBuilt,
  parseYearBuiltInput,
} from "../../src/shared/yearBuilt";

describe("yearBuilt", () => {
  const now = new Date(2026, 6, 1);

  it("exposes bounds relative to now", () => {
    expect(MIN_YEAR_BUILT).toBe(1850);
    expect(maxYearBuilt(now)).toBe(2027);
  });

  it("parses four-digit year inputs", () => {
    expect(parseYearBuiltInput("1999")).toBe(1999);
    expect(parseYearBuiltInput(" 2001 ")).toBe(2001);
    expect(parseYearBuiltInput("")).toBeNull();
    expect(parseYearBuiltInput("99")).toBeNull();
    expect(parseYearBuiltInput("abcd")).toBeNull();
  });

  it("validates and normalizes stored years", () => {
    expect(isValidYearBuilt(1990, now)).toBe(true);
    expect(isValidYearBuilt(1849, now)).toBe(false);
    expect(isValidYearBuilt(2028, now)).toBe(false);
    expect(normalizeYearBuilt(null, now)).toBeNull();
    expect(normalizeYearBuilt("", now)).toBeNull();
    expect(normalizeYearBuilt("1990", now)).toBe(1990);
    expect(normalizeYearBuilt(1990.9, now)).toBe(1990);
    expect(normalizeYearBuilt(1800, now)).toBeNull();
  });
});
