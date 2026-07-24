# Boatstead — Test Plan

Manual QA for both environments, plus a note on which cases we'll automate.
Run each case on **staging first**, then **prod**. Tick the box and add notes.

| Environment | URL                                               |
| ----------- | ------------------------------------------------- |
| Staging     | https://boatstead-staging.sharukrules.workers.dev |
| Production  | https://boatstead.sharukrules.workers.dev         |

## Core functionality (the deploy gate)

"Core" = what must work or the product is unusable and the deploy is bad. Kept
deliberately small so the automated gate stays fast and meaningful:

1. **App loads** — Worker up, assets served, SPA renders.
2. **Auth works** — a user can sign in and get a real session (Better Auth + D1 users/sessions + cookie).
3. **Listings load** — boats/sits read path from D1.

The **automated canary** (one test) is **#2, login**, because a single sign-in
exercises almost the entire critical stack. It runs against the **deployed** URL
after every deploy via `tests/smoke/core.smoke.spec.ts` (`pnpm test:smoke`). If
it fails, the deploy is treated as broken. We expand the core set (add #3, then
key flows) only as needed — everything else stays in the manual matrix below.

---

**Legend:** ☐ not run · ✅ pass · ❌ fail (add note) · ⏭️ skipped
**Auto?** = candidate for an automated test (Playwright e2e unless noted).

> Notes on environments:
>
> - Staging has `REQUIRE_EMAIL_VERIFICATION=false` and the `/api/dev/*` routes enabled (reset/seed). Prod has verification **on** and dev routes disabled.
> - Emails only reach `NOTIFY_EMAIL` until a Resend sending domain is verified — so on both envs, "email arrived" checks land in that one inbox for now.
> - Seed users (Alex Morgan, Tom Harper, etc.) are **data only** — you can't log in as them. Log in as yourself.

---

## 1. Authentication / Login

| #    | Case                              | Steps                                                  | Expected                                                             | Staging | Prod |  Auto?   |
| ---- | --------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------- | :-----: | :--: | :------: |
| 1.1  | Google sign-in (new)              | Click "Continue with Google" → approve                 | Redirected back, header shows your name/avatar                       |    ☐    |  ☐   | manual¹  |
| 1.2  | Google sign-in (returning)        | Sign out, sign in again                                | Same account reused, no duplicate                                    |    ☐    |  ☐   |  hard¹   |
| 1.3  | Email + password sign-up          | Sign up with a fresh email                             | Account created; verification email sent (to NOTIFY_EMAIL)           |    ☐    |  ☐   |    ✅    |
| 1.4  | Email verification                | Click the link in the email                            | Lands on app with "email verified" banner, logged in                 |    ☐    |  ☐   |  hard¹   |
| 1.5  | Unverified sign-in blocked (prod) | Sign up, then try to sign in before verifying          | Blocked with "check your inbox / resend" (prod only; staging allows) |    ☐    |  ☐   |    ✅    |
| 1.6  | Email + password sign-in          | Sign in with verified credentials                      | Logged in, session persists on refresh                               |    ☐    |  ☐   | ✅ CORE³ |
| 1.7  | Forgot password                   | "Forgot password?" → email → reset link → new password | Can sign in with the new password                                    |    ☐    |  ☐   |    ✅    |
| 1.8  | Google + password linking         | Sign up with email X, later Google with same email X   | One linked account, not a duplicate                                  |    ☐    |  ☐   |    ✅    |
| 1.9  | Sign out                          | Click sign out                                         | Logged out; protected pages prompt login; `/api/me` → null           |    ☐    |  ☐   |    ✅    |
| 1.10 | Session persists                  | Refresh + open new tab while logged in                 | Still logged in                                                      |    ☐    |  ☐   |    ✅    |

¹ _Google OAuth + email-link flows are hard to fully automate (external provider / inbox); cover with a seeded-session helper + manual spot-check._
³ _This is the **CORE canary**: `tests/core/core.spec.ts` (`pnpm test:core`) signs in with email+password against the **deployed** URL and asserts `/api/me` returns the user. It runs in the pipeline **after each deploy** (staging + prod). Real Google login (1.1/1.2) can't be reliably automated, so email+password is our automated proxy for "auth works"._

---

## 2. Account management (Settings → Security)

