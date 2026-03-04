import { NextRequest, NextResponse } from 'next/server'

import { withRetry } from '@/lib/integrations/retry'
import { getIdempotentResponse, setIdempotentResponse } from '@/lib/security/idempotency-store'
import { checkRateLimit } from '@/lib/security/rate-limit'

async function postToOutreachProvider(payload: unknown) {
  const providerUrl = process.env.OUTREACH_PROVIDER_URL

  // Dev-safe mode: if provider is not configured, emulate accepted send.
  if (!providerUrl) {
    return { mocked: true, accepted: true }
  }

  return withRetry(async () => {
    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Outreach provider returned ${response.status}`)
    }

    return response
  })
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown-ip'
  const limiter = checkRateLimit(`outreach-send:${ip}`, 10, 60_000)

  if (!limiter.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Rate limit exceeded',
      },
      {
        status: 429,
        headers: {
          'x-ratelimit-remaining': String(limiter.remaining),
          'x-ratelimit-reset': String(limiter.resetAt),
        },
      },
    )
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400 })
  }

  const incomingKey = request.headers.get('x-idempotency-key')
  const idempotencyKey =
    incomingKey ||
    `${ip}:${JSON.stringify({ providerUrl: body?.providerUrl ?? null, payload: body?.payload ?? body })}`

  const cached = getIdempotentResponse(idempotencyKey)
  if (cached) {
    return NextResponse.json(
      { ok: true, repeated: true, ...(cached as Record<string, unknown>) },
      {
        status: 200,
        headers: {
          'x-idempotency-replayed': 'true',
          'x-ratelimit-remaining': String(limiter.remaining),
          'x-ratelimit-reset': String(limiter.resetAt),
        },
      },
    )
  }

  try {
    const providerResult = await postToOutreachProvider(body)
    const responsePayload = { ok: true, mocked: (providerResult as { mocked?: boolean }).mocked === true }
    setIdempotentResponse(idempotencyKey, responsePayload)

    return NextResponse.json(
      responsePayload,
      {
        status: 202,
        headers: {
          'x-ratelimit-remaining': String(limiter.remaining),
          'x-ratelimit-reset': String(limiter.resetAt),
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider request failed'
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
