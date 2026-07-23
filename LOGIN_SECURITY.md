# Login security checklist

Status legend: ✅ already good · ⚠️ needs action · ⬜ verify/decide

## 1. Secrets

- ✅ `.dev.vars*` and `.env*` are git-ignored, and `.dev.vars` is **not** tracked — no secrets in git history.
- ⚠️ **Rotate the Google client secret** — it was pasted in chat earlier, so treat it as compromised. Google Console → Credentials → reset secret → `wrangler secret put GOOGLE_CLIENT_SECRET` + update `.dev.vars`.
- ⬜ Confirm `BETTER_AUTH_SECRET` is a strong random value set as a Worker secret (not a placeholder), and different from dev.
- ⬜ Any other value ever shown in chat/logs (tokens, keys) → rotate.

## 2. Sessions & cookies

- ✅ Cookies are `httpOnly`, `secure` in prod, `sameSite: "lax"` (set in `auth.ts`).
- ✅ Sessions stored server-side in D1; sign-out invalidates them.
- ⬜ Confirm a sensible session lifetime + refresh (Better Auth default ~7 days; shorten if you want).
- ✅ HTTPS everywhere (Cloudflare Workers are TLS-only).

## 3. Passwords & brute force

- ✅ Passwords hashed by Better Auth (scrypt) — never stored plaintext.
- ✅ Min length 8 enforced client-side — also rely on server-side validation.
- ⚠️ **No rate limiting configured.** Add Better Auth `rateLimit` so sign-in / sign-up / reset endpoints throttle repeated attempts (brute-force + credential-stuffing defense).
- ⬜ Optional: block known-breached passwords / add a short lockout after N failures.

## 4. Account enumeration & error messages

- ⬜ Login errors must be **generic** ("invalid email or password") — never "no such user" vs "wrong password".
- ⬜ "Forgot password" must respond identically whether or not the email exists ("if that email exists, we sent a link").
- ⬜ Sign-up: avoid leaking that an email is already registered (or handle via linking).

## 5. Account linking & verification safety

- ⚠️ **Require email verification** before a password account is trusted — this is what prevents account-takeover via linking (someone registering your email with a password before you Google-login). Non-negotiable once linking is on.
- ⬜ Only auto-link when email is verified; trust Google (verified by Google).

## 6. OAuth / redirects / CSRF

- ✅ OAuth `state` (CSRF) handled by Better Auth; the missing-cookie issue was fixed earlier.
- ✅ `trustedOrigins` enforced — untrusted origins get 403 (this is why the old worker URL failed; that's correct behavior).
- ⬜ Redirect URIs in Google Console are an **exact allowlist** (no wildcards); `callbackURL` stays same-origin to prevent open redirects.
- ✅ Cross-site cookie protection via `sameSite: lax`.

## 7. Authorization (not just authentication)

- ✅ All write routes use `requireUser` + **server-side ownership checks** (vessels/sits/applications). ✅ Identity comes from the **session**, never from the request body — can't be spoofed.
- ⬜ Spot-check any newer routes (prefs, uploads, reviews) enforce the same ownership rules.

## 8. Uploads & abuse

- ✅ Image upload validates type + size and requires login.
- ⚠️ **CSAM / moderation control required before public image uploads** — approval-hold or Cloudflare CSAM Scanning. Don't open public uploads without it.

## 9. Logging & privacy

- ⚠️ `auth.ts` has `logger: { level: "debug" }` — **lower this in production** (e.g. `error`/`warn`) so verbose auth internals aren't logged. Gate it on `ENVIRONMENT`.
- ⬜ Never log passwords, tokens, or full session cookies. Check the email/gcal helpers don't log tokens.
- ⬜ ICO data-protection fee registered (Tier 1, ~£52/yr) once you handle real user data.

## 10. Platform & account hygiene

- ⬜ **2FA** on your Google account and your Cloudflare account (they hold the keys to everything).
- ⬜ Cloudflare API tokens scoped to least privilege (the `CLOUDFLARE_API_TOKEN` for CI = Workers/D1 only, not global).
- ⬜ Keep `better-auth` and deps updated.

---

## Immediate action items (this sprint)

1. **Rotate the Google client secret** (compromised).
2. **Lower the auth logger level in prod** (currently `debug`).
3. **Add rate limiting** to auth endpoints.
4. **Enforce email verification** before enabling account linking.
5. **Confirm `BETTER_AUTH_SECRET`** is strong + secret.
6. Decide `ALLOWED_EMAILS`: closed beta vs open sign-up.

I can implement 2, 3, and 4 in `auth.ts` in one pass; 1, 5, and 6 are Console/secret actions only you can do.
