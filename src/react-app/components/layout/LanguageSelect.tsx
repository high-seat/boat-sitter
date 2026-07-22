import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { normalizeLanguageCode, SUPPORTED_LANGUAGES } from "@/i18n";
import { Select } from "@/components/ui/Select";

export function LanguageSelect() {
  const { i18n, t } = useTranslation();
  const current = normalizeLanguageCode(i18n.language);

  return (
    <label className="flex w-[20rem] items-center gap-2 rounded-full border border-line bg-cream px-3 py-2 text-sm font-semibold text-navy">
      <Languages className="shrink-0 text-teal" size={16} />
      <span className="sr-only">{t("footer.language")}</span>
      <Select
        aria-label={t("footer.language")}
        className="min-w-0 flex-1"
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
        value={current}
        variant="inline"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
