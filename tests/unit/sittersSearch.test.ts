import {
  filterSitters,
  paginateSitters,
  parseSittersSearchParams,
  sortSitters,
  sittersSearchQueryString,
  type SitterSearchItem,
} from "../../src/shared/sittersSearch";

function sitter(overrides: Partial<SitterSearchItem> = {}): SitterSearchItem {
  return {
    name: "Alex Morgan",
    image: "",
    location: "Athens, Greece",
    bio: "",
    languages: ["English", "Greek"],
    preferredCountries: ["Greece", "Croatia"],
    skills: [],
    certifications: ["VHF / SRC"],
    yearsExperience: 5,
    completedSits: 8,
    memberSince: 2020,
    rating: 4.8,
    reviews: 4,
    availableFrom: "2026-08-01",
    availableTo: "2026-11-30",
    availabilityRegions: ["Greece"],
    openWindows: [{ dateStart: "2026-08-01", dateEnd: "2026-11-30", regions: ["Greece"] }],
    hasOpenAvailability: true,
    ...overrides,
  };
}

describe("sittersSearch", () => {
  const catalogue = [
    sitter(),
    sitter({
      name: "Tom Harper",
      location: "Falmouth, United Kingdom",
      languages: ["English"],
      preferredCountries: ["United Kingdom", "France"],
      yearsExperience: 8,
      completedSits: 12,
      rating: 4.9,
      reviews: 10,
      availableFrom: "2026-09-01",
      availableTo: "2026-12-01",
      openWindows: [
        { dateStart: "2026-09-01", dateEnd: "2026-12-01", regions: ["United Kingdom"] },
      ],
      availabilityRegions: ["United Kingdom"],
    }),
    sitter({
      name: "No Window",
      languages: ["English"],
      hasOpenAvailability: false,
      availableFrom: null,
      availableTo: null,
      openWindows: [],
      availabilityRegions: [],
      yearsExperience: 2,
      completedSits: 1,
      rating: 0,
      reviews: 0,
      certifications: [],
    }),
  ];

  it("filters by destination query across location and preferred countries", () => {
    const filtered = filterSitters(catalogue, { q: "United Kingdom" });
    expect(filtered.map((s) => s.name)).toEqual(["Tom Harper"]);
  });

  it("filters by overlapping availability dates", () => {
    const filtered = filterSitters(catalogue, { from: "2026-08-15", to: "2026-08-20" });
    expect(filtered.map((s) => s.name)).toEqual(["Alex Morgan"]);
  });

  it("filters by language, experience, certification, and availableOnly", () => {
    expect(filterSitters(catalogue, { language: "Greek" }).map((s) => s.name)).toEqual([
      "Alex Morgan",
    ]);
    expect(filterSitters(catalogue, { minYears: 6 }).map((s) => s.name)).toEqual(["Tom Harper"]);
    expect(
      filterSitters(catalogue, { certified: true })
        .map((s) => s.name)
        .sort(),
    ).toEqual(["Alex Morgan", "Tom Harper"]);
    expect(
      filterSitters(catalogue, { availableOnly: true })
        .map((s) => s.name)
        .sort(),
    ).toEqual(["Alex Morgan", "Tom Harper"]);
  });

  it("sorts by soonest availability and rating", () => {
    const soonest = sortSitters(
      catalogue.filter((s) => s.hasOpenAvailability),
      "soonest",
    );
    expect(soonest.map((s) => s.name)).toEqual(["Alex Morgan", "Tom Harper"]);
    const byRating = sortSitters(
      catalogue.filter((s) => s.hasOpenAvailability),
      "rating",
    );
    expect(byRating.map((s) => s.name)).toEqual(["Tom Harper", "Alex Morgan"]);
  });

  it("paginates results", () => {
    const page = paginateSitters(catalogue, { sort: "experienced", page: 0, limit: 2 });
    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]?.name).toBe("Tom Harper");
    expect(page.totalPages).toBe(2);
  });

  it("filters by owner sit overlap when matchOwnerSits is set", () => {
    const ownerSits = [
      {
        dateStart: "2026-09-12",
        duration: "22 nights",
        country: "Greece",
        location: "Lefkada",
      },
    ];
    expect(filterSitters(catalogue, { matchOwnerSits: ownerSits }).map((s) => s.name)).toEqual([
      "Alex Morgan",
    ]);
    expect(filterSitters(catalogue, { matchOwnerSits: [] }).map((s) => s.name)).toEqual([]);
  });

  it("round-trips query string params", () => {
    const qs = sittersSearchQueryString({
      q: "Greece",
      from: "2026-08-01",
      to: "2026-08-15",
      language: "English",
      minYears: 3,
      certified: true,
      matchesMySits: true,
      sort: "popular",
      page: 1,
      limit: 9,
    });
    expect(qs).toContain("q=Greece");
    expect(qs).toContain("matchesMySits=1");
    const parsed = parseSittersSearchParams(new URLSearchParams(qs.slice(1)));
    expect(parsed.q).toBe("Greece");
    expect(parsed.language).toBe("English");
    expect(parsed.minYears).toBe(3);
    expect(parsed.certified).toBe(true);
    expect(parsed.matchesMySits).toBe(true);
    expect(parsed.sort).toBe("popular");
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(9);
  });
});
