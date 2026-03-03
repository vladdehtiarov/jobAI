import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { scoreProfile } from '@/lib/scoring/profile-score'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown-ip'
  const rl = checkRateLimit(`profile-score:${ip}`, 60, 60_000)
  if (!rl.allowed) return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

  const result = scoreProfile({
    target_role: body.target_role ?? null,
    target_salary_usd: body.target_salary_usd ?? null,
    linkedin_url: body.linkedin_url ?? null,
    skills: Array.isArray(body.skills) ? body.skills : [],
  })

  return NextResponse.json({ ok: true, ...result })
}
