import {
  da,
  de,
  el,
  enGB,
  enUS,
  es,
  fi,
  fr,
  hr,
  it,
  ja,
  nb,
  nl,
  pt,
  ptBR,
  sv,
  tr,
} from "date-fns/locale";

export const dayPickerLocales = {
  "en-US": enUS,
  "en-GB": enGB,
  fr,
  "es-ES": es,
  "es-419": es,
  it,
  de,
  nl,
  "pt-BR": ptBR,
  "pt-PT": pt,
  el,
  hr,
  tr,
  sv,
  nb,
  da,
  fi,
  ja,
} as const;

export type DayPickerLocaleCode = keyof typeof dayPickerLocales;

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
