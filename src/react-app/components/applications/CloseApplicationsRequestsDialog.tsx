import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function CloseApplicationsRequestsDialog({
  pending,
  onCancel,
  onConfirm,
}: {
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      confirmLabel={t("applications.confirm.closeRequestsAction")}
      onCancel={onCancel}
      onConfirm={onConfirm}
      pending={pending}
      text={t("applications.confirm.closeRequestsText")}
      title={t("applications.confirm.closeRequestsTitle")}
      titleId="close-applications-confirm-title"
      tone="warning"
    />
  );
}
