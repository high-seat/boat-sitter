import {
  isVesselType,
  vesselTypeFromParam,
  vesselTypeToSlug,
  VESSEL_TYPES,
} from "../../src/shared/vesselTypes";

describe("vesselTypes", () => {
  it("recognizes canonical vessel type labels", () => {
    expect(isVesselType("Catamaran")).toBe(true);
    expect(isVesselType("Dinghy")).toBe(false);
    expect(VESSEL_TYPES).toContain("Sailing yacht");
  });

  it("maps labels to URL slugs and back", () => {
    expect(vesselTypeToSlug("Motor yacht")).toBe("motor-yacht");
    expect(vesselTypeToSlug("Kayak")).toBeUndefined();
    expect(vesselTypeFromParam("motor-yacht")).toBe("Motor yacht");
    expect(vesselTypeFromParam("Motor yacht")).toBe("Motor yacht");
    expect(vesselTypeFromParam("All vessels")).toBeUndefined();
    expect(vesselTypeFromParam("")).toBeUndefined();
    expect(vesselTypeFromParam(null)).toBeUndefined();
  });
});
