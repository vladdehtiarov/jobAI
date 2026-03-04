import { NextRequest, NextResponse } from 'next/server'

import { verifyHmacSignature } from '@/lib/integrations/webhook-signature'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type JsonObject = Record<string, unknown>

type NormalizedStatusEvent = {
  user_id: string
  application_id: string | null
  event_type: string
  payload: JsonObject
}

const MOCK_STORE_KEY = '__jobai_unipile_status_events__'

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {}
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

function pickArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizeStatusEvents(rawPayload: unknown): NormalizedStatusEvent[] {
  const payload = asObject(rawPayload)
  const rootData = asObject(payload.data)

  const statuses = [
    ...pickArray<JsonObject>(payload.statuses),
    ...pickArray<JsonObject>(rootData.statuses),
    ...pickArray<JsonObject>(payload.events),
    ...pickArray<JsonObject>(rootData.events),
  ]

  const singleStatusCandidate = pickString(
    payload.status,
    payload.message_status,
    payload.delivery_status,
    rootData.status,
    rootData.message_status,
    rootData.delivery_status,
  )

  const expandedStatuses =
    statuses.length > 0
      ? statuses
      : singleStatusCandidate
      ? [
          {
            status: singleStatusCandidate,
            at:
              pickString(payload.timestamp, payload.created_at, rootData.timestamp, rootData.created_at) ??
              new Date().toISOString(),
          },
        ]
      : []

  const rootUserId = pickString(payload.user_id, payload.userId, rootData.user_id, rootData.userId)
  const rootApplicationId = pickString(
    payload.application_id,
    payload.applicationId,
    rootData.application_id,
    rootData.applicationId,
  )

  const normalized = expandedStatuses.map((entry): NormalizedStatusEvent | null => {
    const statusEntry = asObject(entry)
    const status = pickString(statusEntry.status, statusEntry.state, statusEntry.event)
    const userId = pickString(statusEntry.user_id, statusEntry.userId, rootUserId)

    if (!status || !userId) return null

    const applicationId = pickString(
      statusEntry.application_id,
      statusEntry.applicationId,
      rootApplicationId,
    )

    return {
      user_id: userId,
      application_id: applicationId ?? null,
      event_type: `send_status:${status.toLowerCase()}`,
      payload: {
        provider: 'unipile',
        status,
        source_event: pickString(payload.event_type, payload.type, payload.event, rootData.event),
        occurred_at:
          pickString(
            statusEntry.occurred_at,
            statusEntry.timestamp,
            statusEntry.at,
            payload.timestamp,
            rootData.timestamp,
          ) ?? new Date().toISOString(),
        external_id: pickString(
          statusEntry.id,
          statusEntry.event_id,
          payload.id,
          payload.event_id,
          rootData.id,
        ),
        raw: statusEntry,
      },
    }
  })

  return normalized.filter((value): value is NormalizedStatusEvent => value !== null)
}

function persistMockEvents(events: NormalizedStatusEvent[]) {
  const globalStore = globalThis as typeof globalThis & {
    [MOCK_STORE_KEY]?: Array<NormalizedStatusEvent & { created_at: string }>
  }

  if (!Array.isArray(globalStore[MOCK_STORE_KEY])) {
    globalStore[MOCK_STORE_KEY] = []
  }

  const now = new Date().toISOString()
  globalStore[MOCK_STORE_KEY]!.push(...events.map((event) => ({ ...event, created_at: now })))

  return globalStore[MOCK_STORE_KEY]!
}

export async function POST(request: NextRequest) {
  const payloadText = await request.text()

  const secret = process.env.UNIPILE_WEBHOOK_SECRET
  if (secret) {
    const signature = request.headers.get('x-unipile-signature')
    if (!signature) {
      return NextResponse.json({ ok: false, error: 'Missing signature header' }, { status: 401 })
    }

    const isValid = verifyHmacSignature(payloadText, signature, secret)
    if (!isValid) {
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }
  }

  let payload: unknown
  try {
    payload = payloadText ? JSON.parse(payloadText) : {}
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const events = normalizeStatusEvents(payload)
  if (events.length === 0) {
    return NextResponse.json({ ok: true, accepted: false, reason: 'No send status events found' }, { status: 202 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    const mocked = persistMockEvents(events)
    return NextResponse.json(
      {
        ok: true,
        mocked: true,
        persisted: events.length,
        total_mocked_events: mocked.length,
        warning: 'Supabase admin env is not configured; persisted in in-memory mock store',
      },
      { status: 202 },
    )
  }

  const { error } = await supabase.from('events').insert(events)
  if (error) {
    return NextResponse.json({ ok: false, error: 'Failed to persist events', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, persisted: events.length }, { status: 202 })
}
