import { DEFAULT_SIT_LIST_SORT, parseSitListSort, SIT_LIST_SORTS } from "../../src/shared/sitsSort";

describe("parseSitListSort", () => {
  it("accepts known sort values", () => {
    for (const sort of SIT_LIST_SORTS) {
      expect(parseSitListSort(sort)).toBe(sort);
    }
  });

  it("falls back to the default for unknown or empty values", () => {
    expect(parseSitListSort(undefined)).toBe(DEFAULT_SIT_LIST_SORT);
    expect(parseSitListSort(null)).toBe(DEFAULT_SIT_LIST_SORT);
    expect(parseSitListSort("popular")).toBe(DEFAULT_SIT_LIST_SORT);
    expect(DEFAULT_SIT_LIST_SORT).toBe("soonest");
  });
});
