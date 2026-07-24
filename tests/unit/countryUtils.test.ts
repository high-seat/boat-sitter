import {
  countryIsoFromLocation,
  countryIsoFromName,
  countryNameFromLocation,
} from "../../src/react-app/countryUtils";

describe("countryUtils", () => {
  it("resolves display names to ISO codes", () => {
    expect(countryIsoFromName("United States")).toBe("US");
    expect(countryIsoFromName("United Kingdom")).toBe("GB");
    expect(countryIsoFromName("Türkiye")).toBe("TR");
    expect(countryIsoFromName("Germany")).toBe("DE");
    expect(countryIsoFromName("")).toBeUndefined();
    expect(countryIsoFromName("Not A Country")).toBeUndefined();
  });

  it("pulls the country from a location string", () => {
    expect(countryNameFromLocation("Split, Croatia")).toBe("Croatia");
    expect(countryNameFromLocation("Croatia")).toBe("Croatia");
    expect(countryNameFromLocation("Split, ")).toBeUndefined();
    expect(countryNameFromLocation("  ")).toBeUndefined();
  });

  it("resolves ISO from a location string", () => {
    expect(countryIsoFromLocation("Split, Croatia")).toBe("HR");
    expect(countryIsoFromLocation("United States")).toBe("US");
  });
});
