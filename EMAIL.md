# Email notifications

Transactional emails are sent via [Resend](https://resend.com) from `src/worker/email.ts`.

Emails fire on four events:

- **New application** — someone applies to sit a boat (routes/applications.ts, POST `/`).
- **New message** — a new message in an application thread (POST `/:id/messages`).
- **Application accepted / declined** — owner changes status (PATCH `/:id`).
- **New support request** — a user submits the support form (routes/support.ts).

## Test mode (no domain yet)

You don't need a domain to try this. In test mode every email is sent **from**
Resend's shared sender `onboarding@resend.dev` and **to** whatever address is in
`NOTIFY_EMAIL`, so all notifications land in your own inbox.

1. Create a free Resend account at https://resend.com and make an API key.
2. Local: put it in `.dev.vars`:
   ```
   RESEND_API_KEY=re_xxxxxxxx
   NOTIFY_EMAIL=sharuk.cit.cbe@gmail.com
   ```
3. `pnpm dev`, then trigger an event (apply to a sit, send a message, submit
   support). The email arrives at `NOTIFY_EMAIL`, with a footer noting the
   intended real recipient.

If `RESEND_API_KEY` is blank the app runs normally and just skips sending
(logged to the console) — nothing breaks.

## Production (once you own + verify a domain)

1. In Resend, add your domain and create the DNS records it gives you
   (SPF + DKIM, and ideally DMARC). This is the only step that needs the domain.
2. Set a real sender and remove the test redirect:
   ```
   wrangler secret put RESEND_API_KEY
   # set EMAIL_FROM as a var, e.g. "Boatstead <hello@yourdomain.com>"
   # remove NOTIFY_EMAIL so mail goes to real recipients
   ```
   When `NOTIFY_EMAIL` is unset, emails go to the real recipient passed by each
   route (`to:`), and `EMAIL_FROM` is used as the sender.

Note: recipients are currently addressed by display name in the route calls
(`to: ownerName`) as a placeholder. Before going live to real users, swap these
to the recipient's real email address (look up the user's email by id) — the
email helper already accepts a proper address in `to`.
