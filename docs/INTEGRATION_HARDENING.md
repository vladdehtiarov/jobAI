# Integration Hardening Baseline

Implemented baseline utilities:
- Rate limiting helper (`src/lib/security/rate-limit.ts`)
- Webhook HMAC signature verification (`src/lib/integrations/webhook-signature.ts`)
- Retry helper with exponential backoff (`src/lib/integrations/retry.ts`)

Next implementation steps:
1. Wire rate limiting into API routes handling outreach and ingestion.
2. Enforce signature verification in webhook handlers.
3. Apply `withRetry` for BringData/Unipile network calls.
4. Add idempotency check persistence in DB layer.
