/**
 * Generate sv / nb / da / fi / ja translation catalogs from en-US,
 * then splice them into i18n.ts, localeExtras.ts, and applicationTranslations.ts.
 *
 * Usage: node scripts/generate-scandi-ja-locales.mjs
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, ".artifacts", "locale-gen");
const cachePath = join(cacheDir, "translate-cache.json");

const TARGETS = [
  { code: "sv", google: "sv", label: "Svenska", flag: "🇸🇪", locale: "sv-SE" },
  { code: "nb", google: "no", label: "Norsk", flag: "🇳🇴", locale: "nb-NO" },
  { code: "da", google: "da", label: "Dansk", flag: "🇩🇰", locale: "da-DK" },
  { code: "fi", google: "fi", label: "Suomi", flag: "🇫🇮", locale: "fi-FI" },
  { code: "ja", google: "ja", label: "日本語", flag: "🇯🇵", locale: "ja-JP" },
];

const CONCURRENCY = 4;
const GLOSSARY = [
  // Keep product / domain terms consistent after MT
  [/Boatstead/gi, "Boatstead"],
  [/Båtställe/g, "Boatstead"],
  [/Båtsted/g, "Boatstead"],
  [/Bådsted/g, "Boatstead"],
  [/ボートステッド/g, "Boatstead"],
];

function postProcessBrand(map) {
  const next = { ...map };
  for (const [key, value] of Object.entries(next)) {
    let v = value;
    for (const [pattern, replacement] of GLOSSARY) {
      v = v.replace(pattern, replacement);
    }
    next[key] = v;
  }
  return next;
}

mkdirSync(cacheDir, { recursive: true });
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf8")) : {};

function saveCache() {
  writeFileSync(cachePath, JSON.stringify(cache, null, 0));
}

function extractObjectLiteral(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Marker not found: ${marker}`);
  let i = start + marker.length;
  while (i < source.length && /\s/.test(source[i])) i += 1;
  if (source[i] !== "{") throw new Error(`Expected { after ${marker}`);
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;
  const from = i;
  for (; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === quote) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return { text: source.slice(from, i + 1), start: from, end: i + 1 };
      }
    }
  }
  throw new Error(`Unclosed object for ${marker}`);
}

function parseStringMap(objectText) {
  const map = {};
  // Supports both "key": "value" and "key":\n  "value"
  const re = /"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(objectText))) {
    map[JSON.parse(`"${match[1]}"`)] = JSON.parse(`"${match[2]}"`);
  }
  return map;
}

function formatStringMap(map, indent = 2) {
  const pad = " ".repeat(indent);
  const lines = Object.entries(map).map(
    ([key, value]) => `${pad}${JSON.stringify(key)}: ${JSON.stringify(value)},`,
  );
  return `{\n${lines.join("\n")}\n${" ".repeat(Math.max(0, indent - 2))}}`;
}

function protectPlaceholders(text) {
  const tokens = [];
  const protectedText = text
    .replace(/\{\{[^}]+\}\}/g, (m) => {
      const token = `⟦PH${tokens.length}⟧`;
      tokens.push(m);
      return token;
    })
    .replace(/<\/?[a-zA-Z][^>]*>/g, (m) => {
      const token = `⟦PH${tokens.length}⟧`;
      tokens.push(m);
      return token;
    });
  return { protectedText, tokens };
}

function restorePlaceholders(text, tokens) {
  return tokens.reduce((acc, token, index) => acc.replaceAll(`⟦PH${index}⟧`, token), text);
}

function scrubEmDash(text) {
  return text.replaceAll("—", " - ").replaceAll("–", "-");
}

async function translateOne(text, googleLang, attempt = 0) {
  const cacheKey = `${googleLang}::${text}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const { protectedText, tokens } = protectPlaceholders(text);
  const query = new URLSearchParams({
    client: "gtx",
    dt: "t",
    q: protectedText,
    sl: "en",
    tl: googleLang,
  });
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?${query.toString()}`,
    );
    if (!response.ok) throw new Error(`Translate failed ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
      throw new Error("Invalid translate payload");
    }
    let translated = payload[0]
      .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
      .join("")
      .trim();
    translated = restorePlaceholders(translated, tokens);
    translated = scrubEmDash(translated);
    for (const [pattern, replacement] of GLOSSARY) {
      translated = translated.replace(pattern, replacement);
    }
    for (const [index, token] of tokens.entries()) {
      if (!translated.includes(token)) {
        const mangled = new RegExp(`⟦\\s*PH\\s*${index}\\s*⟧`, "i");
        translated = translated.replace(mangled, token);
      }
    }
    cache[cacheKey] = translated;
    return translated;
  } catch (error) {
    if (attempt >= 6) throw error;
    const delay = 500 * 2 ** attempt + Math.floor(Math.random() * 400);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return translateOne(text, googleLang, attempt + 1);
  }
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function translateMap(enMap, googleLang, label) {
  const entries = Object.entries(enMap);
  let done = 0;
  const translatedEntries = await mapPool(entries, CONCURRENCY, async ([key, value]) => {
    const translated = await translateOne(value, googleLang);
    done += 1;
    if (done % 50 === 0 || done === entries.length) {
      process.stdout.write(`\r  ${label}: ${done}/${entries.length}`);
      saveCache();
    }
    return [key, translated];
  });
  process.stdout.write("\n");
  return Object.fromEntries(translatedEntries);
}

function extractI18nBaseEn(source) {
  const marker = "const enUS: Record<string, string> = ";
  return parseStringMap(extractObjectLiteral(source, marker).text);
}

function extractLocaleExtrasEn(source) {
  // Find "en-US": { inside localeExtrasSource
  const marker = '  "en-US": ';
  const idx = source.indexOf("const localeExtrasSource");
  const slice = source.slice(idx);
  return parseStringMap(extractObjectLiteral(slice, marker).text);
}

function extractApplicationEn(source) {
  const marker = "const en = ";
  return parseStringMap(extractObjectLiteral(source, marker).text);
}

function insertBefore(source, needle, insertion) {
  const idx = source.indexOf(needle);
  if (idx < 0) throw new Error(`Insert needle not found: ${needle}`);
  return source.slice(0, idx) + insertion + source.slice(idx);
}

function replaceOnce(source, from, to) {
  if (!source.includes(from)) throw new Error(`Missing snippet:\n${from}`);
  return source.replace(from, to);
}

async function main() {
  const i18nPath = join(root, "src/react-app/i18n.ts");
  const extrasPath = join(root, "src/react-app/localeExtras.ts");
  const appsPath = join(root, "src/react-app/applicationTranslations.ts");

  let i18nSource = readFileSync(i18nPath, "utf8");
  let extrasSource = readFileSync(extrasPath, "utf8");
  let appsSource = readFileSync(appsPath, "utf8");

  // Skip work if already present
  if (i18nSource.includes('{ code: "sv"')) {
    console.log("Languages already registered in i18n.ts — regenerating catalog bodies only if missing.");
  }

  console.log("Extracting English catalogs…");
  const enBase = extractI18nBaseEn(i18nSource);
  const enExtras = extractLocaleExtrasEn(extrasSource);
  const enApps = extractApplicationEn(appsSource);
  console.log(`  base=${Object.keys(enBase).length} extras=${Object.keys(enExtras).length} apps=${Object.keys(enApps).length}`);

  const generated = {};
  for (const target of TARGETS) {
    console.log(`Translating ${target.code} (${target.google})…`);
    generated[target.code] = {
      base: await translateMap(enBase, target.google, `${target.code}/base`),
      extras: await translateMap(enExtras, target.google, `${target.code}/extras`),
      apps: await translateMap(enApps, target.google, `${target.code}/apps`),
    };
    saveCache();
  }

  // --- Wire SUPPORTED_LANGUAGES ---
  if (!i18nSource.includes('{ code: "sv"')) {
    i18nSource = replaceOnce(
      i18nSource,
      `  { code: "tr", label: "Türkçe", flag: "🇹🇷", locale: "tr-TR" },
];`,
      `  { code: "tr", label: "Türkçe", flag: "🇹🇷", locale: "tr-TR" },
  { code: "sv", label: "Svenska", flag: "🇸🇪", locale: "sv-SE" },
  { code: "nb", label: "Norsk", flag: "🇳🇴", locale: "nb-NO" },
  { code: "da", label: "Dansk", flag: "🇩🇰", locale: "da-DK" },
  { code: "fi", label: "Suomi", flag: "🇫🇮", locale: "fi-FI" },
  { code: "ja", label: "日本語", flag: "🇯🇵", locale: "ja-JP" },
];`,
    );
  }

  // --- Insert base message blocks before resources ---
  const resourcesMarker = "const resources = {";
  if (!i18nSource.includes("const sv = messages(")) {
    const blocks = TARGETS.map(
      (t) =>
        `const ${t.code} = messages(${formatStringMap(generated[t.code].base, 2)});\n\n`,
    ).join("");
    i18nSource = insertBefore(i18nSource, resourcesMarker, blocks);
  }

  if (!i18nSource.includes("sv: { ...sv,")) {
    i18nSource = replaceOnce(
      i18nSource,
      `  tr: { ...tr, ...localeExtras.tr, ...applicationTranslations.tr },
};`,
      `  tr: { ...tr, ...localeExtras.tr, ...applicationTranslations.tr },
  sv: { ...sv, ...localeExtras.sv, ...applicationTranslations.sv },
  nb: { ...nb, ...localeExtras.nb, ...applicationTranslations.nb },
  da: { ...da, ...localeExtras.da, ...applicationTranslations.da },
  fi: { ...fi, ...localeExtras.fi, ...applicationTranslations.fi },
  ja: { ...ja, ...localeExtras.ja, ...applicationTranslations.ja },
};`,
    );
  }

  // normalizeLanguageCode helpers for no/nn -> nb and ja-jp
  if (!i18nSource.includes('if (normalized === "nb"')) {
    i18nSource = replaceOnce(
      i18nSource,
      `  if (normalized === "pt" || normalized.startsWith("pt-")) return "pt-PT";

  const exact = SUPPORTED_LANGUAGES.find`,
      `  if (normalized === "pt" || normalized.startsWith("pt-")) return "pt-PT";

  if (normalized === "nb" || normalized.startsWith("nb-") || normalized === "no" || normalized.startsWith("no-") || normalized === "nn" || normalized.startsWith("nn-")) {
    return "nb";
  }
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  if (normalized === "sv" || normalized.startsWith("sv-")) return "sv";
  if (normalized === "da" || normalized.startsWith("da-")) return "da";
  if (normalized === "fi" || normalized.startsWith("fi-")) return "fi";

  const exact = SUPPORTED_LANGUAGES.find`,
    );
  }

  // --- localeExtras ---
  if (!extrasSource.includes("\n  sv: {")) {
    const extrasBlocks = TARGETS.map(
      (t) => `  ${t.code}: ${formatStringMap(generated[t.code].extras, 4)},\n`,
    ).join("");
    // Insert before en-GB block
    extrasSource = insertBefore(extrasSource, '  "en-GB": {', extrasBlocks);
  }

  // --- applicationTranslations ---
  if (!appsSource.includes("\n  sv: {")) {
    const appsBlocks = TARGETS.map(
      (t) => `  ${t.code}: ${formatStringMap(generated[t.code].apps, 4)},\n`,
    ).join("");
    // Insert before closing of applicationTranslationsSource (before helper functions).
    const sourceClose = appsSource.indexOf(
      "};\n\nfunction mapTranslationValues",
    );
    if (sourceClose < 0) {
      throw new Error("Could not find applicationTranslationsSource closing brace");
    }
    appsSource =
      appsSource.slice(0, sourceClose) + appsBlocks + appsSource.slice(sourceClose);
  }

  writeFileSync(i18nPath, i18nSource);
  writeFileSync(extrasPath, extrasSource);
  writeFileSync(appsPath, appsSource);
  saveCache();
  console.log("Wrote locale catalogs into i18n.ts, localeExtras.ts, applicationTranslations.ts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
