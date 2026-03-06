# JobAI Database ERD (v1)

```mermaid
erDiagram
  auth_users ||--|| profiles : has
  auth_users ||--o{ applications : creates
  auth_users ||--o{ events : emits
  jobs ||--o{ applications : referenced_by
  applications ||--o{ events : produces

  profiles {
    uuid id PK
    text full_name
    text target_role
    int target_salary_usd
    text[] markets
    text linkedin_url
    int profile_score
    timestamptz created_at
    timestamptz updated_at
  }

  jobs {
    uuid id PK
    text source
    text source_url
    text title
    text company
    text location
    boolean remote
    int salary_min_usd
    int salary_max_usd
    jsonb raw
    timestamptz created_at
  }

  applications {
    uuid id PK
    uuid user_id FK
    uuid job_id FK
    text status
    timestamptz sent_at
    timestamptz created_at
  }

  events {
    uuid id PK
    uuid user_id FK
    uuid application_id FK
    text event_type
    jsonb payload
    timestamptz created_at
  }
```

## Notes
- `profiles.id` is 1:1 with `auth.users.id`.
- `jobs` has uniqueness on `(source, source_url)`.
- `events` is append-only tracking for funnel and webhook outcomes.
- RLS is enabled on user-scoped tables (`profiles`, `applications`, `events`).
