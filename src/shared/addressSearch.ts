export type AddressSuggestion = {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
};

export type AddressSearchParams = {
  q?: string;
  limit?: number;
  lang?: string;
};

export function parseAddressSearchParams(
  query: Record<string, string | undefined>,
): AddressSearchParams {
  const limitRaw = Number(query.limit ?? 8);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 12) : 8;
  return {
    q: (query.q ?? "").trim(),
    limit,
    lang: (query.lang ?? "en").trim().toLowerCase() || "en",
  };
}

export function addressSearchQueryString(params: AddressSearchParams) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.limit && params.limit !== 8) search.set("limit", String(params.limit));
  if (params.lang && params.lang !== "en") search.set("lang", params.lang);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
