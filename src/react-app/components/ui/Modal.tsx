import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Modal({
  title,
  titleId = "modal-title",
  onClose,
  children,
  pending = false,
  wide = false,
}: {
  title: string;
  titleId?: string;
  onClose: () => void;
  children: ReactNode;
  pending?: boolean;
  wide?: boolean;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, pending]);

  return (
    <div
      className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !pending) onClose();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`w-full rounded-3xl bg-white p-6 shadow-float md:p-8 ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-navy" id={titleId}>
            {title}
          </h2>
          <button
            aria-label={t("common.close")}
            className="rounded-full p-2 text-slate hover:bg-cream hover:text-navy disabled:opacity-60"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}
