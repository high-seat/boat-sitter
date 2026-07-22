import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

/** Labeled panel for live form previews in vessel/sit editors. */
export function EditorLivePreview({ children, hint }: { children: ReactNode; hint?: string }) {
  const { t } = useTranslation();
  return (
    <aside
      aria-label={t("editorPreview.label")}
      className="rounded-2xl border border-line bg-cream/50 p-4 sm:p-5"
    >
      <p className="eyebrow text-teal">{t("editorPreview.kicker")}</p>
      <h3 className="mt-1 font-display text-lg font-bold text-navy">{t("editorPreview.title")}</h3>
      {hint ? <p className="mt-1 text-sm text-slate">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </aside>
  );
}
