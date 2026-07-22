import { useEffect, useMemo, useState } from "react";
import PhoneInputImport, { type CountryData } from "react-phone-input-2";
import { useTranslation } from "react-i18next";
import de from "react-phone-input-2/lang/de.json";
import es from "react-phone-input-2/lang/es.json";
import fr from "react-phone-input-2/lang/fr.json";
import it from "react-phone-input-2/lang/it.json";
import jp from "react-phone-input-2/lang/jp.json";
import pt from "react-phone-input-2/lang/pt.json";
import tr from "react-phone-input-2/lang/tr.json";
import "react-phone-input-2/lib/style.css";
import { normalizeLanguageCode } from "@/i18n";

const PhoneInput =
  (PhoneInputImport as unknown as { default: typeof PhoneInputImport }).default ??
  PhoneInputImport;

const PREFERRED_COUNTRIES = [
  "us",
  "ca",
  "gb",
  "fr",
  "mc",
  "es",
  "it",
  "de",
  "nl",
  "pt",
  "gr",
  "hr",
  "tr",
  "se",
  "no",
  "dk",
  "fi",
  "jp",
  "pl",
  "au",
  "nz",
];

const DIAL_CODE_TO_ISO: Record<string, string> = {
  "1": "us",
  "30": "gr",
  "31": "nl",
  "33": "fr",
  "34": "es",
  "39": "it",
  "44": "gb",
  "45": "dk",
  "46": "se",
  "47": "no",
  "48": "pl",
  "49": "de",
  "61": "au",
  "64": "nz",
  "90": "tr",
  "351": "pt",
  "358": "fi",
  "377": "mc",
  "385": "hr",
  "81": "jp",
};

const LOCALIZATIONS: Record<string, Record<string, string>> = {
  de,
  es,
  fr,
  it,
  pt,
  tr,
  ja: jp,
};

function digitsFromCallingCode(code: string) {
  return code.replace(/\D/g, "");
}

function isoFromCallingCode(code: string) {
  return DIAL_CODE_TO_ISO[digitsFromCallingCode(code)] ?? "us";
}

export function PhoneCountryCodeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (callingCode: string) => void;
}) {
  const { i18n, t } = useTranslation();
  const language = normalizeLanguageCode(i18n.resolvedLanguage ?? i18n.language);
  const localization = LOCALIZATIONS[language.split("-")[0] ?? ""];
  const [country, setCountry] = useState(() => isoFromCallingCode(value));
  const dialDigits = useMemo(() => digitsFromCallingCode(value), [value]);

  useEffect(() => {
    setCountry(isoFromCallingCode(value));
  }, [value]);

  return (
    <PhoneInput
      buttonClass="phone-country-code__button"
      containerClass="phone-country-code"
      country={country}
      countryCodeEditable={false}
      disableCountryGuess
      disableSearchIcon
      dropdownClass="phone-country-code__dropdown"
      enableSearch
      inputClass="phone-country-code__input"
      inputProps={{
        "aria-label": t("profile.callingCode"),
        autoComplete: "tel-country-code",
        name: "phoneCountryCode",
        readOnly: true,
      }}
      localization={localization}
      onChange={(_next, data) => {
        if (!("dialCode" in data) || !data.dialCode) return;
        const next = data as CountryData;
        setCountry(next.countryCode);
        onChange(`+${next.dialCode}`);
      }}
      preferredCountries={PREFERRED_COUNTRIES}
      searchClass="phone-country-code__search"
      searchNotFound={t("profile.countrySearchEmpty")}
      searchPlaceholder={t("profile.countrySearch")}
      specialLabel=""
      value={dialDigits}
    />
  );
}
