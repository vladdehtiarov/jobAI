# Integration Hardening Baseline

Implemented baseline utilities:
- Rate limiting helper (`src/lib/security/rate-limit.ts`)
- Webhook HMAC signature verification (`src/lib/integrations/webhook-signature.ts`)
- Retry helper with exponential backoff (`src/lib/integrations/retry.ts`)

Wired endpoints (skeleton baseline):
- `POST /api/outreach/send`: rate-limited + retry wrapper for provider call
- `POST /api/ingest/jobs`: rate-limited + retry wrapper for provider fetch
- `POST /api/webhooks/unipile`: HMAC signature verification via `x-unipile-signature`

Next implementation steps:
1. Replace skeleton provider URLs with real BringData/Unipile clients.
2. Add idempotency check persistence in DB layer.
3. Add route-level tests for 429/401/502 cases.
