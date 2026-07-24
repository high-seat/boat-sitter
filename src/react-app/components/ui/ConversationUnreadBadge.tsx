/** Inline coral count for unread chat messages in the conversation list. */
export function ConversationUnreadBadge({ count, testId }: { count: number; testId?: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-extrabold leading-none text-white"
      data-testid={testId}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
