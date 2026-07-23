import { useTranslation } from "react-i18next";

/** Create-form note that styles the required asterisk like FormLabel. */
export function EditorRequiredFieldsHint({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  const [before, after = ""] = t("editor.requiredFieldsHint").split("*");

  return (
    <p
      className={`text-sm leading-5 text-slate ${className}`.trim()}
      data-testid="editor-required-fields-hint"
    >
      {before}
      <span aria-hidden="true" className="font-bold text-coral">
        *
      </span>
      {after}
    </p>
  );
}
