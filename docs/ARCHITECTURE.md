# JobAI Architecture (MVP)

## Components
- Next.js app (web)
- Supabase (Auth, Postgres, RLS)
- External providers (BringData/Apify, Unipile)

## Data flow (high level)
1. User onboarding/profile input
2. Enrichment ingest -> normalized profile
3. Job ingest -> ranking
4. Outreach send/log
5. Analytics events -> KPI views

## Security baseline
- RLS enabled for user tables
- Service-role key server-only
- Rate limiting and idempotency required before scale
