import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security/rate-limit'

type Job = {
  id: string
  title: string
  company: string
  location: string
  remote: boolean
  salaryMin: number
  salaryMax: number
}

const MOCK_JOBS: Job[] = [
  { id: '1', title: 'Senior Full-Stack Engineer', company: 'Acme', location: 'EU', remote: true, salaryMin: 5000, salaryMax: 8000 },
  { id: '2', title: 'Backend Engineer (Node.js)', company: 'Globex', location: 'EU', remote: true, salaryMin: 4500, salaryMax: 7000 },
  { id: '3', title: 'Data Engineer', company: 'Initech', location: 'US', remote: false, salaryMin: 6000, salaryMax: 9000 }
]

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown-ip'
  const rl = checkRateLimit(`jobs-filter:${ip}`, 60, 60_000)
  if (!rl.allowed) return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 })

  const q = req.nextUrl.searchParams
  const role = q.get('role')?.toLowerCase()
  const location = q.get('location')?.toLowerCase()
  const remote = q.get('remote')
  const minSalary = Number(q.get('minSalary') ?? '0')

  const filtered = MOCK_JOBS.filter((j) => {
    if (role && !j.title.toLowerCase().includes(role)) return false
    if (location && !j.location.toLowerCase().includes(location)) return false
    if (remote === 'true' && !j.remote) return false
    if (remote === 'false' && j.remote) return false
    if (minSalary && j.salaryMax < minSalary) return false
    return true
  })

  return NextResponse.json({ ok: true, total: filtered.length, items: filtered })
}
