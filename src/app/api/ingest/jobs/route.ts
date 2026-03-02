import { NextRequest, NextResponse } from 'next/server'

import { withRetry } from '@/lib/integrations/retry'
import { checkRateLimit } from '@/lib/security/rate-limit'

async function fetchJobsFromProvider(sourceUrl: string) {
  return withRetry(async () => {
    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`Job provider returned ${response.status}`)
    }
    return response.json()
  })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown-ip'
  const limiter = checkRateLimit(`ingest-jobs:${ip}`, 20, 60_000)

  if (!limiter.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'x-ratelimit-remaining': String(limiter.remaining),
          'x-ratelimit-reset': String(limiter.resetAt),
        },
      },
    )
  }

  const body = (await request.json().catch(() => null)) as { sourceUrl?: string } | null
  if (!body?.sourceUrl) {
    return NextResponse.json({ ok: false, error: 'sourceUrl is required' }, { status: 400 })
  }

  try {
    const data = await fetchJobsFromProvider(body.sourceUrl)
    return NextResponse.json(
      {
        ok: true,
        items: Array.isArray(data) ? data.length : undefined,
      },
      {
        status: 200,
        headers: {
          'x-ratelimit-remaining': String(limiter.remaining),
          'x-ratelimit-reset': String(limiter.resetAt),
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs'
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
