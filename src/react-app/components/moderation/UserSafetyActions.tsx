import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban, Flag, TriangleAlert } from "lucide-react";
import { REPORT_REASONS, useAppStore, type ReportReason } from "@/store";
import { Select } from "@/components/ui/Select";

export function UserSafetyActions({
  image,
  name,
  variant = "buttons",
}: {
  image: string;
  name: string;
  variant?: "buttons" | "menu";
}) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const blockedUsers = useAppStore((state) => state.blockedUsers);
  const blockUser = useAppStore((state) => state.blockUser);
  const unblockUser = useAppStore((state) => state.unblockUser);
  const reportUser = useAppStore((state) => state.reportUser);
  const isBlocked = blockedUsers.some((blocked) => blocked.name === name);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!user || user.name === name) return null;

  function openReport() {
    setReportReason("spam");
    setReportDetails("");
    setReportError("");
    setReportSubmitted(false);
    setReporting(true);
  }

  function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (reportReason === "other" && !reportDetails.trim()) {
      setReportError(t("safetyActions.reportDetailsRequired"));
      return;
    }
    reportUser({ targetName: name, reason: reportReason, details: reportDetails });
    setReportSubmitted(true);
  }

  function confirmBlock() {
    blockUser({ name, image });
    setBlocking(false);
  }

  const buttonClass =
    variant === "menu"
      ? "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-navy hover:bg-cream"
      : "rounded-full border border-line bg-white px-4 py-2.5 text-sm font-bold text-navy hover:border-teal";

  return (
    <>
      <div className={variant === "menu" ? "space-y-1" : "flex flex-wrap gap-2"}>
        <button className={buttonClass} onClick={openReport} type="button">
          <span className="flex items-center gap-2">
            <Flag size={16} /> {t("safetyActions.report")}
          </span>
        </button>
        {isBlocked ? (
          <button className={buttonClass} onClick={() => unblockUser(name)} type="button">
            <span className="flex items-center gap-2">
              <Ban size={16} /> {t("safetyActions.unblock")}
            </span>
          </button>
        ) : (
          <button className={buttonClass} onClick={() => setBlocking(true)} type="button">
            <span className="flex items-center gap-2">
              <Ban size={16} /> {t("safetyActions.block")}
            </span>
          </button>
        )}
      </div>

      {reporting && (
        <div
          className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setReporting(false);
          }}
        >
          <section
            aria-labelledby="report-user-title"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
            role="dialog"
          >
            {reportSubmitted ? (
              <>
                <span className="grid size-12 place-items-center rounded-full bg-seafoam text-teal">
                  <Flag size={22} />
                </span>
                <h2
                  className="mt-5 font-display text-2xl font-bold text-navy"
                  id="report-user-title"
                >
                  {t("safetyActions.reportThanksTitle")}
                </h2>
                <p className="mt-3 leading-7 text-slate">
                  {t("safetyActions.reportThanksText", { name })}
                </p>
                <button
                  className="mt-7 w-full rounded-xl bg-navy px-5 py-3 font-bold text-white"
                  onClick={() => setReporting(false)}
                  type="button"
                >
                  {t("common.done")}
                </button>
              </>
            ) : (
              <form onSubmit={submitReport}>
                <span className="grid size-12 place-items-center rounded-full bg-coral/10 text-coral">
                  <Flag size={22} />
                </span>
                <h2
                  className="mt-5 font-display text-2xl font-bold text-navy"
                  id="report-user-title"
                >
                  {t("safetyActions.reportTitle", { name })}
                </h2>
                <p className="mt-3 leading-7 text-slate">{t("safetyActions.reportText")}</p>
                <label className="mt-5 block">
                  <span className="form-label">{t("safetyActions.reportReason")}</span>
                  <Select
                    onChange={(event) => setReportReason(event.target.value as ReportReason)}
                    value={reportReason}
                    variant="form"
                  >
                    {REPORT_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {t(`safetyActions.reason.${reason}`)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="mt-4 block">
                  <span className="form-label">{t("safetyActions.reportDetails")}</span>
                  <textarea
                    className="form-input min-h-28"
                    onChange={(event) => {
                      setReportDetails(event.target.value);
                      setReportError("");
                    }}
                    placeholder={t("safetyActions.reportDetailsPlaceholder")}
                    value={reportDetails}
                  />
                </label>
                {reportError ? (
                  <p className="mt-2 text-sm font-semibold text-coral" role="alert">
                    {reportError}
                  </p>
                ) : null}
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <button
                    className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
                    onClick={() => setReporting(false)}
                    type="button"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    className="rounded-xl bg-coral px-5 py-3 font-bold text-white"
                    type="submit"
                  >
                    {t("safetyActions.reportSubmit")}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {blocking && (
        <div
          className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setBlocking(false);
          }}
        >
          <section
            aria-labelledby="block-user-title"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
            role="dialog"
          >
            <span className="grid size-12 place-items-center rounded-full bg-red-100 text-red-700">
              <TriangleAlert size={24} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold text-navy" id="block-user-title">
              {t("safetyActions.blockTitle", { name })}
            </h2>
            <p className="mt-3 leading-7 text-slate">{t("safetyActions.blockText")}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <button
                className="rounded-xl border border-line px-5 py-3 font-bold text-navy"
                onClick={() => setBlocking(false)}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <button
                className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
                onClick={confirmBlock}
                type="button"
              >
                {t("safetyActions.blockConfirm")}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function BlockedUserBanner({ name }: { name: string }) {
  const { t } = useTranslation();
  const unblockUser = useAppStore((state) => state.unblockUser);
  const isBlocked = useAppStore((state) =>
    state.blockedUsers.some((blocked) => blocked.name === name),
  );
  if (!isBlocked) return null;

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Ban className="mt-0.5 shrink-0 text-red-700" size={18} />
        <div>
          <p className="font-bold text-red-800">{t("safetyActions.blockedBannerTitle")}</p>
          <p className="mt-1 text-sm leading-6 text-red-800/80">
            {t("safetyActions.blockedBannerText", { name })}
          </p>
        </div>
      </div>
      <button
        className="shrink-0 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-bold text-red-800"
        onClick={() => unblockUser(name)}
        type="button"
      >
        {t("safetyActions.unblock")}
      </button>
    </div>
  );
}
