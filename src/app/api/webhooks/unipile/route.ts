import { NextRequest, NextResponse } from 'next/server'

import { verifyHmacSignature } from '@/lib/integrations/webhook-signature'

export async function POST(request: NextRequest) {
  const secret = process.env.UNIPILE_WEBHOOK_SECRET
  if (!secret) {
    // Dev-safe mode: accept webhook without signature when secret is absent.
    return NextResponse.json({ ok: true, mocked: true, warning: 'UNIPILE_WEBHOOK_SECRET not set' }, { status: 202 })
  }

  const signature = request.headers.get('x-unipile-signature')
  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Missing signature header' }, { status: 401 })
  }

  const payload = await request.text()
  const isValid = verifyHmacSignature(payload, signature, secret)
  if (!isValid) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
  }

  return NextResponse.json({ ok: true }, { status: 202 })
}
