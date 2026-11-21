# Twilio credentials checklist

Use this once, in Vercel → the project → Settings → Environment Variables → **Production**.
Enter every row below before you save. After saving, a redeploy is needed for the new values to load.

Do not paste any of these values into chat. The secret for an API key is shown once, in the Console, at the moment you create the key.

Keep the existing `LEARNER_SESSION_SECRET` if learner maps already exist. The map name is an HMAC of the phone number with that secret. A new secret points at a new, empty map.

## What a Standard API key can call

Source: [API keys](https://www.twilio.com/docs/iam/api-keys).

| Key type | Access |
| --- | --- |
| Standard (`SK…`) | All Twilio resources except Accounts (`/Accounts`) and Keys (`/Accounts/{SID}/Keys`, `/v1/Keys`). |
| Main (`SK…`, Console only) | Full access, equivalent to the Account SID plus Auth Token. |
| Auth Token | Full access. This repo uses it to validate the usage-trigger webhook, not to call Sync or Verify. |

These calls are under `/2010-04-01/Accounts/{AccountSid}/…`, so a Standard key cannot make them:

- Account fetch. [Accounts](https://www.twilio.com/docs/iam/api-keys).
- Usage records. [Usage records](https://www.twilio.com/docs/usage/api/usage-record), `GET /2010-04-01/Accounts/{AccountSid}/Usage/Records.json`.
- Usage triggers. [Usage triggers](https://www.twilio.com/docs/usage/api/usage-trigger).

Sync and Verify are outside `/Accounts`. A Standard key can call them. The health check reports an account or usage rejection as `needs Auth Token or Main key` and still reads Sync.

## Production variables, in order

1. `TWILIO_ACCOUNT_SID` — required. The account that owns Sync and Verify.
   Format: `AC` plus 32 hex characters.
   Console → Account Dashboard → Account Info → Account SID.

2. `TWILIO_API_KEY_SID` — required. The key the server sends on every Twilio request.
   Format: `SK` plus 32 hex characters.
   Console → Account (admin menu) → API keys & tokens → the key’s SID.
   Use a Standard key for Sync and Verify. A Standard key will fail the account and usage rows until you choose a Main key or change those calls. That choice is open; do not swap it as part of re-entering these values.

3. `TWILIO_API_KEY_SECRET` — required. The secret for that same key.
   Format: non-empty. Twilio shows it once; it is usually 32 characters. There is no `SK` prefix on the secret.
   Same page as the key SID, only at creation time. If you no longer have it, create a new Standard key and replace both the SID and the secret together.

4. `TWILIO_SYNC_SERVICE_SID` — required. Where quiz, mock, and memory-game progress is stored.
   Format: `IS` plus 32 hex characters.
   Console → Explore products → Sync → Services → the service named for this site → SID.

5. `TWILIO_VERIFY_SERVICE_SID` — required. Sign-in codes. The health check only fetches the service. It does not send a code.
   Format: `VA` plus 32 hex characters.
   Console → Explore products → Verify → Services → the service → SID.

6. `LEARNER_SESSION_SECRET` — required. Signs the session cookie and names the Sync map.
   Format: at least 32 characters. This is not a Twilio value.
   Copy the value already stored in Production. Do not generate a new one unless you mean to orphan the current maps.

7. `LEARNER_ALLOWED_PHONES` — required. Who may receive a code and open the report.
   Format: one or more numbers, separated by commas. Each number is E.164 (`+` and 8 to 15 digits) or a 10-digit US/Canada number.
   This list is yours. It is not a Twilio resource.

8. `TWILIO_AUTH_TOKEN` — optional for the report and the health check. Required only for the Outage Ops usage webhook signature.
   Format: 32 hex characters.
   Console → Account Dashboard → Account Info → Auth Token, or Account → API keys & tokens.
   Re-enter it only if the webhook should keep working. The learner account and usage calls do not read this variable.

9. `TWILIO_USAGE_WEBHOOK_URL` — optional. The public callback for the daily usage trigger.
   Format: an `https://` URL ending in `/api/game/usage-trigger`.
   This is your deployment URL, not a Twilio SID.

10. `TWILIO_DAILY_USAGE_TRIGGER_SID` — optional. The health check fetches it when it is set.
    Format: `UT` plus 32 hex characters.
    Console → Monitor → Usage → Triggers → the daily total-price trigger → SID.
    Leave it unset if you have not created that trigger.

11. `LEARNER_PRIMARY_PHONE` — optional. Used only by the local export scripts when the allowlist has more than one number.
    Format: the same E.164 or 10-digit form as the allowlist. It must be one of those numbers.
    Not read by the site.

## After the last variable

Save the Production environment, then redeploy. After saving, a redeploy is needed for the new values to load.

Open `/account/report` while signed in. The Connection check lists each call. The account row’s friendly name and the last 4 of the SID are how you confirm the account. The sync read row’s quiz, mock, memory-miss, and mistake-log counts are how you confirm progress landed in Sync.
