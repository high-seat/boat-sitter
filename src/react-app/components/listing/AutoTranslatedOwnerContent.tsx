import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFeatureFlag } from "@/featureFlags";
import { ownerSpeaksUiLanguage, translateWithGoogle } from "@/translationService";

export function useAutoTranslatedOwnerContent(
  ownerLanguages: string[],
  texts: Record<string, string>,
) {
  const { i18n } = useTranslation();
  const autoTranslateEnabled = useFeatureFlag("autoTranslateListings");
  const targetLanguage = i18n.resolvedLanguage ?? i18n.language;
  const shouldTranslate = useMemo(
    () =>
      autoTranslateEnabled && !ownerSpeaksUiLanguage(ownerLanguages, targetLanguage),
    [autoTranslateEnabled, ownerLanguages, targetLanguage],
  );
  const [showOriginal, setShowOriginal] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const textFingerprint = useMemo(() => JSON.stringify(texts), [texts]);

  useEffect(() => {
    if (!shouldTranslate) {
      setTranslations({});
      setFailed(false);
      setShowOriginal(false);
      return;
    }

    let cancelled = false;
    setPending(true);
    setFailed(false);

    void (async () => {
      try {
        const entries = await Promise.all(
          Object.entries(texts).map(async ([id, text]) => {
            if (!text.trim()) return [id, ""] as const;
            const translated = await translateWithGoogle(text, targetLanguage);
            return [id, translated] as const;
          }),
        );
        if (!cancelled) setTranslations(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shouldTranslate, targetLanguage, textFingerprint, texts]);

  function display(id: string, fallback = "") {
    const original = texts[id] ?? fallback;
    if (!shouldTranslate || showOriginal || pending || !translations[id]) return original;
    return translations[id];
  }

  const hasTranslations = Object.values(translations).some(Boolean);

  return {
    display,
    failed,
    hasTranslations,
    pending,
    shouldTranslate,
    showOriginal,
    setShowOriginal,
  };
}

export function AutoTranslationAttribution({
  failed,
  hasTranslations,
  pending,
  shouldTranslate,
  showOriginal,
  onToggle,
}: {
  failed: boolean;
  hasTranslations: boolean;
  pending: boolean;
  shouldTranslate: boolean;
  showOriginal: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  if (!shouldTranslate) return null;

  return (
    <div className="mt-4 space-y-2">
      {pending ? (
        <p className="text-xs font-semibold text-slate">{t("applications.translating")}</p>
      ) : null}
      {failed ? (
        <p className="text-xs font-semibold text-coral" role="alert">
          {t("applications.translationFailed")}
        </p>
      ) : null}
      {!pending && hasTranslations ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold text-teal">
            {t("applications.translatedWithGoogle")}
          </span>
          <button
            className="font-bold text-teal underline-offset-2 hover:underline"
            onClick={onToggle}
            type="button"
          >
            {showOriginal ? t("applications.hideTranslation") : t("detail.showOriginal")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
