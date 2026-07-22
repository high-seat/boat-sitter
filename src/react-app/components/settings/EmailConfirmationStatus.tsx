import { useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { resendMockEmailConfirmation } from "@/mockAuth";

export function EmailConfirmationStatus({
  confirmed,
  email,
  onFlash,
}: {
  confirmed: boolean;
  email: string;
  onFlash: (message: string) => void;
}) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);

  async function resend() {
    setPending(true);
    try {
      await resendMockEmailConfirmation(email);
      onFlash(t("settings.confirmationEmailSent"));
    } catch (caught) {
      onFlash(t(caught instanceof Error ? caught.message : "settings.confirmationResendFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 border-t border-line pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="form-label">{t("settings.emailConfirmationTitle")}</span>
          <p
            className={`mt-1 text-sm font-semibold ${confirmed ? "text-teal" : "text-coral"}`}
            data-testid="email-confirmation-status"
          >
            {confirmed ? t("settings.emailConfirmed") : t("settings.emailUnconfirmed")}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate">
            {confirmed
              ? t("settings.emailConfirmationHintConfirmed")
              : t("settings.emailConfirmationHintUnconfirmed")}
          </p>
        </div>
        <span
          aria-hidden
          className={`mt-1 grid size-8 shrink-0 place-items-center rounded-full ${
            confirmed ? "bg-teal/15 text-teal" : "bg-coral/15 text-coral"
          }`}
        >
          {confirmed ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
        </span>
      </div>
      {!confirmed ? (
        <button
          className="mt-4 rounded-xl border border-line px-5 py-3 text-sm font-bold text-navy hover:border-teal disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          onClick={() => void resend()}
          type="button"
        >
          {pending ? t("settings.resendingConfirmation") : t("settings.resendConfirmation")}
        </button>
      ) : null}
    </div>
  );
}
