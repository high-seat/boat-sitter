import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import { Ellipsis, Flag, Languages, LoaderCircle, Phone, Send, Video, X } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  getApplicationMessages,
  type ApiApplicationMessage,
  type ApplicationMessage,
  type SitApplication,
} from "@/mockApi";
import { REPORT_REASONS, useAppStore, type ReportReason } from "@/store";
import { useDateTimeFormatter } from "@/hooks/useTimeFormat";
import { translateWithGoogle } from "@/translationService";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { KeyboardKey } from "@/components/ui/KeyboardKey";
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
import { showToast } from "@/components/ui/Toast";
import { queries } from "@/queries";

function isAppleKeyboardPlatform() {
  if (typeof navigator === "undefined") return false;
  return (
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ||
    /Mac OS|Macintosh/i.test(navigator.userAgent)
  );
}

function isOptimisticMessageSynced(optimistic: ApplicationMessage, messages: ApplicationMessage[]) {
  // Do not require createdAt >= optimistic: worker/browser clocks can skew and
  // would leave pending optimistic rows forever, blocking further sends.
  return messages.some(
    (message) =>
      !message.pending &&
      message.senderName === optimistic.senderName &&
      message.text === optimistic.text,
  );
}

function isVideoCallSystemKind(systemKind: ApplicationMessage["systemKind"]) {
  return (
    systemKind === "videoCallRequest" ||
    systemKind === "videoCallCounter" ||
    systemKind === "videoCallAccepted" ||
    systemKind === "videoCallDeclined"
  );
}

/** User chat plus phone/video shares that render as sender-aligned bubbles. */
function isSenderBubbleMessage(message: ApplicationMessage) {
  if (message.kind === "user") return true;
  if (message.kind !== "system") return false;
  return message.systemKind === "phoneShared" || isVideoCallSystemKind(message.systemKind);
}

/** Avatar only on the last bubble in a consecutive run from the same sender. */
function isLastInSenderStack(messages: ApplicationMessage[], index: number) {
  const message = messages[index];
  if (!message || !isSenderBubbleMessage(message)) return false;
  const next = messages[index + 1];
  if (!next || !isSenderBubbleMessage(next)) return true;
  return next.senderName !== message.senderName;
}

function isStackContinuation(messages: ApplicationMessage[], index: number) {
  const message = messages[index];
  if (!message || !isSenderBubbleMessage(message) || index === 0) return false;
  const prev = messages[index - 1];
  return isSenderBubbleMessage(prev) && prev.senderName === message.senderName;
}

