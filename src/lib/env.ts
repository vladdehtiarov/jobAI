type StrictEnv = 'staging' | 'production'

const REQUIRED_IN_STRICT_MODE = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'BRINGDATA_API_KEY',
  'APIFY_API_TOKEN',
  'UNIPILE_API_KEY',
  'UNIPILE_BASE_URL',
  'UNIPILE_WEBHOOK_SECRET',
  'OUTREACH_PROVIDER_URL',
] as const

let validated = false

function normalizeAppEnv(value: string | undefined): StrictEnv | 'development' {
  if (value === 'staging' || value === 'production') {
    return value
  }

  return 'development'
}

function isStrictMode(): boolean {
  // Strict validation should be opt-in via APP_ENV to avoid failing CI builds.
  const appEnv = normalizeAppEnv(process.env.APP_ENV)
  return appEnv === 'staging' || appEnv === 'production'
}

function getMissingKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => {
    const value = process.env[key]
    return !value || value.trim().length === 0
  })
}

export function validateEnvOnStartup() {
  if (validated || !isStrictMode()) {
    return
  }

  const missing = getMissingKeys(REQUIRED_IN_STRICT_MODE)

  if (missing.length > 0) {
    throw new Error(
      [
        'Missing required environment variables for staging/production startup validation:',
        ...missing.map((key) => `- ${key}`),
        'See docs/ENVIRONMENT.md and .env.staging.example/.env.production.example.',
      ].join('\n'),
    )
  }

  validated = true
}
