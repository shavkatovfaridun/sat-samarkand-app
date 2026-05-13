import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
  student: '/student/dashboard',
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ status: 'waiting' })

  const admin = createAdminClient()

  // Check if the token has been claimed by the bot
  const { data: tokenRow } = await admin
    .from('login_tokens')
    .select('telegram_id, expires_at')
    .eq('token', token)
    .single()

  if (!tokenRow) return NextResponse.json({ status: 'waiting' })

  // Expired
  if (new Date(tokenRow.expires_at) < new Date()) {
    await admin.from('login_tokens').delete().eq('token', token)
    return NextResponse.json({ status: 'expired' })
  }

  // Not claimed yet
  if (!tokenRow.telegram_id) return NextResponse.json({ status: 'waiting' })

  // Claimed — create Supabase session
  const { data: userRow } = await admin
    .from('users')
    .select('role, telegram_id, name')
    .eq('telegram_id', tokenRow.telegram_id)
    .single()

  if (!userRow) return NextResponse.json({ status: 'waiting' })

  const email = `tg_${tokenRow.telegram_id}@sat.local`
  const password = `tg_${tokenRow.telegram_id}_${process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16)}`

  let session = null
  const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({ email, password })

  if (signInError?.message?.includes('Invalid login credentials')) {
    const { error: createError } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { telegram_id: tokenRow.telegram_id, role: userRow.role },
    })
    if (createError) return NextResponse.json({ status: 'error' })
    const { data: afterCreate } = await admin.auth.signInWithPassword({ email, password })
    session = afterCreate?.session
  } else {
    session = signInData?.session
  }

  if (!session) return NextResponse.json({ status: 'error' })

  // Clean up token
  await admin.from('login_tokens').delete().eq('token', token)

  const dest = ROLE_REDIRECTS[userRow.role] ?? '/student/dashboard'
  const res = NextResponse.json({ status: 'ok', redirect: dest })

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

  res.cookies.set('sb-access-token', session.access_token, { ...cookieOpts, maxAge: session.expires_in })
  res.cookies.set('sb-refresh-token', session.refresh_token, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
  res.cookies.set('user-role', userRow.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return res
}
