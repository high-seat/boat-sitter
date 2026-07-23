import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import { Ellipsis, Flag, Languages, LoaderCircle, Phone, Send, Video, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getIntlLocale } from "@/i18n";
import { type ApplicationMessage, type SitApplication } from "@/mockApi";
import { REPORT_REASONS, useAppStore, type ReportReason } from "@/store";
import { translateWithGoogle } from "@/translationService";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconTooltip } from "@/components/ui/IconTooltip";
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
import { AvatarImage } from "@/components/ui/AvatarImage";
import { SpeechBubbleTail } from "@/components/ui/SpeechBubbleTail";

function isOptimisticMessageSynced(optimistic: ApplicationMessage, messages: ApplicationMessage[]) {
  return messages.some(
    (message) =>
      !message.pending &&
      message.senderName === optimistic.senderName &&
      message.text === optimistic.text &&
      message.createdAt >= optimistic.createdAt,
  );
}

function isUserChatMessage(message: ApplicationMessage) {
  return message.kind === "user";
}

/** Avatar only on the last bubble in a consecutive run from the same sender. */
function isLastInSenderStack(messages: ApplicationMessage[], index: number) {
  const message = messages[index];
  if (!message || !isUserChatMessage(message)) return false;
  const next = messages[index + 1];
  if (!next || !isUserChatMessage(next)) return true;
  return next.senderName !== message.senderName;
}

function isStackContinuation(messages: ApplicationMessage[], index: number) {
  const message = messages[index];
  if (!message || !isUserChatMessage(message) || index === 0) return false;
  const prev = messages[index - 1];
  return isUserChatMessage(prev) && prev.senderName === message.senderName;
}

function avatarSrcForSender(
  senderName: string,
  application: SitApplication,
  currentUser: string,
  currentUserImage: string | undefined,
) {
  if (senderName === currentUser && currentUserImage) return currentUserImage;
  if (senderName === application.applicant.name) return application.applicant.image;
  if (senderName === application.ownerName && application.ownerImage) {
    return application.ownerImage;
  }
  return "";
}

function messagesWithInitialApplication(application: SitApplication): ApplicationMessage[] {
  const trimmed = application.initialMessage.trim();
  if (!trimmed) return application.messages;
  const alreadyPresent = application.messages.some(
    (message) =>
      (message.kind ?? "user") === "user" &&
      message.senderName === application.applicant.name &&
      message.text === trimmed,
  );
  if (alreadyPresent) return application.messages;
  return [
    {
      id: `${application.id}-initial-message`,
      senderName: application.applicant.name,
      text: trimmed,
      createdAt: application.createdAt,
      kind: "user",
    },
    ...application.messages,
  ];
}

