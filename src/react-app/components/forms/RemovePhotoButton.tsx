import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function RemovePhotoButton({ onClick, testId }: { onClick: () => void; testId?: string }) {
  const { t } = useTranslation();

  return (
    <button
      className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-coral"
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      <Trash2 aria-hidden="true" size={14} />
      {t("upload.remove")}
    </button>
  );
}
