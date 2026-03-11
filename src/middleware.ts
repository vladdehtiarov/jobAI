import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = ['/onboarding','/jobs']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (!isProtected) return NextResponse.next()

  // Lightweight auth gate for MVP: check Supabase auth cookie presence.
  const hasSbCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'))
  if (!hasSbCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/onboarding/:path*', '/jobs/:path*'],
}
