import {
  formatMapLocationLabel,
  isApproximateMapPin,
  mapsAddressSearchUrl,
  mapsSearchUrl,
} from "../../src/react-app/mapUtils";

describe("mapUtils", () => {
  it("formats map labels without duplicating country", () => {
    expect(formatMapLocationLabel("Split, Croatia", "Croatia")).toBe("Split, Croatia");
    expect(formatMapLocationLabel("Split", "Croatia")).toBe("Split, Croatia");
    expect(formatMapLocationLabel("Split", "")).toBe("Split");
  });

  it("builds Google Maps search URLs", () => {
    expect(mapsSearchUrl(43.5, 16.4)).toBe(
      "https://www.google.com/maps/search/?api=1&query=43.5%2C16.4",
    );
    expect(mapsSearchUrl(43.5, 16.4, "Split")).toContain(encodeURIComponent("Split@43.5,16.4"));
    expect(mapsAddressSearchUrl("Split, Croatia")).toContain(encodeURIComponent("Split, Croatia"));
  });

  it("treats missing approximateLocation as approximate", () => {
    expect(isApproximateMapPin({})).toBe(true);
    expect(isApproximateMapPin({ approximateLocation: true })).toBe(true);
    expect(isApproximateMapPin({ approximateLocation: false })).toBe(false);
  });
});
