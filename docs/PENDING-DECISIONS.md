# Pending decisions — on hold

Items the product owner asked to **hold** (3 Oct 2026). The code is built so each can be switched on
without reworking the sign-up flow. Update this file as each one is decided.

## 1. WhatsApp sending service — ON HOLD

Sign-up sends a 6-digit code to the parent's mobile on WhatsApp, from "Kidzly".

- Options: **Meta WhatsApp Cloud API** (direct, cheapest) or **Twilio WhatsApp** (simpler setup, higher cost per message).
- Needs, whichever is chosen: a WhatsApp Business account, a phone number for Kidzly, and an approved
  **authentication template**, e.g. *"{{1}} is your Kidzly verification code. It expires in 10 minutes."*
- Where it plugs in: implement `IOtpSender` for `OtpChannel.WhatsApp`
  (`services/api/src/KidsLang.Application/Abstractions/Abstractions.cs`) and register it in
  `KidsLang.Infrastructure/DependencyInjection.cs` under a new `Otp:Sender` value. Keys go in the secret
  store (never in appsettings).

## 2. Email sending service — ON HOLD (needed for the email code)

The same sign-up also emails a 6-digit code. Not yet chosen: e.g. Azure Communication Services Email,
SendGrid, or SMTP. Needs a verified sender domain (e.g. `no-reply@kidzly…`). Plugs in the same way as
WhatsApp, for `OtpChannel.Email`.

## 3. Backend hosting — ON HOLD

Codes can only be sent by the backend (`services/api`); the live site (GitHub Pages) has no backend yet.

- Suggested: Azure App Service in **UAE North**, PostgreSQL (Azure Database for PostgreSQL), secrets in Key Vault.
- To switch on: deploy the API, set `VITE_API_URL` in the Pages build (`.github/workflows/pages.yml`),
  set `Jwt__SigningKey`, `Cors__Origins`, the database connection and the OTP provider keys.
- **Until then the live site runs in demo mode**: codes are created on the device and shown on the
  verify screen (yellow "Demo mode" box) so sign-up can still be tested. This disappears automatically
  once `VITE_API_URL` is set. In the API, `Otp:Sender = Dev` (Development only) keeps codes in memory;
  with no sender configured, `/auth/register/start` answers **503** rather than pretending to send.

## 4. How parents sign in after registering — ON HOLD

Today sign-in is still **email + password**; the PIN unlocks "Let's go" on the device. To decide:

- **Phone + PIN** (WhatsApp code only at sign-up, on a new device, or for a forgotten PIN), or
- **WhatsApp code every time** (more secure, a message and a wait on each sign-in), or keep email + password.

Related: once decided, the **password** field at sign-up may no longer be needed — it stays for now so
the current sign-in keeps working.

## 5. Automatic site deploy

The `Deploy web app to public site repo` workflow fails because the `SITE_DEPLOY_TOKEN` secret isn't
found in ShamzLearningApp. Until it's fixed, builds are published to ShamzLearningApp-site directly.

## Decided (for reference)

- Registration fields: name, email, mobile number (WhatsApp), password, 4-digit PIN, consent.
- Verification: a WhatsApp code to the mobile **and** an email code; both are required to create the
  account. Codes: 6 digits, stored hashed, expire after 10 minutes, 5 wrong tries, resend after 30 s
  (max 3 resends).
- Email and phone are each unique per account. They're used only to verify and secure the account
  (consent text updated). Neither is ever written to logs.
