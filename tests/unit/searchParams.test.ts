import {
  addressSearchQueryString,
  formatPublicLocation,
  homePortFromAddress,
  parseAddressSearchParams,
} from "../../src/shared/addressSearch";
import {
  destinationsSearchQueryString,
  parseDestinationSearchParams,
} from "../../src/shared/destinationsSearch";

describe("formatPublicLocation / homePortFromAddress", () => {
  it("joins city and country when both exist", () => {
    expect(formatPublicLocation("Split", "Croatia")).toBe("Split, Croatia");
    expect(formatPublicLocation("Split", "")).toBe("Split");
    expect(formatPublicLocation("", "Croatia")).toBe("Croatia");
    expect(formatPublicLocation("  ", "  ")).toBe("");
  });

  it("builds a home port label from an address suggestion", () => {
    expect(
      homePortFromAddress({
        id: "1",
        label: "Split, Croatia",
        primary: "Split",
        secondary: "Croatia",
        city: "Split",
        country: "Croatia",
      }),
    ).toBe("Split, Croatia");
  });
});

describe("parseAddressSearchParams / addressSearchQueryString", () => {
  it("parses and clamps limit, with defaults", () => {
    expect(parseAddressSearchParams({})).toEqual({ q: "", limit: 8, lang: "en" });
    expect(parseAddressSearchParams({ q: "  athens ", limit: "20", lang: "EL" })).toEqual({
      q: "athens",
      limit: 12,
      lang: "el",
    });
    expect(parseAddressSearchParams({ limit: "0" }).limit).toBe(1);
  });

  it("omits default query params from the query string", () => {
    expect(addressSearchQueryString({ q: "athens", limit: 8, lang: "en" })).toBe("?q=athens");
    expect(addressSearchQueryString({ q: "", limit: 8, lang: "en" })).toBe("");
    expect(addressSearchQueryString({ q: "a", limit: 10, lang: "fr" })).toBe(
      "?q=a&limit=10&lang=fr",
    );
  });
});

describe("destination search params", () => {
  it("parses kind and limit", () => {
    expect(parseDestinationSearchParams({})).toEqual({ q: "", kind: "all", limit: 8 });
    expect(parseDestinationSearchParams({ kind: "CITY", limit: "99", q: "palma" })).toEqual({
      q: "palma",
      kind: "city",
      limit: 20,
    });
    expect(parseDestinationSearchParams({ kind: "region" }).kind).toBe("all");
  });

  it("builds a sparse query string", () => {
    expect(destinationsSearchQueryString({ q: "palma", kind: "all", limit: 8 })).toBe("?q=palma");
    expect(destinationsSearchQueryString({ q: "", kind: "country", limit: 12 })).toBe(
      "?kind=country&limit=12",
    );
  });
});
