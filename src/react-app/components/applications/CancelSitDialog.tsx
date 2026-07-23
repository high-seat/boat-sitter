import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function CancelSitDialog({
  pending,
  onCancel,
  onConfirm,
  titleId = "cancel-sit-confirm-title",
}: {
  pending: boolean;
  onCancel: () => void;
  onConfirm: (options: { reopenApplications: boolean }) => void;
  titleId?: string;
}) {
  const { t } = useTranslation();
  const [reopenApplications, setReopenApplications] = useState(false);

  return (
    <ConfirmDialog
      confirmLabel={
        reopenApplications ? t("owner.cancelSitReopenAction") : t("owner.cancelSitAction")
      }
      onCancel={onCancel}
      onConfirm={() => onConfirm({ reopenApplications })}
      pending={pending}
      testId="cancel-sit-confirm"
      text={reopenApplications ? t("owner.cancelSitReopenConfirm") : t("owner.cancelSitConfirm")}
      title={t("owner.cancelSitTitle")}
      titleId={titleId}
      tone="danger"
    >
      <label
        className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-cream p-4 text-sm leading-6 text-navy"
        data-testid="cancel-sit-reopen"
      >
        <input
          checked={reopenApplications}
          className="mt-1 size-4 accent-teal"
          onChange={(event) => setReopenApplications(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block font-bold">{t("owner.cancelSitReopenCheckbox")}</span>
          <span className="mt-1 block text-slate">{t("owner.cancelSitReopenHint")}</span>
        </span>
      </label>
    </ConfirmDialog>
  );
}
