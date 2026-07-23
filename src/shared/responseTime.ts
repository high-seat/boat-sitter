/**
 * Typical chat response time from application message timestamps.
 * Used for owner "usually responds within…" copy on sit detail.
 */

export type ResponseTimeBucket =
  | "withinHour"
  | "withinTwoHours"
  | "withinHalfDay"
  | "withinDay"
  | "withinTwoDays"
  | "withinFewDays";

export type ChatMessageForResponseTime = {
  applicationId: string;
  senderName: string;
  kind?: string | null;
  createdAt: string;
};

/** Ignore abandoned threads that never got a timely reply. */
const MAX_GAP_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SAMPLES = 50;
const MIN_SAMPLES = 1;

const HOUR_MS = 60 * 60 * 1000;

export const RESPONSE_TIME_I18N_KEY: Record<ResponseTimeBucket, string> = {
  withinHour: "detail.respondsWithinHour",
  withinTwoHours: "detail.respondsWithinTwoHours",
  withinHalfDay: "detail.respondsWithinHalfDay",
  withinDay: "detail.respondsWithinDay",
  withinTwoDays: "detail.respondsWithinTwoDays",
  withinFewDays: "detail.respondsWithinFewDays",
};

export function parseMessageTime(value: string): number {
  const direct = Date.parse(value);
  if (Number.isFinite(direct)) return direct;
  // SQLite CURRENT_TIMESTAMP: "YYYY-MM-DD HH:MM:SS"
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * For each conversation, measure time from the other party's message to the
 * responder's next reply (first message of that reply turn).
 */
export function collectResponseLatenciesMs(
  responderName: string,
  messages: ChatMessageForResponseTime[],
): { ms: number; repliedAt: number }[] {
  const byApp = new Map<string, ChatMessageForResponseTime[]>();
  for (const msg of messages) {
    if (msg.kind && msg.kind !== "user") continue;
    const list = byApp.get(msg.applicationId) ?? [];
    list.push(msg);
    byApp.set(msg.applicationId, list);
  }

  const samples: { ms: number; repliedAt: number }[] = [];
  for (const thread of byApp.values()) {
    thread.sort((a, b) => parseMessageTime(a.createdAt) - parseMessageTime(b.createdAt));
    let awaitingSince: number | null = null;
    for (const msg of thread) {
      const t = parseMessageTime(msg.createdAt);
      if (!Number.isFinite(t)) continue;
      const isResponder = msg.senderName === responderName;
      if (!isResponder) {
        if (awaitingSince === null) awaitingSince = t;
        continue;
      }
      if (awaitingSince !== null) {
        const gap = t - awaitingSince;
        if (gap >= 0 && gap <= MAX_GAP_MS) {
          samples.push({ ms: gap, repliedAt: t });
        }
        awaitingSince = null;
      }
    }
  }
  return samples;
}

export function averageMs(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function bucketResponseTimeMs(avgMs: number): ResponseTimeBucket {
  const hours = avgMs / HOUR_MS;
  if (hours < 1) return "withinHour";
  if (hours < 2) return "withinTwoHours";
  if (hours < 12) return "withinHalfDay";
  if (hours < 24) return "withinDay";
  if (hours < 48) return "withinTwoDays";
  return "withinFewDays";
}

export function summarizeResponseTime(
  responderName: string,
  messages: ChatMessageForResponseTime[],
): ResponseTimeBucket | null {
  const samples = collectResponseLatenciesMs(responderName, messages)
    .sort((a, b) => a.repliedAt - b.repliedAt)
    .slice(-MAX_SAMPLES)
    .map((sample) => sample.ms);
  if (samples.length < MIN_SAMPLES) return null;
  const avg = averageMs(samples);
  if (avg === null) return null;
  return bucketResponseTimeMs(avg);
}
