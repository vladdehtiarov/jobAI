# Secrets Rotation Checklist

1. Rotate key at provider (Supabase/Unipile/BringData).
2. Update local `.env.local`.
3. Update Render environment secrets.
4. Redeploy services.
5. Validate smoke checks.
6. Revoke old key.