function senderBubbleClass(mine: boolean, showAvatar: boolean, tone: "navy" | "cream" | "seafoam") {
  let bubbleClass = "relative max-w-[min(85%,calc(100%-2.5rem))] overflow-visible px-5 py-3.5";
  if (tone === "seafoam") {
    bubbleClass += " bg-seafoam text-navy";
  } else if (mine) {
    bubbleClass += " bg-navy text-white";
  } else {
    bubbleClass += " bg-cream text-navy";
  }
  if (mine) {
    bubbleClass += showAvatar
      ? " rounded-tl-[1.25rem] rounded-tr-[1.25rem] rounded-bl-[1.25rem] rounded-br-none"
      : " rounded-[1.25rem]";
  } else {
    bubbleClass += showAvatar
      ? " rounded-tl-[1.25rem] rounded-tr-[1.25rem] rounded-br-[1.25rem] rounded-bl-none"
      : " rounded-[1.25rem]";
  }
  return bubbleClass;
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
  const initialSender =
    application.status === "invited" || application.invited
      ? application.ownerName
      : application.applicant.name;
  const alreadyPresent = application.messages.some(
    (message) =>
      (message.kind ?? "user") === "user" &&
      message.senderName === initialSender &&
      message.text === trimmed,
  );
  if (alreadyPresent) return application.messages;
  return [
    {
      id: `${application.id}-initial-message`,
      senderName: initialSender,
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
  const { formatDateTime } = useDateTimeFormatter();
  const { data: sits = [] } = useQuery(queries.sits.all);
  const sitForMessages = sits.find((sit) => sit.id === application.sitId);
  const systemMessageOptions = {
    language: i18n.language,
    sit: sitForMessages
      ? { dateStart: sitForMessages.dateStart, duration: sitForMessages.duration }
      : null,
  };
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

  const MESSAGES_PAGE_SIZE = 10;
  const [olderMessages, setOlderMessages] = useState<ApplicationMessage[]>([]);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const prevScrollHeightRef = useRef<number>(0);
  const prevPageMessagesRef = useRef<ApplicationMessage[]>(application.messages);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    setReply("");
    setOpenMenuId(null);
    setOptimisticMessages([]);
    setOlderMessages([]);
    setIsFetchingOlder(false);
    prevPageMessagesRef.current = application.messages;
    stickToBottomRef.current = true;
  }, [application.id]);

  useEffect(() => {
    // Count only server page + loaded older pages (not the synthetic initial
    // message), so hasMore stays accurate when the initial falls out of the window.
    const currentCount = application.messages.length + olderMessages.length;
    const totalCount = application.totalMessages ?? currentCount;
    setHasMoreOlder(totalCount > currentCount);
  }, [application.totalMessages, application.messages.length, olderMessages.length]);

  useEffect(() => {
    // When the live page window slides forward after a send, keep messages that
    // fell off the front so they do not vanish until the user scrolls to fetch.
    const prev = prevPageMessagesRef.current;
    const next = application.messages;
    // Do not clobber the previous page when a transient empty payload arrives.
    if (!next.length) return;
    prevPageMessagesRef.current = next;
    if (!prev.length) return;

    const nextIds = new Set(next.map((message) => message.id));
    const oldestNext = next[0]?.createdAt;
    const fallen = prev.filter((message) => {
      if (nextIds.has(message.id)) return false;
      if (!oldestNext) return true;
      return message.createdAt < oldestNext;
    });
    if (!fallen.length) return;

    setOlderMessages((current) => {
      const existing = new Set(current.map((message) => message.id));
      const toAdd = fallen.filter((message) => !existing.has(message.id));
      if (!toAdd.length) return current;
      return [...current, ...toAdd].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }, [application.messages]);

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
    // Only pin to bottom for new trailing messages — a permanent ResizeObserver
    // fights scroll-up pagination and makes the composer thrash/detach.
    if (!stickToBottomRef.current || isFetchingOlder || prevScrollHeightRef.current > 0) {
      return;
    }

    const scrollToLatest = () => {
      container.scrollTop = container.scrollHeight;
    };

    scrollToLatest();
    const frame = requestAnimationFrame(scrollToLatest);
    const timeout = window.setTimeout(scrollToLatest, 0);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [application.id, lastMessageKey, typingUser, isFetchingOlder]);
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

  const fetchOlderMessages = useCallback(async () => {
    if (isFetchingOlder || !hasMoreOlder) return;

    const oldestOlderMessage = olderMessages[0];
    const oldestApiMessage = application.messages[0];
    const oldestMessage = oldestOlderMessage ?? oldestApiMessage;
    if (!oldestMessage) return;

    stickToBottomRef.current = false;
    setIsFetchingOlder(true);
    prevScrollHeightRef.current = messagesContainerRef.current?.scrollHeight ?? 0;

    try {
      const result = await getApplicationMessages(application.id, {
        limit: MESSAGES_PAGE_SIZE,
        before: oldestMessage.id,
      });

      const apiToLocal = (m: ApiApplicationMessage): ApplicationMessage => ({
        id: m.id,
        senderName: m.senderName,
        text: m.text,
        createdAt: m.createdAt,
        kind: m.kind,
        systemKind: m.systemKind as ApplicationMessage["systemKind"],
        videoCall: m.videoCall,
        sharedPhone: m.sharedPhone,
      });

      const page = Array.isArray(result.data) ? result.data : [];
      const newMessages = page.map(apiToLocal);
      if (newMessages.length === 0) {
        setHasMoreOlder(false);
        return;
      }
      setOlderMessages((prev) => {
        const existing = new Set(prev.map((message) => message.id));
        const unique = newMessages.filter((message) => !existing.has(message.id));
        return [...unique, ...prev];
      });
      setHasMoreOlder(Boolean(result.hasMore));
    } catch (error) {
      console.error("Failed to fetch older messages:", error);
    } finally {
      setIsFetchingOlder(false);
    }
  }, [application.id, application.messages, olderMessages, isFetchingOlder, hasMoreOlder]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (prevScrollHeightRef.current > 0 && !isFetchingOlder) {
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
      if (scrollDiff > 0) {
        container.scrollTop += scrollDiff;
      }
      prevScrollHeightRef.current = 0;
    }
  }, [olderMessages, isFetchingOlder]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      stickToBottomRef.current = distanceFromBottom < 80;
      if (container.scrollTop < 100 && hasMoreOlder && !isFetchingOlder) {
        void fetchOlderMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fetchOlderMessages, hasMoreOlder, isFetchingOlder]);

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
  const currentMessages = messagesWithInitialApplication(application);
  const existingIds = new Set(currentMessages.map((m) => m.id));
  const dedupedOlder = olderMessages.filter((m) => !existingIds.has(m.id));
  const threadMessages = [...dedupedOlder, ...currentMessages, ...visibleOptimistic];
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
    stickToBottomRef.current = true;
    setOptimisticMessages((current) => [...current, optimistic]);
    setReply("");
    publishTyping(false);
    try {
      await Promise.resolve(onSend(text));
      // Clear pending immediately so further sends are not blocked if cache sync is slow.
      setOptimisticMessages((current) =>
        current.map((message) =>
          message.id === optimisticId ? { ...message, pending: false } : message,
        ),
      );
      // #region agent log
      fetch("http://127.0.0.1:7593/ingest/0c297f7c-4545-4b43-808d-4c39e61a6eaf", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c8feae" },
        body: JSON.stringify({
          sessionId: "c8feae",
          runId: "pre-fix",
          hypothesisId: "E",
          location: "ConversationPanel.tsx:submitReply:success",
          message: "client send ok",
          data: {
            applicationId: application.id,
            currentUser,
            ownerName: application.ownerName,
            isOwner: currentUser === application.ownerName,
            textLength: text.length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch("http://127.0.0.1:7593/ingest/0c297f7c-4545-4b43-808d-4c39e61a6eaf", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c8feae" },
        body: JSON.stringify({
          sessionId: "c8feae",
          runId: "pre-fix",
          hypothesisId: "E",
          location: "ConversationPanel.tsx:submitReply:catch",
          message: "client send failed",
          data: {
            applicationId: application.id,
            currentUser,
            ownerName: application.ownerName,
            isOwner: currentUser === application.ownerName,
            errorName: error instanceof Error ? error.name : "unknown",
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStatus:
              error && typeof error === "object" && "status" in error
                ? (error as { status: unknown }).status
                : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setOptimisticMessages((current) => current.filter((message) => message.id !== optimisticId));
      setReply(text);
      showToast(t("messages.sendFailed"), "error");
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
      when: formatDateTime(message.videoCall.startsAt, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      duration: t("applications.videoCall.durationMinutes", {
        count: message.videoCall.durationMinutes,
      }),
    });
  }

  function formatMessageTimestamp(createdAt: string) {
    return formatDateTime(createdAt, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const modifierKeyLabel = isAppleKeyboardPlatform() ? "⌘" : "Ctrl";

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
        {isFetchingOlder && (
          <div
            className="flex items-center justify-center gap-2 py-4 text-sm font-semibold text-teal"
            data-testid="conversation-fetching-older"
          >
            <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
            {t("applications.fetchingOlderMessages")}
          </div>
        )}
        {threadMessages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate" data-testid="conversation-empty">
            {t("applications.noMessagesYet")}
          </p>
        ) : null}
        {threadMessages.map((message, index) => {
          const stackGap = isStackContinuation(threadMessages, index) ? "mt-1" : "mt-4";
          const rowOffset = index === 0 ? "mt-0" : stackGap;
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

          if (message.kind === "system") {
            if (message.systemKind === "phoneShared" && message.sharedPhone) {
              return (
                <div
                  className={`flex items-end gap-3 ${rowOffset} ${mine ? "justify-end" : "justify-start"}`}
                  data-testid="conversation-message-phone-shared"
                  key={message.id}
                >
                  {mine ? null : avatar}
                  <div
                    className={senderBubbleClass(mine, showAvatar, "seafoam")}
                    data-testid={mine ? "conversation-message-own" : "conversation-message-peer"}
                  >
                    {showAvatar ? (
                      <SpeechBubbleTail
                        side={mine ? "right" : "left"}
                        testId={
                          mine ? "conversation-message-tail-own" : "conversation-message-tail-peer"
                        }
                        tone="seafoam"
                      />
                    ) : null}
                    <p className="text-xs font-bold text-teal">
                      {mine ? t("messages.you") : message.senderName}
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-bold text-navy">
                      <Phone aria-hidden="true" className="shrink-0 text-teal" size={16} />
                      {t("applications.systemMessage.phoneSharedTitle")}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate">
                      {formatApplicationSystemMessage(
                        t,
                        message,
                        application,
                        currentUser,
                        systemMessageOptions,
                      )}
                    </p>
                    <a
                      className="mt-2 inline-block font-bold text-navy hover:text-teal"
                      href={`tel:${message.sharedPhone.replaceAll(/[^\d+]/g, "")}`}
                    >
                      {message.sharedPhone}
                    </a>
                    <p className="mt-2 text-[11px] text-slate">
                      {formatMessageTimestamp(message.createdAt)}
                    </p>
                  </div>
                  {mine ? avatar : null}
                </div>
              );
            }
            if (message.systemKind === "withdrawn") {
              const body = formatApplicationSystemMessage(
                t,
                message,
                application,
                currentUser,
                systemMessageOptions,
              );
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
                        {formatMessageTimestamp(message.createdAt)}
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
            if (isVideoCallSystemKind(message.systemKind)) {
              let titleKey = "applications.systemMessage.videoCallDeclinedTitle";
              if (message.systemKind === "videoCallRequest") {
                titleKey = "applications.systemMessage.videoCallRequestTitle";
              } else if (message.systemKind === "videoCallCounter") {
                titleKey = "applications.systemMessage.videoCallCounterTitle";
              } else if (message.systemKind === "videoCallAccepted") {
                titleKey = "applications.systemMessage.videoCallAcceptedTitle";
              }
              const details = formatVideoCallDetails(message);
              const canRespond =
                latestPendingProposal?.id === message.id &&
                !mine &&
                (message.systemKind === "videoCallRequest" ||
                  message.systemKind === "videoCallCounter");
              return (
                <div
                  className={`flex items-end gap-3 ${rowOffset} ${mine ? "justify-end" : "justify-start"}`}
                  data-testid="conversation-message-video-call"
                  key={message.id}
                >
                  {mine ? null : avatar}
                  <div
                    className={senderBubbleClass(mine, showAvatar, "seafoam")}
                    data-testid={mine ? "conversation-message-own" : "conversation-message-peer"}
                  >
                    {showAvatar ? (
                      <SpeechBubbleTail
                        side={mine ? "right" : "left"}
                        testId={
                          mine ? "conversation-message-tail-own" : "conversation-message-tail-peer"
                        }
                        tone="seafoam"
                      />
                    ) : null}
                    <p className="text-xs font-bold text-teal">
                      {mine ? t("messages.you") : message.senderName}
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-bold text-navy">
                      <Video aria-hidden="true" className="shrink-0 text-teal" size={16} />
                      {t(titleKey)}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate">
                      {formatApplicationSystemMessage(
                        t,
                        message,
                        application,
                        currentUser,
                        systemMessageOptions,
                      )}
                    </p>
                    {details ? (
                      <p
                        className="mt-2 text-sm font-semibold text-navy"
                        data-testid="conversation-video-call-when"
                      >
                        {details}
                      </p>
                    ) : null}
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
                    <p className="mt-2 text-[11px] text-slate">
                      {formatMessageTimestamp(message.createdAt)}
                    </p>
                  </div>
                  {mine ? avatar : null}
                </div>
              );
            }
            return (
              <div className={`flex justify-center ${rowOffset}`} key={message.id}>
                <p
                  className="max-w-[90%] rounded-full bg-seafoam px-4 py-2 text-center text-xs font-semibold leading-5 text-teal"
                  data-testid="conversation-system-message"
                >
                  {message.systemKind === "accepted" ||
                  message.systemKind === "declined" ||
                  message.systemKind === "unaccepted" ||
                  message.systemKind === "sitCancelled" ||
                  message.systemKind === "sitEndedEarly" ||
                  message.systemKind === "applicantsClosed" ||
                  message.systemKind === "inviteAccepted" ||
                  message.systemKind === "inviteDeclined"
                    ? formatApplicationSystemMessage(
                        t,
                        message,
                        application,
                        currentUser,
                        systemMessageOptions,
                      )
                    : message.text}
                </p>
              </div>
            );
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
                className={senderBubbleClass(mine, showAvatar, mine ? "navy" : "cream")}
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
                  {formatMessageTimestamp(message.createdAt)}
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
            <p className="hidden text-xs text-slate sm:block" data-testid="conversation-reply-hint">
              <Trans
                components={{
                  modKey: <KeyboardKey>{modifierKeyLabel}</KeyboardKey>,
                  sendKey: <KeyboardKey />,
                }}
                i18nKey="applications.replyHint"
              />
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
  const user = useAppStore((state) => state.user);
  const reportUser = useAppStore((state) => state.reportUser);
  const blockUser = useAppStore((state) => state.blockUser);
  const isBlocked = useAppStore((state) =>
    state.blockedUsers.some((blocked) => blocked.name === message.senderName),
  );
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const senderImage = avatarSrcForSender(
    message.senderName,
    application,
    user?.name ?? "",
    user?.image,
  );

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
    if (alsoBlock && !isBlocked) {
      blockUser({
        name: message.senderName,
        image:
          senderImage ||
          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(message.senderName)}`,
      });
    }
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
            {!isBlocked ? (
              <label
                className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-cream p-4 text-sm leading-6 text-navy"
                data-testid="report-also-block"
              >
                <input
                  checked={alsoBlock}
                  className="mt-1 size-4 accent-teal"
                  onChange={(event) => setAlsoBlock(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="block font-bold">
                    {t("safetyActions.reportAlsoBlock", { name: message.senderName })}
                  </span>
                  <span className="mt-1 block text-slate">{t("safetyActions.blockText")}</span>
                </span>
              </label>
            ) : null}
            <div className="mt-7 grid gap-3">
              <button
                className="rounded-xl bg-coral px-5 py-3 font-bold text-white"
                data-testid="report-submit"
                type="submit"
              >
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
