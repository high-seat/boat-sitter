import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ellipsis, Flag, Languages, Phone, Send, Video, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getIntlLocale } from "@/i18n";
import {
  getSitPrivateAccessForViewer,
  type ApplicationMessage,
  type SitApplication,
} from "@/mockApi";
import { VesselPrivateAccessCard } from "@/components/listing/VesselPrivateAccessCard";
import { REPORT_REASONS, useAppStore, type ReportReason } from "@/store";
import { translateWithGoogle } from "@/translationService";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import {
  VideoCallScheduleModal,
  type VideoCallScheduleValues,
} from "@/components/applications/VideoCallScheduleModal";
import {
  formatApplicationSystemMessage,
  getLatestPendingVideoCallProposal,
} from "@/components/applications/formatApplicationSystemMessage";
import { VideoCallCalendarLinks } from "@/components/applications/VideoCallCalendarLinks";

export function ConversationPanel({
  application,
  currentUser,
  onSend,
  onRequestVideoCall,
  onRespondToVideoCall,
  onSharePhone,
  pending,
  translationLanguage,
}: {
  application: SitApplication;
  currentUser: string;
  onSend: (message: string) => void;
  onRequestVideoCall: (proposal: VideoCallScheduleValues) => void;
  onRespondToVideoCall: (input: {
    action: "accept" | "decline" | "counter";
    messageId: string;
    proposal?: VideoCallScheduleValues;
  }) => void;
  onSharePhone: (phoneNumber: string) => void;
  pending: boolean;
  translationLanguage: string;
}) {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const [reply, setReply] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translationPending, setTranslationPending] = useState<Record<string, boolean>>({});
  const [translationErrors, setTranslationErrors] = useState<Record<string, boolean>>({});
  const [reportingMessage, setReportingMessage] = useState<ApplicationMessage | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sharePhoneConfirmOpen, setSharePhoneConfirmOpen] = useState(false);
  const [scheduleModal, setScheduleModal] = useState<
    null | { mode: "propose" } | { mode: "adjust"; message: ApplicationMessage }
  >(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const localTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setReply("");
    setOpenMenuId(null);
  }, [application.id]);
  useEffect(() => {
    setTranslations({});
    setTranslationPending({});
    setTranslationErrors({});
  }, [application.id, i18n.resolvedLanguage]);
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("boatstead-chat-typing");
    channelRef.current = channel;
    channel.onmessage = (
      event: MessageEvent<{
        applicationId: string;
        isTyping: boolean;
        senderName: string;
      }>,
    ) => {
      const message = event.data;
      if (message.applicationId !== application.id || message.senderName === currentUser) return;
      if (remoteTypingTimerRef.current) clearTimeout(remoteTypingTimerRef.current);
      setTypingUser(message.isTyping ? message.senderName : "");
      if (message.isTyping) {
        remoteTypingTimerRef.current = setTimeout(() => setTypingUser(""), 3_000);
      }
    };
    return () => {
      if (localTypingTimerRef.current) clearTimeout(localTypingTimerRef.current);
      if (remoteTypingTimerRef.current) clearTimeout(remoteTypingTimerRef.current);
      channel.close();
      channelRef.current = null;
      setTypingUser("");
    };
  }, [application.id, currentUser]);

  function publishTyping(isTyping: boolean) {
    channelRef.current?.postMessage({
      applicationId: application.id,
      isTyping,
      senderName: currentUser,
    });
  }

  function updateReply(value: string) {
    setReply(value);
    publishTyping(Boolean(value.trim()));
    if (localTypingTimerRef.current) clearTimeout(localTypingTimerRef.current);
    if (value.trim()) {
      localTypingTimerRef.current = setTimeout(() => publishTyping(false), 1_500);
    }
  }

  async function translateMessage(messageId: string, text: string) {
    setTranslationPending((current) => ({ ...current, [messageId]: true }));
    setTranslationErrors((current) => ({ ...current, [messageId]: false }));
    try {
      const translated = await translateWithGoogle(
        text,
        i18n.resolvedLanguage ?? translationLanguage,
      );
      setTranslations((current) => ({ ...current, [messageId]: translated }));
    } catch {
      setTranslationErrors((current) => ({ ...current, [messageId]: true }));
    } finally {
      setTranslationPending((current) => ({ ...current, [messageId]: false }));
    }
  }

  function openMessageReport(message: ApplicationMessage) {
    setReportingMessage(message);
  }

  const formatter = new Intl.DateTimeFormat(getIntlLocale(i18n.language), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const scheduleFormatter = new Intl.DateTimeFormat(getIntlLocale(i18n.language), {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const sharedOwnerPhone =
    application.status === "accepted" &&
    currentUser === application.applicant.name &&
    application.ownerPhone;
  const { data: privateAccess } = useQuery({
    queryKey: ["sit-private-access", application.sitId, currentUser],
    queryFn: () => getSitPrivateAccessForViewer(application.sitId, currentUser),
    enabled: application.status === "accepted",
  });
  const otherPartyName =
    currentUser === application.ownerName ? application.applicant.name : application.ownerName;
  const profilePhone = user?.phoneNumber.trim()
    ? `${user.phoneCountryCode} ${user.phoneNumber.trim()}`
    : "";
  const latestPendingProposal = getLatestPendingVideoCallProposal(application.messages);

  function formatVideoCallDetails(message: ApplicationMessage) {
    if (!message.videoCall) return null;
    return t("applications.videoCall.proposedDetails", {
      when: scheduleFormatter.format(new Date(message.videoCall.startsAt)),
      duration: t("applications.videoCall.durationMinutes", {
        count: message.videoCall.durationMinutes,
      }),
    });
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-lg font-bold text-navy">
          {t("applications.conversation")}
        </h2>
      </div>
      {sharedOwnerPhone && (
        <div className="border-b border-aqua/40 bg-seafoam px-5 py-4">
          <p className="wrap-break-word text-sm font-semibold text-teal">
            {t("applications.phoneShared", { owner: application.ownerName })}
          </p>
          <a
            className="mt-2 inline-flex items-center gap-2 font-bold text-navy hover:text-teal"
            href={`tel:${sharedOwnerPhone.replaceAll(/[^\d+]/g, "")}`}
          >
            <Phone aria-hidden="true" size={17} />
            {sharedOwnerPhone}
          </a>
        </div>
      )}
      {application.status === "accepted" && privateAccess && (
        <div className="border-b border-line p-4">
          <VesselPrivateAccessCard
            details={privateAccess}
            variant={currentUser === application.ownerName ? "owner" : "sitter"}
          />
        </div>
      )}
      <div className="max-h-96 space-y-4 overflow-y-auto p-5">
        {application.messages.map((message) => {
          if (message.kind === "system") {
            if (message.systemKind === "phoneShared" && message.sharedPhone) {
              return (
                <div className="flex justify-center" key={message.id}>
                  <div className="flex max-w-[90%] items-start gap-3 rounded-2xl border border-teal/25 bg-seafoam px-4 py-3 text-sm leading-6 text-navy">
                    <Phone aria-hidden="true" className="mt-0.5 shrink-0 text-teal" size={18} />
                    <div className="min-w-0">
                      <p className="font-bold text-navy">
                        {t("applications.systemMessage.phoneSharedTitle")}
                      </p>
                      <p className="mt-1 text-slate">
                        {formatApplicationSystemMessage(t, message, application, currentUser)}
                      </p>
                      <a
                        className="mt-2 inline-flex items-center gap-2 font-bold text-navy hover:text-teal"
                        href={`tel:${message.sharedPhone.replaceAll(/[^\d+]/g, "")}`}
                      >
                        <Phone aria-hidden="true" size={16} />
                        {message.sharedPhone}
                      </a>
                      <p className="mt-2 text-[11px] font-semibold text-teal">
                        {formatter.format(new Date(message.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            if (message.systemKind === "withdrawn") {
              const body = formatApplicationSystemMessage(t, message, application, currentUser);
              if (message.text.trim()) {
                return (
                  <div className="flex justify-center" key={message.id}>
                    <div className="max-w-[90%] rounded-2xl border border-slate/20 bg-cream px-4 py-3 text-sm leading-6 text-navy">
                      <p className="font-bold text-navy">
                        {t("applications.systemMessage.withdrawnTitle")}
                      </p>
                      <p className="mt-1 text-slate">{body}</p>
                      <p className="mt-2 rounded-xl border border-line bg-white px-3 py-2 text-navy">
                        {message.text}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold text-teal">
                        {formatter.format(new Date(message.createdAt))}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="flex justify-center" key={message.id}>
                  <p className="max-w-[90%] rounded-full bg-seafoam px-4 py-2 text-center text-xs font-semibold leading-5 text-teal">
                    {body}
                  </p>
                </div>
              );
            }
            if (
              message.systemKind === "videoCallRequest" ||
              message.systemKind === "videoCallCounter" ||
              message.systemKind === "videoCallAccepted" ||
              message.systemKind === "videoCallDeclined"
            ) {
              const titleKey =
                message.systemKind === "videoCallRequest"
                  ? "applications.systemMessage.videoCallRequestTitle"
                  : message.systemKind === "videoCallCounter"
                    ? "applications.systemMessage.videoCallCounterTitle"
                    : message.systemKind === "videoCallAccepted"
                      ? "applications.systemMessage.videoCallAcceptedTitle"
                      : "applications.systemMessage.videoCallDeclinedTitle";
              const details = formatVideoCallDetails(message);
              const canRespond =
                latestPendingProposal?.id === message.id &&
                message.senderName !== currentUser &&
                (message.systemKind === "videoCallRequest" ||
                  message.systemKind === "videoCallCounter");
              return (
                <div className="flex justify-center" key={message.id}>
                  <div className="flex max-w-[90%] items-start gap-3 rounded-2xl border border-teal/25 bg-seafoam px-4 py-3 text-sm leading-6 text-navy">
                    <Video aria-hidden="true" className="mt-0.5 shrink-0 text-teal" size={18} />
                    <div className="min-w-0">
                      <p className="font-bold text-navy">{t(titleKey)}</p>
                      <p className="mt-1 text-slate">
                        {formatApplicationSystemMessage(t, message, application, currentUser)}
                      </p>
                      {details ? <p className="mt-2 font-semibold text-navy">{details}</p> : null}
                      {message.systemKind === "videoCallAccepted" && message.videoCall ? (
                        <VideoCallCalendarLinks
                          event={{
                            title: t("applications.videoCall.calendarTitle", {
                              name: otherPartyName,
                              boat: application.boatName,
                            }),
                            description: t("applications.videoCall.calendarDescription", {
                              name: otherPartyName,
                              boat: application.boatName,
                            }),
                            startsAt: message.videoCall.startsAt,
                            durationMinutes: message.videoCall.durationMinutes,
                          }}
                        />
                      ) : null}
                      {canRespond ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                            disabled={pending}
                            onClick={() =>
                              onRespondToVideoCall({
                                action: "accept",
                                messageId: message.id,
                              })
                            }
                            type="button"
                          >
                            {t("applications.videoCall.accept")}
                          </button>
                          <button
                            className="rounded-full border border-teal/40 bg-white px-3.5 py-1.5 text-xs font-bold text-teal disabled:opacity-50"
                            disabled={pending}
                            onClick={() => setScheduleModal({ mode: "adjust", message })}
                            type="button"
                          >
                            {t("applications.videoCall.suggestDifferent")}
                          </button>
                          <button
                            className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-bold text-slate disabled:opacity-50"
                            disabled={pending}
                            onClick={() =>
                              onRespondToVideoCall({
                                action: "decline",
                                messageId: message.id,
                              })
                            }
                            type="button"
                          >
                            {t("applications.videoCall.decline")}
                          </button>
                        </div>
                      ) : null}
                      <p className="mt-2 text-[11px] font-semibold text-teal">
                        {formatter.format(new Date(message.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="flex justify-center" key={message.id}>
                <p className="max-w-[90%] rounded-full bg-seafoam px-4 py-2 text-center text-xs font-semibold leading-5 text-teal">
                  {message.systemKind === "accepted" ||
                  message.systemKind === "declined" ||
                  message.systemKind === "applicantsClosed"
                    ? formatApplicationSystemMessage(t, message, application, currentUser)
                    : message.text}
                </p>
              </div>
            );
          }

          const mine = message.senderName === currentUser;
          return (
            <div className={`flex ${mine ? "justify-end" : "justify-start"}`} key={message.id}>
              <div
                className={`relative max-w-[85%] rounded-2xl px-4 py-3 ${
                  mine ? "bg-navy text-white" : "bg-cream text-navy"
                }`}
              >
                <div className={`flex items-start justify-between gap-2 ${mine ? "" : "pr-1"}`}>
                  <p className={`text-xs font-bold ${mine ? "text-aqua" : "text-teal"}`}>
                    {message.senderName}
                  </p>
                  {!mine && (
                    <MessageActionsMenu
                      hasTranslation={Boolean(translations[message.id])}
                      isOpen={openMenuId === message.id}
                      onClose={() => setOpenMenuId(null)}
                      onReport={() => {
                        setOpenMenuId(null);
                        openMessageReport(message);
                      }}
                      onToggle={() =>
                        setOpenMenuId((current) => (current === message.id ? null : message.id))
                      }
                      onTranslate={() => {
                        setOpenMenuId(null);
                        if (translations[message.id]) {
                          setTranslations((current) => {
                            const next = { ...current };
                            delete next[message.id];
                            return next;
                          });
                          return;
                        }
                        void translateMessage(message.id, message.text);
                      }}
                      translatePending={Boolean(translationPending[message.id])}
                    />
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6">
                  {message.text}
                </p>
                <p className={`mt-2 text-[11px] ${mine ? "text-white/60" : "text-slate"}`}>
                  {formatter.format(new Date(message.createdAt))}
                </p>
                {!mine && translations[message.id] && (
                  <div className="mt-3 rounded-xl border border-aqua/40 bg-white p-3 text-navy">
                    <p className="text-[11px] font-bold tracking-wide text-teal uppercase">
                      {t("applications.translatedWithGoogle")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6">
                      {translations[message.id]}
                    </p>
                  </div>
                )}
                {!mine && translationErrors[message.id] && (
                  <p className="mt-2 text-xs font-semibold text-coral" role="alert">
                    {t("applications.translationFailed")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="min-h-8 px-5 pb-3" aria-live="polite">
        {typingUser && (
          <p className="flex items-center gap-2 text-xs font-semibold text-teal">
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-1.5 animate-pulse rounded-full bg-teal" />
              <span className="size-1.5 animate-pulse rounded-full bg-teal [animation-delay:150ms]" />
              <span className="size-1.5 animate-pulse rounded-full bg-teal [animation-delay:300ms]" />
            </span>
            {t("applications.isTyping", { name: typingUser })}
          </p>
        )}
      </div>
      <div className="border-t border-line p-4">
        <label>
          <span className="sr-only">{t("applications.reply")}</span>
          <textarea
            className="form-input min-h-24 resize-y"
            onBlur={() => publishTyping(false)}
            onChange={(event) => updateReply(event.target.value)}
            placeholder={t("applications.replyPlaceholder")}
            value={reply}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="flex items-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            disabled={pending || !reply.trim()}
            onClick={() => {
              publishTyping(false);
              onSend(reply.trim());
              setReply("");
            }}
            type="button"
          >
            <Send size={16} />
            {pending ? t("applications.sending") : t("applications.sendReply")}
          </button>
          <button
            className="flex items-center gap-2 rounded-xl border border-teal/40 bg-seafoam px-5 py-3 text-sm font-bold text-teal hover:border-teal disabled:opacity-50"
            disabled={pending}
            onClick={() => setScheduleModal({ mode: "propose" })}
            type="button"
          >
            <Video size={16} />
            {t("applications.requestVideoCall")}
          </button>
          <button
            className="flex items-center gap-2 rounded-xl border border-teal/40 bg-seafoam px-5 py-3 text-sm font-bold text-teal hover:border-teal disabled:opacity-50"
            disabled={pending || !profilePhone}
            onClick={() => setSharePhoneConfirmOpen(true)}
            type="button"
          >
            <Phone size={16} />
            {t("applications.sharePhoneInChat")}
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate">
          {t("applications.requestVideoCallHint")}
        </p>
        {profilePhone ? (
          <p className="mt-1 text-xs leading-5 text-slate">
            {t("applications.sharePhoneInChatHint")}
          </p>
        ) : (
          <p className="mt-1 text-xs leading-5 text-coral">
            {t("applications.sharePhoneUnavailable")}
          </p>
        )}
      </div>
      {sharePhoneConfirmOpen && profilePhone ? (
        <ConfirmDialog
          confirmLabel={t("applications.sharePhoneInChatConfirmAction")}
          icon={<Phone size={24} />}
          onCancel={() => setSharePhoneConfirmOpen(false)}
          onConfirm={() => {
            publishTyping(false);
            onSharePhone(profilePhone);
            setSharePhoneConfirmOpen(false);
          }}
          pending={pending}
          text={t("applications.sharePhoneInChatConfirmText", {
            name: otherPartyName,
            phone: profilePhone,
          })}
          title={t("applications.sharePhoneInChatConfirmTitle")}
          titleId="share-phone-confirm-title"
          tone="default"
        />
      ) : null}
      {scheduleModal && (
        <VideoCallScheduleModal
          initial={
            scheduleModal.mode === "adjust" && scheduleModal.message.videoCall
              ? scheduleModal.message.videoCall
              : undefined
          }
          mode={scheduleModal.mode === "adjust" ? "adjust" : "propose"}
          onCancel={() => setScheduleModal(null)}
          onSubmit={(proposal) => {
            publishTyping(false);
            if (scheduleModal.mode === "adjust") {
              onRespondToVideoCall({
                action: "counter",
                messageId: scheduleModal.message.id,
                proposal,
              });
            } else {
              onRequestVideoCall(proposal);
            }
            setScheduleModal(null);
          }}
          otherPartyName={otherPartyName}
          pending={pending}
        />
      )}
      {reportingMessage && (
        <ReportMessageModal
          application={application}
          close={() => setReportingMessage(null)}
          message={reportingMessage}
        />
      )}
    </section>
  );
}

function MessageActionsMenu({
  hasTranslation,
  isOpen,
  onClose,
  onReport,
  onToggle,
  onTranslate,
  translatePending,
}: {
  hasTranslation: boolean;
  isOpen: boolean;
  onClose: () => void;
  onReport: () => void;
  onToggle: () => void;
  onTranslate: () => void;
  translatePending: boolean;
}) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("applications.messageActions")}
        className="-mr-1 -mt-0.5 rounded-full p-1 text-slate hover:bg-white/80 hover:text-navy"
        onClick={onToggle}
        type="button"
      >
        <Ellipsis aria-hidden="true" size={16} />
      </button>
      {isOpen && (
        <div
          className="absolute top-full right-0 z-20 mt-1 min-w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-float"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-navy hover:bg-cream disabled:opacity-60"
            disabled={translatePending}
            onClick={onTranslate}
            role="menuitem"
            type="button"
          >
            <Languages aria-hidden="true" className="text-teal" size={15} />
            {translatePending
              ? t("applications.translating")
              : hasTranslation
                ? t("applications.hideTranslation")
                : t("applications.translateWithGoogle")}
          </button>
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-navy hover:bg-cream"
            onClick={onReport}
            role="menuitem"
            type="button"
          >
            <Flag aria-hidden="true" className="text-slate" size={15} />
            {t("messageReport.report")}
          </button>
        </div>
      )}
    </div>
  );
}

function ReportMessageModal({
  application,
  close,
  message,
}: {
  application: SitApplication;
  close: () => void;
  message: ApplicationMessage;
}) {
  const { t } = useTranslation();
  const reportUser = useAppStore((state) => state.reportUser);
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (reason === "other" && !details.trim()) {
      setError(t("messageReport.detailsRequired"));
      return;
    }
    setError("");
    reportUser({
      targetName: message.senderName,
      reason,
      details,
      applicationId: application.id,
      boatName: application.boatName,
      messageId: message.id,
      messageText: message.text,
      messageCreatedAt: message.createdAt,
    });
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-2000 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <section
        aria-labelledby="report-message-title"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
        role="dialog"
      >
        {submitted ? (
          <>
            <span className="grid size-12 place-items-center rounded-full bg-seafoam text-teal">
              <Flag size={22} />
            </span>
            <h2
              className="mt-5 font-display text-2xl font-bold text-navy"
              id="report-message-title"
            >
              {t("messageReport.successTitle")}
            </h2>
            <p className="mt-3 leading-7 text-slate">
              {t("messageReport.successText", { name: message.senderName })}
            </p>
            <button
              className="mt-7 w-full rounded-xl bg-navy px-5 py-3 font-bold text-white"
              onClick={close}
              type="button"
            >
              {t("common.done")}
            </button>
          </>
        ) : (
          <form onSubmit={submitReport}>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-coral/10 text-coral">
                <Flag size={22} />
              </span>
              <button
                aria-label={t("common.close")}
                className="rounded-full p-2 hover:bg-cream"
                onClick={close}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <h2
              className="mt-5 font-display text-2xl font-bold text-navy"
              id="report-message-title"
            >
              {t("messageReport.title")}
            </h2>
            <p className="mt-3 leading-7 text-slate">{t("messageReport.hint")}</p>
            <div className="mt-5 rounded-2xl border border-line bg-cream px-4 py-3">
              <p className="text-[11px] font-bold tracking-wide text-teal uppercase">
                {t("messageReport.messageLabel")}
              </p>
              <p className="mt-1 text-sm font-semibold text-navy">{message.senderName}</p>
              <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate">
                {message.text}
              </p>
            </div>
            <label className="mt-5 block">
              <span className="form-label">{t("safetyActions.reportReason")}</span>
              <Select
                onChange={(event) => setReason(event.target.value as ReportReason)}
                value={reason}
                variant="form"
              >
                {REPORT_REASONS.map((item) => (
                  <option key={item} value={item}>
                    {t(`safetyActions.reason.${item}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="mt-4 block">
              <span className="form-label">{t("safetyActions.reportDetails")}</span>
              <textarea
                className="form-input min-h-28"
                onChange={(event) => {
                  setDetails(event.target.value);
                  setError("");
                }}
                placeholder={t("safetyActions.reportDetailsPlaceholder")}
                value={details}
              />
            </label>
            {error ? (
              <p className="mt-2 text-sm font-semibold text-coral" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-7 grid gap-3">
              <button className="rounded-xl bg-coral px-5 py-3 font-bold text-white" type="submit">
                {t("messageReport.submit")}
              </button>
              <button
                className="rounded-xl px-5 py-3 font-bold text-slate"
                onClick={close}
                type="button"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
