import {
  averageMs,
  bucketResponseTimeMs,
  collectResponseLatenciesMs,
  parseMessageTime,
  summarizeResponseTime,
} from "../../src/shared/responseTime";

describe("parseMessageTime", () => {
  it("parses ISO and SQLite-style timestamps", () => {
    expect(parseMessageTime("2026-07-01T12:00:00.000Z")).toBe(
      Date.parse("2026-07-01T12:00:00.000Z"),
    );
    // Engine-dependent direct parse of "YYYY-MM-DD HH:MM:SS" when accepted
    const sqlite = parseMessageTime("2026-07-01 12:00:00");
    expect(Number.isFinite(sqlite)).toBe(true);
    expect(Number.isNaN(parseMessageTime("not-a-date"))).toBe(true);
  });
});

describe("response latency helpers", () => {
  it("averages values and buckets by hours", () => {
    expect(averageMs([])).toBeNull();
    expect(averageMs([1000, 3000])).toBe(2000);
    expect(bucketResponseTimeMs(30 * 60 * 1000)).toBe("withinHour");
    expect(bucketResponseTimeMs(90 * 60 * 1000)).toBe("withinTwoHours");
    expect(bucketResponseTimeMs(6 * 60 * 60 * 1000)).toBe("withinHalfDay");
    expect(bucketResponseTimeMs(18 * 60 * 60 * 1000)).toBe("withinDay");
    expect(bucketResponseTimeMs(36 * 60 * 60 * 1000)).toBe("withinTwoDays");
    expect(bucketResponseTimeMs(72 * 60 * 60 * 1000)).toBe("withinFewDays");
  });

  it("collects gaps from other-party messages to the responder reply", () => {
    const samples = collectResponseLatenciesMs("Alex", [
      {
        applicationId: "a1",
        senderName: "Sam",
        kind: "user",
        createdAt: "2026-07-01T10:00:00.000Z",
      },
      {
        applicationId: "a1",
        senderName: "Alex",
        kind: "user",
        createdAt: "2026-07-01T11:00:00.000Z",
      },
      {
        applicationId: "a1",
        senderName: "System",
        kind: "system",
        createdAt: "2026-07-01T11:30:00.000Z",
      },
    ]);
    expect(samples).toHaveLength(1);
    expect(samples[0].ms).toBe(60 * 60 * 1000);
  });

  it("summarizes a typical response bucket", () => {
    expect(
      summarizeResponseTime("Alex", [
        {
          applicationId: "a1",
          senderName: "Sam",
          createdAt: "2026-07-01T10:00:00.000Z",
        },
        {
          applicationId: "a1",
          senderName: "Alex",
          createdAt: "2026-07-01T10:30:00.000Z",
        },
      ]),
    ).toBe("withinHour");
    expect(summarizeResponseTime("Alex", [])).toBeNull();
  });
});
