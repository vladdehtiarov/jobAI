# JobAI

## Quick start
1. `npm ci`
2. `cp .env.example .env.local` and fill values
3. `npm run dev`

## Scripts
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run check`

## CI
GitHub Actions runs: lint + typecheck + test + build.

## Next steps
- Connect Supabase project
- Add auth and protected routes
- Add RLS migrations
- Implement BringData/Apify ingestion adapter
