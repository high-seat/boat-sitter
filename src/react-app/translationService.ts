import { normalizeLanguageCode } from "@/i18n";

const SPOKEN_LANGUAGE_TO_CODE: Record<string, string> = {
  English: "en",
  French: "fr",
  Spanish: "es",
  Italian: "it",
  German: "de",
  Dutch: "nl",
  Portuguese: "pt",
  Greek: "el",
  Croatian: "hr",
  Turkish: "tr",
  Swedish: "sv",
  Norwegian: "nb",
  Danish: "da",
  Finnish: "fi",
  Japanese: "ja",
  Polish: "pl",
  Arabic: "ar",
  "English (US)": "en",
  "English (UK)": "en",
  Français: "fr",
  Español: "es",
  Italiano: "it",
  Deutsch: "de",
  Nederlands: "nl",
  Português: "pt",
  Svenska: "sv",
  Norsk: "nb",
  Dansk: "da",
  Suomi: "fi",
  日本語: "ja",
};

function uiLanguageCode(uiLanguage: string) {
  const normalized = normalizeLanguageCode(uiLanguage);
  if (normalized === "en-GB" || normalized === "en-US") return "en";
  // Google Translate uses `no` for Norwegian; UI locale is Bokmål `nb`.
  if (normalized === "nb") return "no";
  return normalized;
}

export function ownerSpeaksUiLanguage(ownerLanguages: string[], uiLanguage: string) {
  const uiCode = uiLanguageCode(uiLanguage);
  return ownerLanguages.some((language) => {
    const trimmed = language.trim();
    const mapped = SPOKEN_LANGUAGE_TO_CODE[trimmed];
    if (mapped) return mapped === uiCode;
    return trimmed.toLowerCase().startsWith(uiCode);
  });
}

export async function translateWithGoogle(text: string, targetLanguage: string) {
  const target = targetLanguage.split("-")[0];
  const query = new URLSearchParams({
    client: "gtx",
    dt: "t",
    q: text,
    sl: "auto",
    tl: target,
  });
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${query.toString()}`,
  );
  if (!response.ok) throw new Error("TRANSLATION_REQUEST_FAILED");

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new Error("TRANSLATION_RESPONSE_INVALID");
  }
  const translated = payload[0]
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
    .join("")
    .trim();
  if (!translated) throw new Error("TRANSLATION_RESPONSE_EMPTY");
  return translated;
}
