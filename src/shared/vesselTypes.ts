/**
 * Canonical vessel type labels (stored in D1 / listing data) and URL slugs.
 */

export const VESSEL_TYPES = [
  "Sailing yacht",
  "Catamaran",
  "Motor yacht",
  "Narrowboat",
  "Trawler",
  "Houseboat",
] as const;

export type VesselType = (typeof VESSEL_TYPES)[number];

export const VESSEL_TYPE_SLUGS = {
  "Sailing yacht": "sailing-yacht",
  Catamaran: "catamaran",
  "Motor yacht": "motor-yacht",
  Narrowboat: "narrowboat",
  Trawler: "trawler",
  Houseboat: "houseboat",
} as const satisfies Record<VesselType, string>;

export type VesselTypeSlug = (typeof VESSEL_TYPE_SLUGS)[VesselType];

const SLUG_TO_TYPE = Object.fromEntries(
  (Object.entries(VESSEL_TYPE_SLUGS) as Array<[VesselType, VesselTypeSlug]>).map(([type, slug]) => [
    slug,
    type,
  ]),
) as Record<VesselTypeSlug, VesselType>;

export function isVesselType(value: string): value is VesselType {
  return (VESSEL_TYPES as readonly string[]).includes(value);
}

/** Encode a stored vessel type for the `type` query param. */
export function vesselTypeToSlug(type: string): VesselTypeSlug | undefined {
  return isVesselType(type) ? VESSEL_TYPE_SLUGS[type] : undefined;
}

/**
 * Parse a `type` query value into the canonical stored label.
 * Accepts slugs (`motor-yacht`) and legacy labels (`Motor yacht`).
 */
export function vesselTypeFromParam(raw: string | null | undefined): VesselType | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "All vessels") return undefined;

  const fromSlug =
    SLUG_TO_TYPE[trimmed as VesselTypeSlug] ??
    SLUG_TO_TYPE[trimmed.toLowerCase() as VesselTypeSlug];
  if (fromSlug) return fromSlug;

  if (isVesselType(trimmed)) return trimmed;
  return undefined;
}
