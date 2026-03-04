# Environment schema

This project uses `.env` files for local and deployed environments.

## Files

- `.env.example` — minimal local development template
- `.env.staging.example` — staging template (all required values)
- `.env.production.example` — production template (all required values)

> Do not commit real secrets. Keep only placeholders in tracked files.

## Variables

| Variable | Required in staging | Required in production | Notes |
| --- | --- | --- | --- |
| `APP_ENV` | ✅ (`staging`) | ✅ (`production`) | Used by startup validation utility |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | ✅ | ✅ | Preferred public key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional fallback | optional fallback | Kept for compatibility with older setups |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Server-side admin operations |
| `BRINGDATA_API_KEY` | ✅ | ✅ | Ingestion provider secret |
| `APIFY_API_TOKEN` | ✅ | ✅ | Ingestion provider token |
| `UNIPILE_API_KEY` | ✅ | ✅ | Unipile API key |
| `UNIPILE_BASE_URL` | ✅ | ✅ | Unipile API endpoint |
| `UNIPILE_WEBHOOK_SECRET` | ✅ | ✅ | Required for webhook signature verification |
| `OUTREACH_PROVIDER_URL` | ✅ | ✅ | URL used by outreach send API route |

## Startup validation behavior

Runtime env validation is implemented in `src/lib/env.ts` and is executed at app startup by `src/app/layout.tsx`.

Validation is **strict** only when:

- `APP_ENV=staging`, or
- `APP_ENV=production`, or
- `NODE_ENV=production`

In development mode, validation is relaxed to preserve existing dev-safe mock behavior in API routes.

If required variables are missing in strict mode, app startup fails with a clear error listing missing keys.
