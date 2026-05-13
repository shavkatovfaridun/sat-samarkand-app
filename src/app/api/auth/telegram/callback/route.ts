import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramWidgetData, formatFullName } from '@/lib/telegram-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  parent: '/parent/dashboard',
  student: '/student/dashboard',
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const data: Record<string, string> = {}
    searchParams.forEach((value, key) => { data[key] = value })

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return NextResponse.redirect(new URL('/?error=config', req.url))

    const tgUser = validateTelegramWidgetData(data, botToken)
    const admin = createAdminClient()

    const { error: upsertError } = await admin.from('users').upsert(
      {
        telegram_id: tgUser.id,
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
        telegram_username: tgUser.username ?? null,
        last_active_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' }
    )

    if (upsertError) return NextResponse.redirect(new URL('/?error=db', req.url))

    const { data: userRow } = await admin
      .from('users')
      .select('role, telegram_id, name')
      .eq('telegram_id', tgUser.id)
      .single()

    if (!userRow) return NextResponse.redirect(new URL('/?error=user', req.url))

    const email = `tg_${tgUser.id}@sat.local`
    const password = `tg_${tgUser.id}_${process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16)}`

    let session = null
    const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({ email, password })

    if (signInError?.message?.includes('Invalid login credentials')) {
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { telegram_id: tgUser.id, role: userRow.role },
      })
      if (createError) return NextResponse.redirect(new URL('/?error=create', req.url))

      const { data: afterCreate } = await admin.auth.signInWithPassword({ email, password })
      session = afterCreate?.session
    } else {
      session = signInData?.session
    }

    if (!session) return NextResponse.redirect(new URL('/?error=auth', req.url))

    const dest = ROLE_REDIRECTS[userRow.role] ?? '/student/dashboard'
    const res = NextResponse.redirect(new URL(dest, req.url))

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'error'
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(msg)}`, req.url))
  }
}
