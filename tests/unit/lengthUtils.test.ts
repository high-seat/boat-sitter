import {
  convertBoatLength,
  feetToMetresString,
  formatBoatLength,
  lengthToMetres,
  metresToUnit,
  normalizeLengthToMetres,
  parseBoatLength,
} from "../../src/react-app/lengthUtils";

describe("parseBoatLength", () => {
  it("parses amount and unit with fallback", () => {
    expect(parseBoatLength("42 ft")).toEqual({ value: "42", unit: "ft" });
    expect(parseBoatLength("12,5 m")).toEqual({ value: "12.5", unit: "m" });
    expect(parseBoatLength("12", "ft")).toEqual({ value: "12", unit: "ft" });
    expect(parseBoatLength("40 feet")).toEqual({ value: "40", unit: "ft" });
  });
});

describe("length conversion", () => {
  it("converts to and from metres", () => {
    expect(lengthToMetres("10 m")).toBe(10);
    expect(lengthToMetres("10 ft")).toBeCloseTo(3.048);
    expect(metresToUnit(10, "m")).toBe("10");
    expect(metresToUnit(3.048, "ft")).toBe("10");
    expect(convertBoatLength("10", "ft", "m")).toBe("3");
    expect(convertBoatLength("10", "m", "m")).toBe("10");
  });

  it("normalizes storage to metre strings", () => {
    expect(normalizeLengthToMetres("10 ft")).toBe("3.048 m");
    expect(normalizeLengthToMetres("12.8 m")).toBe("12.8 m");
    expect(normalizeLengthToMetres("bad")).toBe("bad");
    expect(feetToMetresString(10)).toBe("3.048 m");
  });

  it("formats for measurement system preference", () => {
    expect(formatBoatLength("3.048 m", "imperial")).toBe("10 ft");
    expect(formatBoatLength("10 m", "metric")).toBe("10 m");
  });
});