export function ConversationPanel({
  application,
  currentUser,
  onSend,
  onRequestVideoCall,
  onRespondToVideoCall,
  onSharePhone,
  pending,
  translationLanguage,
  composerFocusKey = 0,
}: {
  application: SitApplication;
  currentUser: string;
  onSend: (message: string) => void | Promise<unknown>;
  onRequestVideoCall: (proposal: VideoCallScheduleValues) => void;
  onRespondToVideoCall: (input: {
    action: "accept" | "decline" | "counter";
    messageId: string;
    proposal?: VideoCallScheduleValues;
  }) => void;
  onSharePhone: (phoneNumber: string) => void;
  pending: boolean;
  translationLanguage: string;
  /** Bump when the user opens/reopens this chat so the reply field takes focus. */
  composerFocusKey?: number;
}) {
  const { i18n, t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const [reply, setReply] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ApplicationMessage[]>([]);
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
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null);
  const lastMessageKey =
    optimisticMessages.at(-1)?.id ?? messagesWithInitialApplication(application).at(-1)?.id ?? "";

  useEffect(() => {
    setReply("");
    setOpenMenuId(null);
    setOptimisticMessages([]);
  }, [application.id]);
  useEffect(() => {
    // Defer past list-button focus so opening/switching a chat leaves the composer ready.
    const timer = window.setTimeout(() => {
      replyInputRef.current?.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [application.id, composerFocusKey]);
  useEffect(() => {
    setTranslations({});
    setTranslationPending({});
    setTranslationErrors({});
  }, [application.id, i18n.resolvedLanguage]);
  useEffect(() => {
    setOptimisticMessages((current) => {
      if (!current.length) return current;
      return current.filter(
        (optimistic) => !isOptimisticMessageSynced(optimistic, application.messages),
      );
    });
  }, [application.messages]);
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollToLatest = () => {
      container.scrollTop = container.scrollHeight;
    };

    scrollToLatest();
    const frame = requestAnimationFrame(scrollToLatest);
    const timeout = window.setTimeout(scrollToLatest, 0);
    const observer = new ResizeObserver(scrollToLatest);
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [application.id, lastMessageKey, typingUser]);
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
  const otherPartyName =
    currentUser === application.ownerName ? application.applicant.name : application.ownerName;
  const profilePhone = user?.phoneNumber.trim()
    ? `${user.phoneCountryCode} ${user.phoneNumber.trim()}`
    : "";
  const latestPendingProposal = getLatestPendingVideoCallProposal(application.messages);
  const visibleOptimistic = optimisticMessages.filter(
    (optimistic) => !isOptimisticMessageSynced(optimistic, application.messages),
  );
  const threadMessages = [...messagesWithInitialApplication(application), ...visibleOptimistic];
  const hasOptimisticSend = visibleOptimistic.some((message) => message.pending);

  async function submitReply() {
    const text = reply.trim();
    if (!text || pending || hasOptimisticSend) return;
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    const optimistic: ApplicationMessage = {
      id: optimisticId,
      senderName: currentUser,
      text,
      createdAt: new Date().toISOString(),
      kind: "user",
      pending: true,
    };
    setOptimisticMessages((current) => [...current, optimistic]);
    setReply("");
    publishTyping(false);
    try {
      await Promise.resolve(onSend(text));
    } catch {
      setOptimisticMessages((current) => current.filter((message) => message.id !== optimisticId));
      setReply(text);
    }
  }

  function handleReplyKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      const field = event.currentTarget;
      const start = field.selectionStart;
      const end = field.selectionEnd;
      const next = `${reply.slice(0, start)}\n${reply.slice(end)}`;
      updateReply(next);
      const cursor = start + 1;
      queueMicrotask(() => {
        field.setSelectionRange(cursor, cursor);
      });
      return;
    }
    if (event.shiftKey) return;
    event.preventDefault();
    void submitReply();
  }

  function formatVideoCallDetails(message: ApplicationMessage) {
    if (!message.videoCall) return null;
    return t("applications.videoCall.proposedDetails", {
      when: scheduleFormatter.format(new Date(message.videoCall.startsAt)),
      duration: t("applications.videoCall.durationMinutes", {
        count: message.videoCall.durationMinutes,
      }),
    });
  }

  const newlineShortcut =
    typeof navigator !== "undefined" &&
    (/Mac|iPhone|iPad|iPod/i.test(navigator.platform) || /Mac OS/i.test(navigator.userAgent))
      ? "⌘ Enter"
      : "Ctrl+Enter";

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
      <div
        className="max-h-96 overflow-y-auto p-5"
        data-testid="conversation-messages"
        ref={messagesContainerRef}
      >
        {threadMessages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate" data-testid="conversation-empty">
            {t("applications.noMessagesYet")}
          </p>
        ) : null}
        {threadMessages.map((message, index) => {
          const stackGap = isStackContinuation(threadMessages, index) ? "mt-1" : "mt-4";
          const rowOffset = index === 0 ? "mt-0" : stackGap;
          if (message.kind === "system") {
            if (message.systemKind === "phoneShared" && message.sharedPhone) {
              const mine = message.senderName === currentUser;
              return (
                <div
                  className={`flex ${rowOffset} ${mine ? "justify-end" : "justify-start"}`}
                  key={message.id}
                >
                  <div className="flex max-w-[85%] items-start gap-3 rounded-2xl border border-teal/25 bg-seafoam px-4 py-3 text-sm leading-6 text-navy">
                    <Phone aria-hidden="true" className="mt-0.5 shrink-0 text-teal" size={18} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-teal">
                        {mine ? t("messages.you") : message.senderName}
                      </p>
                      <p className="mt-1 font-bold text-navy">
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
                  <div className={`flex justify-center ${rowOffset}`} key={message.id}>
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
                <div className={`flex justify-center ${rowOffset}`} key={message.id}>
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
              let titleKey = "applications.systemMessage.videoCallDeclinedTitle";
              if (message.systemKind === "videoCallRequest") {
                titleKey = "applications.systemMessage.videoCallRequestTitle";
              } else if (message.systemKind === "videoCallCounter") {
                titleKey = "applications.systemMessage.videoCallCounterTitle";
              } else if (message.systemKind === "videoCallAccepted") {
                titleKey = "applications.systemMessage.videoCallAcceptedTitle";
              }
              const details = formatVideoCallDetails(message);
              const mine = message.senderName === currentUser;
              const canRespond =
                latestPendingProposal?.id === message.id &&
                !mine &&
                (message.systemKind === "videoCallRequest" ||
                  message.systemKind === "videoCallCounter");
              return (
                <div
                  className={`flex ${rowOffset} ${mine ? "justify-end" : "justify-start"}`}
                  key={message.id}
                >
                  <div className="flex max-w-[85%] items-start gap-3 rounded-2xl border border-teal/25 bg-seafoam px-4 py-3 text-sm leading-6 text-navy">
                    <Video aria-hidden="true" className="mt-0.5 shrink-0 text-teal" size={18} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-teal">
                        {mine ? t("messages.you") : message.senderName}
                      </p>
                      <p className="mt-1 font-bold text-navy">{t(titleKey)}</p>
                      <p className="mt-1 text-slate">
                        {formatApplicationSystemMessage(t, message, application, currentUser)}
                      </p>
                      {details ? <p className="mt-2 font-semibold text-navy">{details}</p> : null}
                      {message.videoCall?.meetUrl ? (
                        <a
                          className="mt-2 inline-flex items-center gap-2 rounded-full bg-navy px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal"
                          href={message.videoCall.meetUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Video aria-hidden="true" size={14} />
                          {t("applications.videoCall.joinMeet")}
                        </a>
                      ) : null}
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
              <div className={`flex justify-center ${rowOffset}`} key={message.id}>
                <p className="max-w-[90%] rounded-full bg-seafoam px-4 py-2 text-center text-xs font-semibold leading-5 text-teal">
                  {message.systemKind === "accepted" ||
                  message.systemKind === "declined" ||
                  message.systemKind === "unaccepted" ||
                  message.systemKind === "sitCancelled" ||
                  message.systemKind === "applicantsClosed"
                    ? formatApplicationSystemMessage(t, message, application, currentUser)
                    : message.text}
                </p>
              </div>
            );
          }

          const mine = message.senderName === currentUser;
          const showAvatar = isLastInSenderStack(threadMessages, index);
          const avatarSrc = avatarSrcForSender(
            message.senderName,
            application,
            currentUser,
            user?.image,
          );
          const avatar = showAvatar ? (
            <AvatarImage
              className="relative z-10 size-8 shrink-0 translate-y-2 rounded-full object-cover"
              name={message.senderName}
              src={avatarSrc}
              testId={mine ? "conversation-message-avatar-own" : "conversation-message-avatar-peer"}
            />
          ) : (
            <div
              aria-hidden="true"
              className="size-8 shrink-0"
              data-testid={
                mine
                  ? "conversation-message-avatar-own-spacer"
                  : "conversation-message-avatar-peer-spacer"
              }
            />
          );

          let bubbleClass =
            "relative max-w-[min(85%,calc(100%-2.5rem))] overflow-visible px-5 py-3.5";
          if (mine) {
            bubbleClass += " bg-navy text-white";
            bubbleClass += showAvatar
              ? " rounded-tl-[1.25rem] rounded-tr-[1.25rem] rounded-bl-[1.25rem] rounded-br-none"
              : " rounded-[1.25rem]";
          } else {
            bubbleClass += " bg-cream text-navy";
            bubbleClass += showAvatar
              ? " rounded-tl-[1.25rem] rounded-tr-[1.25rem] rounded-br-[1.25rem] rounded-bl-none"
              : " rounded-[1.25rem]";
          }

          return (
            <div
              className={`flex items-end gap-3 ${rowOffset} ${mine ? "justify-end" : "justify-start"}`}
              key={message.id}
            >
              {mine ? null : avatar}
              {message.pending ? (
                <LoaderCircle
                  aria-label={t("applications.sending")}
                  className="mb-3 shrink-0 animate-spin text-teal"
                  size={16}
                />
              ) : null}
              <div
                aria-busy={message.pending || undefined}
                className={bubbleClass}
                data-testid={mine ? "conversation-message-own" : "conversation-message-peer"}
              >
                {showAvatar ? (
                  <SpeechBubbleTail
                    side={mine ? "right" : "left"}
                    testId={
                      mine ? "conversation-message-tail-own" : "conversation-message-tail-peer"
                    }
                    tone={mine ? "navy" : "cream"}
                  />
                ) : null}
                <div className={`flex items-start justify-between gap-2 ${mine ? "" : "pr-1"}`}>
                  <p className={`text-xs font-bold ${mine ? "text-aqua" : "text-teal"}`}>
                    {mine ? t("messages.you") : message.senderName}
                  </p>
                  {!mine && (
                    <MessageActionsMenu
                      hasTranslation={Boolean(translations[message.id])}
                      isOpen={openMenuId === message.id}
                      onOpenChange={(open) => setOpenMenuId(open ? message.id : null)}
                      onReport={() => {
                        setOpenMenuId(null);
                        openMessageReport(message);
                      }}
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
              {mine ? avatar : null}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
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
      <div className="border-t border-line p-4" data-testid="conversation-composer">
        <div
          className={
            user
              ? "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2"
              : "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2"
          }
        >
          {user ? (
            <AvatarImage
              className="size-12 self-center rounded-full object-cover"
              name={user.name}
              src={user.image}
              testId="conversation-composer-avatar"
            />
          ) : null}
          <label className="min-w-0">
            <span className="sr-only">{t("applications.reply")}</span>
            <textarea
              ref={replyInputRef}
              className="form-input h-12 min-h-12 resize-y py-3 leading-5"
              data-testid="conversation-reply-input"
              onBlur={() => publishTyping(false)}
              onChange={(event) => updateReply(event.target.value)}
              onKeyDown={handleReplyKeyDown}
              placeholder={t("applications.replyPlaceholder")}
              rows={1}
              value={reply}
            />
          </label>
          <button
            aria-label={
              pending || hasOptimisticSend ? t("applications.sending") : t("applications.sendReply")
            }
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-coral px-3 text-sm font-bold text-white disabled:opacity-50 sm:px-5"
            data-testid="conversation-send-reply"
            disabled={pending || hasOptimisticSend || !reply.trim()}
            onClick={() => {
              void submitReply();
            }}
            type="button"
          >
            <Send size={16} />
            <span className="max-sm:sr-only">
              {pending || hasOptimisticSend
                ? t("applications.sending")
                : t("applications.sendReply")}
            </span>
          </button>
          <div className={user ? "col-start-2 col-end-4" : "col-span-full"}>
            <p className="text-xs text-slate">
              {t("applications.replyHint", { shortcut: newlineShortcut })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="flex items-center gap-2 rounded-xl border border-teal/40 bg-seafoam px-5 py-3 text-sm font-bold text-teal hover:border-teal disabled:opacity-50"
                data-testid="conversation-request-video-call"
                disabled={pending}
                onClick={() => setScheduleModal({ mode: "propose" })}
                type="button"
              >
                <Video size={16} />
                {t("applications.requestVideoCall")}
              </button>
              <IconTooltip
                hidden={Boolean(profilePhone)}
                label={t("applications.sharePhoneUnavailable")}
                side="top"
                wrap
              >
                <button
                  className="flex items-center gap-2 rounded-xl border border-teal/40 bg-seafoam px-5 py-3 text-sm font-bold text-teal hover:border-teal disabled:opacity-50"
                  data-testid="conversation-share-phone"
                  disabled={pending || !profilePhone}
                  onClick={() => setSharePhoneConfirmOpen(true)}
                  type="button"
                >
                  <Phone size={16} />
                  {t("applications.sharePhoneInChat")}
                </button>
              </IconTooltip>
            </div>
          </div>
        </div>
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
  onOpenChange,
  onReport,
  onTranslate,
  translatePending,
}: {
  hasTranslation: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: () => void;
  onTranslate: () => void;
  translatePending: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Popover.Root onOpenChange={onOpenChange} open={isOpen}>
      <Popover.Trigger asChild>
        <button
          aria-label={t("applications.messageActions")}
          className="-mr-1 -mt-0.5 rounded-full p-1 text-slate hover:bg-white/80 hover:text-navy"
          data-testid="conversation-message-actions"
          type="button"
        >
          <Ellipsis aria-hidden="true" size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          avoidCollisions
          className="z-80 min-w-52 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-float outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          collisionPadding={12}
          data-testid="conversation-message-actions-menu"
          role="menu"
          side="bottom"
          sideOffset={4}
        >
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-navy hover:bg-cream disabled:opacity-60"
            data-testid="conversation-message-translate"
            disabled={translatePending}
            onClick={onTranslate}
            role="menuitem"
            type="button"
          >
            <Languages aria-hidden="true" className="text-teal" size={15} />
            {(() => {
              if (translatePending) return t("applications.translating");
              if (hasTranslation) return t("applications.hideTranslation");
              return t("applications.translateWithGoogle");
            })()}
          </button>
          <button
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-navy hover:bg-cream"
            data-testid="conversation-message-report"
            onClick={onReport}
            role="menuitem"
            type="button"
          >
            <Flag aria-hidden="true" className="text-slate" size={15} />
            {t("messageReport.report")}
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
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
