import { NextRequest, NextResponse } from 'next/server'

const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
  student: '/student/dashboard',
}

const PROTECTED_PREFIXES = ['/admin', '/teacher', '/parent', '/student']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const role = req.cookies.get('user-role')?.value
  const accessToken = req.cookies.get('sb-access-token')?.value

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = pathname === '/'

  // Not logged in and trying to access protected route → home
  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Logged in, on home → redirect to role dashboard
  if (isAuthPage && accessToken && role) {
    const dest = ROLE_REDIRECTS[role]
    if (dest) return NextResponse.redirect(new URL(dest, req.url))
  }

  // Wrong role accessing another role's section → redirect to their dashboard
  if (isProtected && role) {
    const section = pathname.split('/')[1] // e.g. "admin", "teacher"
    if (section && section !== role && ROLE_REDIRECTS[role]) {
      return NextResponse.redirect(new URL(ROLE_REDIRECTS[role], req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/admin/:path*', '/teacher/:path*', '/parent/:path*', '/student/:path*'],
}
