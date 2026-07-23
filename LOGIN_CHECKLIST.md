# Login checklist — Phase 1: Gmail (Google)

Work top to bottom. Test on the canonical URL only: **https://boatstead.sharukrules.workers.dev**
(Not the old `boat-sitter.…` worker — that URL 403s on auth.)

## A. Prerequisites (Google Cloud Console + Cloudflare)

- [ ] Google Console → **Credentials** → your OAuth client → **Authorized redirect URIs** includes exactly:
      `https://boatstead.sharukrules.workers.dev/api/auth/callback/google`
- [ ] Google Console → **Authorized JavaScript origins** includes:
      `https://boatstead.sharukrules.workers.dev`
- [ ] OAuth consent screen: your test account is under **Test users** (Testing mode is fine for now).
- [ ] Worker secrets set on **boatstead**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (= the canonical URL).
- [ ] **Rotate the Google client secret** (it leaked earlier) and update the secret — do this before going public.

## B. New-user sign-in

- [ ] Open the site logged out → click **Continue with Google**.
- [ ] Google consent screen appears → approve.
- [ ] Redirected back, and the header shows your name/avatar (logged in).
- [ ] A new row appears in `user` and in `account` (`provider_id = google`). *(I can verify in D1.)*

## C. Returning-user sign-in

- [ ] Sign out → sign in again with the same Google account.
- [ ] No duplicate `user` row is created (same account reused).
- [ ] Lands logged in without a second consent prompt (unless scopes changed).

## D. Session behaves

- [ ] After login, refresh the page → still logged in (session cookie persists).
- [ ] `GET /api/me` returns your user (not null). *(DevTools → Network, or I can confirm server-side.)*
- [ ] Open a new tab → still logged in.
- [ ] Sign out → header shows logged-out; `/api/me` returns `{ user: null }`; protected actions prompt login.

## E. Login actually powers the app (the real test)

- [ ] While logged in, create a boat + sit → it appears after refresh (written to D1, not localStorage).
- [ ] The new vessel row has your `owner_user_id` populated (not null). *(I can verify in D1.)*
- [ ] Apply to a sit / send a message → works and persists.

## F. Failure & edge handling

- [ ] Cancelling the Google consent screen returns you to the app, still logged out, no crash.
- [ ] Visiting the site on the wrong URL is a known 403 — always use the canonical URL.
- [ ] (If `ALLOWED_EMAILS` is set) a non-allowlisted Google email is rejected cleanly; decide whether to keep the allowlist or open sign-up.

## G. Known gotchas we already hit (don't retrigger)

- [ ] Use `pnpm deploy` (now build+deploy) — never bare `wrangler deploy` (ships stale build).
- [ ] If you changed OAuth scopes (e.g. added Calendar), you must **sign out & sign in again** to re-consent.
- [ ] DB migrations must be applied to prod (they are now) or `/api/me` and friends 500.

---

### How I verify the D1-backed items for you
Tell me when you've done a fresh Google sign-in and I'll query prod to confirm: a `user`/`account` row was created, an active `session` exists, and any boat you create has `owner_user_id` set.

### Next phases (after Gmail passes)
- Phase 2: Email + password (sign-up, sign-in, **email verification**).
- Phase 3: Password reset + change password/email.
- Phase 4: Account linking (same email → one account) + security hardening.
