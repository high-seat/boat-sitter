import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SitApplication } from "@/mockApi";

export function WithdrawInterestDialog({
  application,
  pending,
  onCancel,
  onConfirm,
}: {
  application: SitApplication;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (explanation: string) => void;
}) {
  const { t } = useTranslation();
  const [explanation, setExplanation] = useState("");

  return (
    <ConfirmDialog
      confirmLabel={t("sits.withdrawConfirmAction")}
      onCancel={onCancel}
      onConfirm={() => onConfirm(explanation.trim())}
      pending={pending}
      text={
        application.status === "accepted"
          ? t("sits.withdrawAcceptedConfirmText", { boat: application.boatName })
          : t("sits.withdrawConfirmText", { boat: application.boatName })
      }
      title={t("sits.withdrawConfirmTitle")}
      titleId="withdraw-interest-confirm-title"
      tone="danger"
    >
      <div className="mt-5">
        <label className="block">
          <span className="form-label">{t("sits.withdrawExplanationLabel")}</span>
          <textarea
            className="form-input mt-1 min-h-24 resize-y"
            disabled={pending}
            maxLength={500}
            onChange={(event) => setExplanation(event.target.value)}
            placeholder={t("sits.withdrawExplanationPlaceholder")}
            value={explanation}
          />
        </label>
        <p className="mt-1.5 text-xs leading-5 text-slate">{t("sits.withdrawExplanationHint")}</p>
      </div>
    </ConfirmDialog>
  );
}