| #   | Case                       | Steps                                          | Expected                                                                          | Staging | Prod | Auto? |
| --- | -------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- | :-----: | :--: | :---: |
| 2.1 | Change password            | Settings → Change password, current + new      | Success; can sign in with new password; wrong current is rejected                 |    ☐    |  ☐   |  ✅   |
| 2.2 | Change email               | Settings → Change email → new address          | Confirmation link sent to **current** inbox; email switches only after clicking   |    ☐    |  ☐   |  ✅   |
| 2.3 | Google-only "set password" | On a Google-only account, open Change password | Offers "email me a set-password link" (no current-password prompt)                |    ☐    |  ☐   |  ✅   |
| 2.4 | Delete account             | Settings → danger zone → confirm               | Account + owned boats/sits/applications/**availability**/reviews gone; signed out |    ☐    |  ☐   |  ✅   |
| 2.5 | Rate limiting (prod)       | Hammer sign-in with bad passwords              | Gets throttled after repeated attempts                                            |    ☐    |  ☐   | med²  |

² _Automatable but flaky in CI; verify manually or with a dedicated load test._

---

## 3. Browse boats & sits

| #   | Case                     | Steps                                   | Expected                                       | Staging | Prod | Auto? |
| --- | ------------------------ | --------------------------------------- | ---------------------------------------------- | :-----: | :--: | :---: |
| 3.1 | Boats list loads         | Open `/boats`                           | 20 seed boats render, paginated, no 500        |    ☐    |  ☐   |  ✅   |
| 3.2 | Search / filters         | Filter by country, dates, sit type, pet | Results narrow correctly                       |    ☐    |  ☐   |  ✅   |
| 3.3 | Boat detail              | Open a boat                             | Gallery, systems, map pin, owner, reviews show |    ☐    |  ☐   |  ✅   |
| 3.4 | Destination autocomplete | Type a city in search                   | Suggestions appear (world_places seeded)       |    ☐    |  ☐   |  ✅   |
| 3.5 | Member profile           | Open an owner/sitter profile            | Bio, languages, reviews, rating render         |    ☐    |  ☐   |  ✅   |

---

## 4. Owner: boats & sits

| #   | Case              | Steps                             | Expected                                                                | Staging | Prod | Auto? |
| --- | ----------------- | --------------------------------- | ----------------------------------------------------------------------- | :-----: | :--: | :---: |
| 4.1 | Create a boat     | New boat → fill form → save       | Appears under "My boats" after refresh (persisted, `owner_user_id` set) |    ☐    |  ☐   |  ✅   |
| 4.2 | Image upload      | Add a boat photo                  | Uploads to R2, shows via `/api/files/...`                               |    ☐    |  ☐   |  med  |
| 4.3 | Create a sit      | New sit on a boat, dates + region | Appears; publicly browsable                                             |    ☐    |  ☐   |  ✅   |
| 4.4 | Edit / unpublish  | Edit sit, toggle published        | Changes reflected                                                       |    ☐    |  ☐   |  ✅   |
| 4.5 | Delete sit / boat | Delete                            | Removed; dependent guard works                                          |    ☐    |  ☐   |  ✅   |

---

## 5. Sitter availability + matching

| #   | Case                 | Steps                                            | Expected                                                             | Staging | Prod | Auto? |
| --- | -------------------- | ------------------------------------------------ | -------------------------------------------------------------------- | :-----: | :--: | :---: |
| 5.1 | Publish availability | `/availability` → date range + regions → publish | Window shows as **Open**                                             |    ☐    |  ☐   |  ✅   |
| 5.2 | Show matching sits   | On an open window, "Show matching sits"          | Lists open sits overlapping dates + region                           |    ☐    |  ☐   |  ✅   |
| 5.3 | Owner match alert    | Create a new sit that overlaps an open window    | Owner gets "N sitters available"; matching sitters get per-sit alert |    ☐    |  ☐   |  ✅   |
| 5.4 | Sitter match alert   | Publish a window overlapping existing sits       | Sitter gets "N sits match your availability"                         |    ☐    |  ☐   |  ✅   |
| 5.5 | Withdraw window      | Withdraw an open window                          | Marked Withdrawn; drops out of matching                              |    ☐    |  ☐   |  ✅   |

---

## 6. Applications & messaging

