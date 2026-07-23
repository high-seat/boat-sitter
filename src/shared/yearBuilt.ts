/** Year of manufacture for vessels. Null means the owner does not know. */

export const MIN_YEAR_BUILT = 1850;

export function maxYearBuilt(now = new Date()) {
  return now.getFullYear() + 1;
}

export function parseYearBuiltInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}$/.test(trimmed)) return null;
  const year = Number.parseInt(trimmed, 10);
  return Number.isFinite(year) ? year : null;
}

export function isValidYearBuilt(year: number, now = new Date()): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR_BUILT && year <= maxYearBuilt(now);
}

/** Normalize API / form values to a stored year or null (unknown). */
export function normalizeYearBuilt(value: unknown, now = new Date()): number | null {
  if (value == null || value === "") return null;
  const year = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(year)) return null;
  const rounded = Math.trunc(year);
  return isValidYearBuilt(rounded, now) ? rounded : null;
}
