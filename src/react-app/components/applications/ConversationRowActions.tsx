import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Popover from "@radix-ui/react-popover";
import { Archive, ArchiveRestore, Ellipsis, Flag, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { REPORT_REASONS, useAppStore, type ReportReason } from "@/store";

export function ConversationRowActions({
  applicationId,
  isArchived,
  otherImage,
  otherName,
  onArchive,
  onDelete,
  onUnarchive,
}: {
  applicationId: string;
  isArchived: boolean;
  otherImage: string;
  otherName: string;
  onArchive: () => void;
  onDelete: () => void;
  onUnarchive: () => void;
}) {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const reportUser = useAppStore((state) => state.reportUser);
  const blockUser = useAppStore((state) => state.blockUser);
  const isBlocked = useAppStore((state) =>
    state.blockedUsers.some((blocked) => blocked.name === otherName),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportAlsoBlock, setReportAlsoBlock] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  if (!user || user.name === otherName) return null;

  function openReport() {
    setMenuOpen(false);
    setReportReason("spam");
    setReportDetails("");
    setReportAlsoBlock(false);
    setReportError("");
    setReportSubmitted(false);
    setReporting(true);
  }

  function openDelete() {
    setMenuOpen(false);
    setDeleting(true);
  }

  function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (reportReason === "other" && !reportDetails.trim()) {
      setReportError(t("safetyActions.reportDetailsRequired"));
      return;
    }
    reportUser({
      targetName: otherName,
      reason: reportReason,
      details: reportDetails,
      applicationId,
    });
    if (reportAlsoBlock && !isBlocked) {
      blockUser({ name: otherName, image: otherImage });
    }
    setReportSubmitted(true);
  }

  function confirmDelete() {
    setDeleting(false);
    onDelete();
  }

  return (
    <>
      <Popover.Root onOpenChange={setMenuOpen} open={menuOpen}>
        <Popover.Trigger asChild>
          <button
            aria-label={t("messages.rowActions")}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate transition hover:bg-white/80 hover:text-navy"
            data-testid={`conversation-row-actions-${applicationId}`}
            onClick={(event) => {
              event.stopPropagation();
            }}
            type="button"
          >
            <Ellipsis aria-hidden="true" size={16} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            avoidCollisions
            className="z-80 min-w-48 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-float outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            collisionPadding={12}
            data-testid={`conversation-row-actions-menu-${applicationId}`}
            onClick={(event) => event.stopPropagation()}
            role="menu"
            side="bottom"
            sideOffset={4}
          >
            <button
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-navy hover:bg-cream"
              data-testid={`conversation-row-archive-${applicationId}`}
              onClick={() => {
                setMenuOpen(false);
                if (isArchived) onUnarchive();
                else onArchive();
              }}
              role="menuitem"
              type="button"
            >
              {isArchived ? (
                <ArchiveRestore aria-hidden="true" className="text-teal" size={15} />
              ) : (
                <Archive aria-hidden="true" className="text-teal" size={15} />
              )}
              {isArchived ? t("messages.menuUnarchive") : t("messages.menuArchive")}
            </button>
            <button
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-navy hover:bg-cream"
              data-testid={`conversation-row-report-${applicationId}`}
              onClick={openReport}
              role="menuitem"
              type="button"
            >
              <Flag aria-hidden="true" className="text-slate" size={15} />
              {t("messages.menuReport")}
            </button>
            <button
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-coral hover:bg-cream"
              data-testid={`conversation-row-delete-${applicationId}`}
              onClick={openDelete}
              role="menuitem"
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} />
              {t("messages.menuDelete")}
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {reporting ? (
        <div
          className="fixed inset-0 z-90 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
          data-testid={`conversation-row-report-dialog-${applicationId}`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setReporting(false);
          }}
        >
          <section
            aria-labelledby={`conversation-report-title-${applicationId}`}
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
                  id={`conversation-report-title-${applicationId}`}
                >
                  {t("safetyActions.reportThanksTitle")}
                </h2>
                <p className="mt-3 leading-7 text-slate">
                  {t("safetyActions.reportThanksText", { name: otherName })}
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
                  id={`conversation-report-title-${applicationId}`}
                >
                  {t("safetyActions.reportTitle", { name: otherName })}
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
                {!isBlocked ? (
                  <label
                    className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-cream p-4 text-sm leading-6 text-navy"
                    data-testid="report-also-block"
                  >
                    <input
                      checked={reportAlsoBlock}
                      className="mt-1 size-4 accent-teal"
                      onChange={(event) => setReportAlsoBlock(event.target.checked)}
                      type="checkbox"
                    />
                    <span>
                      <span className="block font-bold">
                        {t("safetyActions.reportAlsoBlock", { name: otherName })}
                      </span>
                      <span className="mt-1 block text-slate">{t("safetyActions.blockText")}</span>
                    </span>
                  </label>
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
                    data-testid="report-submit"
                    type="submit"
                  >
                    {t("safetyActions.reportSubmit")}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          confirmLabel={t("messages.deleteConfirm")}
          onCancel={() => setDeleting(false)}
          onConfirm={confirmDelete}
          testId={`conversation-row-delete-dialog-${applicationId}`}
          text={t("messages.deleteText", { name: otherName })}
          title={t("messages.deleteTitle")}
          tone="danger"
          icon={<Trash2 size={24} />}
        />
      ) : null}
    </>
  );
}
