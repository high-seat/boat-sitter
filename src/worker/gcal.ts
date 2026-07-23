import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { account } from "./db/auth-schema";

/**
 * Google Calendar / Meet integration.
 *
 * `createMeetLink` creates a Calendar event with a Google Meet conference on the
 * given user's primary calendar and returns the Meet URL. It requires that the
 * user signed in with Google AND granted the calendar.events scope (see auth.ts).
 *
 * It NEVER throws: if the user has no Google account, no calendar grant, an
 * expired/unrefreshable token, or the API errors, it returns null so the caller
 * can simply schedule the call without a Meet link.
 */

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const EVENTS_ENDPOINT =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all";

/** Return a valid Google access token for the user, refreshing if needed. */
async function googleAccessToken(env: Env, userId: string): Promise<string | null> {
  const db = getDb(env);
  const acct = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "google")),
  });
  if (!acct?.accessToken) return null;

  const stillValid =
    acct.accessTokenExpiresAt && acct.accessTokenExpiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return acct.accessToken;

  // Expired — refresh if we have a refresh token (needs offline access).
  if (!acct.refreshToken) return null;
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: acct.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;

  await db
    .update(account)
    .set({
      accessToken: json.access_token,
      accessTokenExpiresAt: new Date(Date.now() + (json.expires_in ?? 3600) * 1000),
      updatedAt: new Date(),
    })
    .where(eq(account.id, acct.id));
  return json.access_token;
}

export async function createMeetLink(
  env: Env,
  userId: string,
  opts: {
    summary: string;
    startsAt: string;
    durationMinutes: number;
    attendeeEmail?: string;
  },
): Promise<string | null> {
  try {
    const token = await googleAccessToken(env, userId);
    if (!token) return null;

    const start = new Date(opts.startsAt);
    const end = new Date(start.getTime() + opts.durationMinutes * 60_000);
    const requestBody = {
      summary: opts.summary,
      start: { dateTime: start.toISOString(), timeZone: "UTC" },
      end: { dateTime: end.toISOString(), timeZone: "UTC" },
      ...(opts.attendeeEmail ? { attendees: [{ email: opts.attendeeEmail }] } : {}),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const res = await fetch(EVENTS_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) {
      console.error("[gcal] event insert failed", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      hangoutLink?: string;
      conferenceData?: { entryPoints?: Array<{ uri?: string }> };
    };
    return json.hangoutLink ?? json.conferenceData?.entryPoints?.[0]?.uri ?? null;
  } catch (err) {
    console.error("[gcal] createMeetLink error", err);
    return null;
  }
}
