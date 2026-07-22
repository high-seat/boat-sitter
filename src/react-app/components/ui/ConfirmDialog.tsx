import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

type ConfirmTone = "default" | "danger" | "warning";

const toneStyles: Record<
  ConfirmTone,
  { icon: string; confirm: string }
> = {
  default: {
    icon: "bg-seafoam text-teal",
    confirm: "bg-navy text-white hover:bg-ink",
  },
  warning: {
    icon: "bg-amber-100 text-amber-800",
    confirm: "bg-navy text-white hover:bg-ink",
  },
  danger: {
    icon: "bg-red-100 text-red-700",
    confirm: "bg-red-600 text-white hover:bg-red-700",
  },
};

export function ConfirmDialog({
  title,
  titleId = "confirm-dialog-title",
  text,
  confirmLabel,
  cancelLabel,
  tone = "warning",
  icon,
  pending = false,
  onCancel,
  onConfirm,
  children,
}: {
  title: string;
  titleId?: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: ReactNode;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const styles = toneStyles[tone];

  return (
    <div
      className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !pending) onCancel();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
        role="dialog"
      >
        <span className={`grid size-12 place-items-center rounded-full ${styles.icon}`}>
          {icon ?? <TriangleAlert size={24} />}
        </span>
        <h2 className="mt-5 font-display text-2xl font-bold text-navy" id={titleId}>
          {title}
        </h2>
        <p className="mt-3 leading-7 text-slate">{text}</p>
        {children}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel ?? t("common.cancel")}
          </button>
          <button
            className={`rounded-xl px-5 py-3 font-bold disabled:opacity-60 ${styles.confirm}`}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
