import { NextRequest, NextResponse } from 'next/server'

const ROLE_REDIRECTS: Record<string, string> = {
  admin:   '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent:  '/parent/dashboard',
  student: '/student/dashboard',
}

const PROTECTED_PREFIXES = ['/admin', '/teacher', '/parent', '/student']

export function middleware(req: NextRequest) {
  // ── Never block server action POST requests ──────────────────────────────
  // Next.js server actions POST to the same URL with a "next-action" header.
  // Intercepting them breaks all form submissions.
  if (req.method === 'POST') return NextResponse.next()

  const { pathname } = req.nextUrl
  const role = req.cookies.get('user-role')?.value

  // @supabase/ssr stores the session across several chunked cookies named
  // "sb-<project-ref>-auth-token" or "sb-<project-ref>-auth-token.0" etc.
  // Check for ANY such cookie instead of the hard-coded "sb-access-token".
  const hasSession = req.cookies.getAll().some(
    c => c.name.startsWith('sb-') && c.name.includes('auth-token')
  )

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthPage  = pathname === '/'

  // Not logged in → home
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Logged in, on home → role dashboard
  if (isAuthPage && hasSession && role) {
    const dest = ROLE_REDIRECTS[role]
    if (dest) return NextResponse.redirect(new URL(dest, req.url))
  }

  // Wrong role accessing another role's section → their own dashboard
  if (isProtected && role) {
    const section = pathname.split('/')[1]
    if (section && section !== role && ROLE_REDIRECTS[role]) {
      return NextResponse.redirect(new URL(ROLE_REDIRECTS[role], req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*', '/teacher/:path*', '/parent/:path*', '/student/:path*'],
}