| #   | Case                   | Steps                                      | Expected                                              | Staging | Prod | Auto? |
| --- | ---------------------- | ------------------------------------------ | ----------------------------------------------------- | :-----: | :--: | :---: |
| 6.1 | Apply to a sit         | As a sitter, apply                         | Owner sees the application; owner gets alert          |    ☐    |  ☐   |  ✅   |
| 6.2 | Messaging              | Exchange messages in a conversation        | Delivered near-real-time (polling); recipient alerted |    ☐    |  ☐   |  ✅   |
| 6.3 | Accept / decline       | Owner accepts or declines                  | Sitter notified; statuses update                      |    ☐    |  ☐   |  ✅   |
| 6.4 | Video call + Meet link | Request a video call (Google-linked owner) | Google Meet link attached                             |    ☐    |  ☐   | hard¹ |
| 6.5 | Withdraw / cancel      | Sitter withdraws / owner cancels           | Correct state + notification                          |    ☐    |  ☐   |  ✅   |

---

## 7. Notifications & preferences

| #   | Case                 | Steps                                               | Expected                                       | Staging | Prod | Auto? |
| --- | -------------------- | --------------------------------------------------- | ---------------------------------------------- | :-----: | :--: | :---: |
| 7.1 | Bell notifications   | Trigger events above                                | Bell shows unread; links work; mark-read works |    ☐    |  ☐   |  ✅   |
| 7.2 | Email prefs enforced | Settings → uncheck "New applications" → trigger one | No email sent for that type; others still send |    ☐    |  ☐   |  ✅   |
| 7.3 | Sit defaults         | Set non-smoker default → new sit                    | Pre-filled                                     |    ☐    |  ☐   |  ✅   |
| 7.4 | Application defaults | Set default party size → apply                      | Pre-filled                                     |    ☐    |  ☐   |  ✅   |

---

## 8. Reviews

| #   | Case            | Steps                                | Expected                         | Staging | Prod | Auto? |
| --- | --------------- | ------------------------------------ | -------------------------------- | :-----: | :--: | :---: |
| 8.1 | Reviews display | Open a member/boat with seed reviews | Ratings + text render            |    ☐    |  ☐   |  ✅   |
| 8.2 | Leave a review  | After a completed sit, within window | Review saved, appears on profile |    ☐    |  ☐   |  ✅   |

---

## 9. Cross-cutting / infra

| #   | Case               | Steps                  | Expected                                                       | Staging | Prod | Auto?  |
| --- | ------------------ | ---------------------- | -------------------------------------------------------------- | :-----: | :--: | :----: |
| 9.1 | Cookie consent     | First visit            | Banner shows; Accept → analytics on; Decline → off; remembered |    ☐    |  ☐   |   ✅   |
| 9.2 | GA collects (prod) | Accept consent, browse | `/collect` fires; GA Realtime shows the visit (prod only)      |    ☐    | n/a  | manual |
| 9.3 | Health check       | `GET /api/health`      | `{"status":"ok"}`                                              |    ☐    |  ☐   |   ✅   |
| 9.4 | i18n               | Switch language        | UI + notifications localize                                    |    ☐    |  ☐   |  med   |
| 9.5 | Maps               | Boat detail map        | Pin renders at correct city                                    |    ☐    |  ☐   |  med   |

---

## Automation plan (next)

Once the manual pass is green, prioritise these as **Playwright e2e** (seeded session via `/api/dev/login` on staging):

1. **Auth core** — 1.3, 1.5, 1.6, 1.7, 1.9, 1.10 and account 2.1–2.4 (extends the existing `account-credentials.spec.ts`).
2. **Availability + matching** — 5.1, 5.2, 5.5 and the reverse-match endpoint (API-level tests are cheap here).
3. **Applications lifecycle** — 6.1, 6.3, 6.5 + notification rows created.
4. **Preference gating** — 7.2 (assert no email queued when toggle off) as an API/unit test.
5. **Browse/search** — 3.1–3.3 smoke.

Keep the Google OAuth, email-link, and Meet-link cases (1.1, 1.2, 1.4, 6.4, 9.2) as **manual** spot-checks — external dependencies make them brittle to automate.

CI wiring: run the e2e suite in the pipeline's `check` job (against a preview or the staging deploy) so regressions block promotion.
