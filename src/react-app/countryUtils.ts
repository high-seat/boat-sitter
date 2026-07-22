import { getCode } from "country-list";

const COUNTRY_CODE_OVERRIDES: Record<string, string> = {
  "Ivory Coast": "CI",
  "North Korea": "KP",
  "South Korea": "KR",
  Türkiye: "TR",
  "United Kingdom": "GB",
  "United States": "US",
  "Vatican City": "VA",
};

/** Resolve a country display name to ISO 3166-1 alpha-2. */
export function countryIsoFromName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return COUNTRY_CODE_OVERRIDES[trimmed] ?? getCode(trimmed) ?? undefined;
}

/**
 * Pull the country portion from a profile/home-port location string.
 * Supports "City, Country" and bare country names.
 */
export function countryNameFromLocation(location: string) {
  const trimmed = location.trim();
  if (!trimmed) return undefined;
  const comma = trimmed.lastIndexOf(",");
  if (comma >= 0) {
    const country = trimmed.slice(comma + 1).trim();
    return country || undefined;
  }
  return trimmed;
}

export function countryIsoFromLocation(location: string) {
  const country = countryNameFromLocation(location);
  return country ? countryIsoFromName(country) : undefined;
}
