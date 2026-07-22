import type { MeasurementSystem } from "@/store";

export type LengthUnit = "m" | "ft";

const METERS_PER_FOOT = 0.3048;

export function parseBoatLength(length: string, fallbackUnit: LengthUnit = "m") {
  const match = length.trim().match(/^(\d+(?:[.,]\d+)?)\s*(m|ft|feet|pieds?|pies|fu[ßs]|voet|πόδια|stope)?$/i);
  const rawUnit = match?.[2]?.toLowerCase();
  let unit: LengthUnit = fallbackUnit;
  if (rawUnit === "m") unit = "m";
  else if (rawUnit) unit = "ft";
  return {
    value: match?.[1]?.replace(",", ".") ?? "",
    unit,
  };
}

export function lengthToMetres(length: string): number {
  const parsed = parseBoatLength(length, "m");
  const amount = Number.parseFloat(parsed.value);
  if (!Number.isFinite(amount)) return Number.NaN;
  return parsed.unit === "ft" ? amount * METERS_PER_FOOT : amount;
}

export function metresToUnit(metres: number, unit: LengthUnit) {
  if (!Number.isFinite(metres)) return "";
  const amount = unit === "ft" ? metres / METERS_PER_FOOT : metres;
  return String(Math.round(amount * 10) / 10);
}

export function convertBoatLength(value: string, from: LengthUnit, to: LengthUnit) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || from === to) return value;
  const metres = from === "ft" ? amount * METERS_PER_FOOT : amount;
  return metresToUnit(metres, to);
}

/** Canonical storage form: metres with an `m` suffix, e.g. `12.802 m`. */
export function normalizeLengthToMetres(length: string): string {
  const metres = lengthToMetres(length);
  if (!Number.isFinite(metres) || metres <= 0) return length.trim();
  // Keep millimetre precision so round-trips to feet stay accurate.
  const precise = Math.round(metres * 1000) / 1000;
  return `${precise} m`;
}

export function formatBoatLength(
  length: string,
  measurementSystem: MeasurementSystem,
): string {
  const metres = lengthToMetres(length);
  if (!Number.isFinite(metres) || metres <= 0) return length;
  const unit: LengthUnit = measurementSystem === "imperial" ? "ft" : "m";
  return `${metresToUnit(metres, unit)} ${unit}`;
}

export function feetToMetresString(feet: number): string {
  return normalizeLengthToMetres(`${feet} ft`);
}
