import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function TermsAgreementCheckbox({
  checked,
  i18nKey,
  onChange,
  required = false,
}: {
  checked: boolean;
  i18nKey: string;
  onChange: (checked: boolean) => void;
  required?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-cream/60 p-4">
      <input
        checked={checked}
        className="mt-0.5 size-4 shrink-0 accent-teal"
        onChange={(event) => onChange(event.target.checked)}
        required={required}
        type="checkbox"
      />
      <span className="text-sm leading-6 text-navy">
        <Trans
          components={{
            terms: (
              <Link
                className="font-bold text-teal underline underline-offset-2"
                rel="noopener noreferrer"
                target="_blank"
                to="/terms"
              />
            ),
          }}
          i18nKey={i18nKey}
        />
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 font-bold text-coral">
              *
            </span>
            <span className="sr-only"> {t("common.required")}</span>
          </>
        ) : null}
      </span>
    </label>
  );
}
