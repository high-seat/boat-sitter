# Login & accounts — end-to-end plan

Two ways in, one account per person:

1. **Google (Gmail)** — OAuth via Better Auth (already working).
2. **Email + password** — sign up / sign in with an email address (already wired; this plan hardens it).

Decisions baked in: same email via Google or password = **one linked account**; include **email verification**, **password reset**, and **change password / email**.

Everything runs on the existing stack: Better Auth on the Cloudflare Worker, sessions + users in D1, emails via Resend.

---

## 1. Account & identity model

- One `user` row per person, keyed by a unique **email**.
- One or more `account` rows link to that user:
  - `providerId = "google"` — the Gmail login.
  - `providerId = "credential"` — the email+password login (stores the password hash).
- A single person can have **both** account rows pointing at one `user` (that's the linking).
- Sessions live in the `session` table (cookie-based); verification/reset tokens in `verification`. All these tables already exist.

## 2. Account linking (same email → one account)

- Enable Better Auth account linking, trusting Google:
  `account: { accountLinking: { enabled: true, trustedProviders: ["google"] } }`.
- **Security rule that makes this safe:** only auto-link when the email is _verified_. Otherwise someone could register `you@gmail.com` with a password before you ever Google-login, then capture your account. Mitigation:
  - Email+password sign-up **requires email verification** (below).
  - Google emails are verified by Google, so they're trusted.
- Flows:
  - Password account exists (verified) → later Google with same email → linked automatically.
  - Google account exists → user wants a password too → they use "forgot/set password" to add credentials.

## 3. Sign-up

- **Email+password:** `signUp.email(name, email, password)` → account created → **verification email sent** (via Resend) → user clicks link → verified.
- **Google:** first sign-in auto-creates the user (email pre-verified).
- If the email already exists on the other method → link instead of erroring.

## 4. Sign-in

- **Google:** `signIn.social({ provider: "google" })`.
- **Email+password:** `signIn.email(email, password)`. If the email isn't verified yet → block with a clear "check your inbox / resend verification" message (`requireEmailVerification: true`).
- On success, the session cookie is set and `hydrateSession()` populates the app store (already implemented).

## 5. Email verification

- Configure Better Auth `emailVerification`: send the link through Resend, auto-sign-in after verifying.
- `requireEmailVerification: true` for the email+password path (Google is exempt — already verified).
- UI: post-signup "verify your email" notice + a "resend email" action; a `/verify` landing that confirms and redirects.

## 6. Password reset ("forgot password")

- Better Auth `emailAndPassword.sendResetPassword` → Resend emails a reset link → `/reset-password` page → set new password → auto sign-in.
- UI: "Forgot password?" link on the login modal.
- Doubles as the "set a password" path for Google-only users who want credentials.

## 7. Change password / change email (signed-in, in Settings)

- **Change password:** requires current password; Better Auth `changePassword`.
- **Change email:** sets the new email as pending, sends a verification link to it; only switches once confirmed (`changeEmail` with verification). Prevents hijacking.

## 8. Security hardening

- Passwords: min length 8 (already enforced client-side; enforce server-side too).
- **Rate-limit** the auth endpoints (Better Auth `rateLimit`) to blunt brute force.
- Cookies: `httpOnly`, `secure` in prod, `sameSite: "lax"` (already set).
- **Generic errors** — never reveal whether an email exists ("invalid email or password", not "no such user").
- **Rotate the Google client secret** — it was exposed in chat earlier and is still live; reset it in Google Console and update `wrangler secret put GOOGLE_CLIENT_SECRET` + `.dev.vars`.
- Decide on `ALLOWED_EMAILS`: keep it set for a closed beta, or clear it to open public sign-up.

## 9. Email deliverability (dependency)

Verification and reset emails go through Resend. In test mode Resend only delivers to your own account address, so **these flows only reach real users once a sending domain is verified in Resend**. That means: pick the brand/domain, verify it in Resend, set `EMAIL_FROM`. Until then, verification/reset works only for your own test inbox.

## 10. Frontend UX

- **AuthModal:** Google button + email/password fields + "Forgot password?" link + inline verification notice.
- **New routes:** `/reset-password` (from email link), `/verify-email` (confirmation landing).
- **Settings:** change password, change email (with the pending-verification state).
- Clear, friendly error and pending states throughout.

---

## Build order

1. **auth.ts config:** enable account linking (trust Google), `requireEmailVerification`, and wire `sendVerificationEmail` + `sendResetPassword` to the Resend helper. Add `rateLimit`.
2. **Frontend:** "Forgot password?" + reset page, verification notice + resend, Settings change password/email.
3. **Resend domain:** verify a domain so verification/reset emails reach real users; set `EMAIL_FROM`.
4. **Security:** rotate Google secret; finalize `ALLOWED_EMAILS` (open vs closed).
5. **Test matrix** (below), then deploy (`pnpm deploy`).

## Test matrix (acceptance)

- Sign up with email → verification email → verify → logged in.
- Sign in with unverified email → blocked with resend option.
- Google sign-in (new) → account created, logged in.
- Password account, then Google with same email → **one** linked account (not two).
- Forgot password → email → reset → sign in with new password.
- Google-only user sets a password via reset → can now log in both ways.
- Change password (needs current), change email (needs new-email verification).
- Rate limiting kicks in on repeated bad logins.
- All of the above write a real session (`hasApiSession()` true) so DB writes work.

## Known dependencies / risks

- **Resend domain** required before verification/reset emails reach anyone but you.
- **Google secret rotation** still outstanding (treat current one as compromised).
- **Account-linking takeover** avoided _only_ if email verification is enforced — don't skip it.
