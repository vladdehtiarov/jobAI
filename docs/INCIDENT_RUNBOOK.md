# Incident Runbook (MVP)

## Severity
- S1: complete outage / auth broken
- S2: key integration degraded
- S3: minor feature issue

## First response
1. Confirm incident and impact scope.
2. Freeze deploys.
3. Capture logs and failing endpoint examples.
4. Apply mitigation (feature flag, disable failing integration).
5. Postmortem ticket with root cause + action items.
