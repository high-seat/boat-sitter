import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type FormLabelTag = "span" | "legend" | "p";

export function FormLabel({
  children,
  required = false,
  optional = false,
  as = "span",
  id,
  testId,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
  as?: FormLabelTag;
  id?: string;
  testId?: string;
}) {
  const { t } = useTranslation();
  const Tag = as;
  let resolvedTestId = testId;
  if (!resolvedTestId && required) resolvedTestId = "form-label-required";
  else if (!resolvedTestId && optional) resolvedTestId = "form-label-optional";

  return (
    <Tag className="form-label" data-testid={resolvedTestId} id={id}>
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <span>{children}</span>
        {required ? (
          <>
            <span aria-hidden="true" className="font-bold text-coral">
              *
            </span>
            <span className="sr-only">{t("common.required")}</span>
          </>
        ) : null}
        {optional ? (
          <span className="font-semibold normal-case tracking-normal text-slate">
            ({t("common.optional")})
          </span>
        ) : null}
      </span>
    </Tag>
  );
}
