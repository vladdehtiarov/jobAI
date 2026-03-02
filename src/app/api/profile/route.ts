import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/security/rate-limit'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'local'
  const rl = checkRateLimit(`profile:get:${ip}`, 60, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId_required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'local'
  const rl = checkRateLimit(`profile:post:${ip}`, 30, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'id_required' }, { status: 400 })

  const payload = {
    id: body.id,
    full_name: body.full_name ?? null,
    target_role: body.target_role ?? null,
    target_salary_usd: body.target_salary_usd ?? null,
    linkedin_url: body.linkedin_url ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabaseAdmin.from('profiles').upsert(payload).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
