/**
 * Shared availability ↔ sit matching (dates + regions).
 * Used by the worker match jobs and the profile "matches your sit" UI.
 */

/** Add calendar days to a YYYY-MM-DD date (UTC), returning YYYY-MM-DD. */
export function addDaysIso(iso: string, days: number): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    return null;
  }
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Inclusive range overlap for YYYY-MM-DD strings (lexical compare is safe).
 */
export function isoDateRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Match a sit's place against a window's regions.
 * Empty regions = open to anywhere. Regions may be countries ("Greece") or
 * cities ("Lefkada" / "Lefkada, Greece"), same shapes DestinationAutocomplete
 * emits in multi-select search.
 */
export function regionMatchesSit(regions: string[], country: string, location: string): boolean {
  if (regions.length === 0) return true;
  const countryL = country.toLowerCase().trim();
  const locationL = location.toLowerCase().trim();
  return regions.some((raw) => {
    const region = raw.toLowerCase().trim();
    if (!region) return false;
    if (region === countryL) return true;
    if (region === locationL) return true;
    const comma = region.lastIndexOf(",");
    if (comma > 0) {
      const city = region.slice(0, comma).trim();
      const regionCountry = region.slice(comma + 1).trim();
      if (regionCountry === countryL) {
        return (
          locationL === city ||
          locationL.startsWith(`${city},`) ||
          locationL.includes(city) ||
          city.includes(locationL)
        );
      }
    }
    return (
      locationL === region ||
      locationL.startsWith(`${region},`) ||
      locationL.includes(region) ||
      region.includes(locationL)
    );
  });
}

/**
 * True when a sit's calendar span overlaps an availability window and the
 * window's regions cover the sit's country/location.
 */
export function sitOverlapsAvailabilityWindow(
  sit: { dateStart: string; duration: string; country: string; location: string },
  win: { dateStart: string; dateEnd: string; regions: string[] },
): boolean {
  const nights = Number.parseInt(sit.duration, 10);
  if (!Number.isFinite(nights) || nights < 0) return false;
  const sitEnd = addDaysIso(sit.dateStart, nights);
  if (!sitEnd) return false;
  if (!isoDateRangesOverlap(sit.dateStart, sitEnd, win.dateStart, win.dateEnd)) return false;
  return regionMatchesSit(win.regions, sit.country, sit.location);
}

/** True when any sit overlaps any of the sitter's availability windows. */
export function anySitOverlapsAnyAvailabilityWindow(
  sits: Array<{ dateStart: string; duration: string; country: string; location: string }>,
  windows: Array<{ dateStart: string; dateEnd: string; regions: string[] }>,
): boolean {
  if (!sits.length || !windows.length) return false;
  return sits.some((sit) => windows.some((win) => sitOverlapsAvailabilityWindow(sit, win)));
}
