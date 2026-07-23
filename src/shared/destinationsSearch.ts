export type DestinationKindFilter = "city" | "country" | "all";

export type DestinationSearchParams = {
  q?: string;
  kind?: DestinationKindFilter;
  limit?: number;
};

export function parseDestinationSearchParams(
  query: Record<string, string | undefined>,
): DestinationSearchParams {
  const rawKind = (query.kind ?? "all").toLowerCase();
  const kind: DestinationKindFilter = rawKind === "city" || rawKind === "country" ? rawKind : "all";
  const limitRaw = Number(query.limit ?? 8);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 20) : 8;
  return {
    q: (query.q ?? "").trim(),
    kind,
    limit,
  };
}

export function destinationsSearchQueryString(params: DestinationSearchParams) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.kind && params.kind !== "all") search.set("kind", params.kind);
  if (params.limit && params.limit !== 8) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
