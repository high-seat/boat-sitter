import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";

type SitEmergencyHelpProps = {
  /** Match nearby action buttons: card actions use rounded-xl; headers often use pills. */
  shape?: "card" | "pill";
  className?: string;
};

export function SitEmergencyHelp({ shape = "card", className = "" }: SitEmergencyHelpProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const shapeClass =
    shape === "pill"
      ? "rounded-full border border-coral/50 bg-white px-5 py-2.5"
      : "rounded-xl border border-coral/50 bg-white px-4 py-2.5";

  return (
    <>
      <button
        className={`inline-flex items-center gap-2 text-sm font-bold text-coral hover:border-coral hover:bg-coral/5 ${shapeClass} ${className}`}
        data-testid="sit-emergency-help"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PhoneCall aria-hidden="true" size={16} />
        {t("sitEmergency.button")}
      </button>
      {open ? (
        <Modal
          onClose={() => setOpen(false)}
          title={t("sitEmergency.title")}
          titleId="sit-emergency-title"
        >
          <p className="text-sm leading-6 text-slate">{t("sitEmergency.lead")}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-navy">
            <li>{t("sitEmergency.police")}</li>
            <li>{t("sitEmergency.ambulance")}</li>
            <li>{t("sitEmergency.fire")}</li>
            <li>{t("sitEmergency.coastGuard")}</li>
          </ul>
          <p className="mt-4 text-sm leading-6 text-slate">{t("sitEmergency.hint")}</p>
          <button
            className="mt-6 w-full rounded-full bg-navy px-6 py-3 font-bold text-white hover:bg-teal"
            onClick={() => setOpen(false)}
            type="button"
          >
            {t("sitEmergency.dismiss")}
          </button>
        </Modal>
      ) : null}
    </>
  );
}
