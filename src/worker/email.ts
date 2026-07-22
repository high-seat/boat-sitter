/**
 * Transactional email via Resend (https://resend.com).
 *
 * Test mode (no verified domain yet):
 *   - Set RESEND_API_KEY and NOTIFY_EMAIL (your own address).
 *   - We send FROM Resend's shared sender `onboarding@resend.dev` and always
 *     deliver TO NOTIFY_EMAIL, so every notification lands in your inbox.
 *
 * Production (after you own a domain and verify it in Resend):
 *   - Set EMAIL_FROM to e.g. "Boatstead <hello@yourdomain.com>".
 *   - Remove NOTIFY_EMAIL (or leave it) and pass real recipient addresses.
 *
 * This never throws: a failed or unconfigured send is logged and swallowed so it
 * can't break the API request that triggered it.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const TEST_FROM = "Boatstead <onboarding@resend.dev>";

export interface NotificationEmail {
  /** Subject line. */
  subject: string;
  /** Big heading inside the email. */
  heading: string;
  /** One or two sentences of body copy. */
  body: string;
  /** Optional call-to-action link (path or absolute URL). */
  actionUrl?: string;
  actionLabel?: string;
  /**
   * Intended real recipient. In test mode we ignore this and send to
   * NOTIFY_EMAIL, but we surface it in the email body so you can tell who it
   * would have gone to.
   */
  to?: string;
}

function renderHtml(e: NotificationEmail, testTo?: string): string {
  const button = e.actionUrl
    ? `<p style="margin:24px 0"><a href="${e.actionUrl}" style="background:#0b5fff;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${e.actionLabel ?? "Open"}</a></p>`
    : "";
  const testBanner = testTo
    ? `<p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:12px">Test mode — intended recipient: ${e.to ?? "n/a"}. Delivered to ${testTo}.</p>`
    : "";
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7f9;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <h1 style="font-size:20px;margin:0 0 12px">${e.heading}</h1>
    <p style="font-size:15px;line-height:1.5;color:#333;margin:0">${e.body}</p>
    ${button}
    ${testBanner}
  </div></body></html>`;
}

export async function sendNotificationEmail(env: Env, email: NotificationEmail): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[email] RESEND_API_KEY not set — skipping:", email.subject);
    return;
  }

  // Test mode: everything goes to NOTIFY_EMAIL. Production: use configured
  // EMAIL_FROM and the real recipient.
  const testTo = env.NOTIFY_EMAIL;
  const to = testTo ?? email.to;
  const from = env.EMAIL_FROM ?? TEST_FROM;
  if (!to) {
    console.log("[email] no recipient (set NOTIFY_EMAIL) — skipping:", email.subject);
    return;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: email.subject,
        html: renderHtml(email, testTo),
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("[email] send failed", err);
  }
}
