import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramInitData, formatFullName } from '@/lib/telegram-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json()
    if (!initData) return NextResponse.json({ error: 'Missing initData' }, { status: 400 })

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 })

    const tgUser = validateTelegramInitData(initData, botToken)
    const admin = createAdminClient()

    // Upsert user in our users table
    const { error: upsertError } = await admin
      .from('users')
      .upsert(
        {
          telegram_id: tgUser.id,
          name: formatFullName(tgUser),
          telegram_username: tgUser.username ?? null,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' }
      )

    if (upsertError) {
      console.error('[auth/telegram] upsert error:', upsertError)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Fetch the user row to get role
    const { data: userRow } = await admin
      .from('users')
      .select('role, telegram_id, name')
      .eq('telegram_id', tgUser.id)
      .single()

    if (!userRow) return NextResponse.json({ error: 'User not found after upsert' }, { status: 500 })

    // Sign in with Supabase Auth using a synthetic email + stable password
    // This gives us a proper session cookie without a real password system
    const email = `tg_${tgUser.id}@sat.local`
    const password = `tg_${tgUser.id}_${process.env.SUPABASE_SERVICE_ROLE_KEY!.slice(0, 16)}`

    let authUser
    const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({ email, password })

    if (signInError?.message?.includes('Invalid login credentials')) {
      // First time — create the auth user
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { telegram_id: tgUser.id, role: userRow.role },
      })
      if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })
      authUser = createData.user

      // Sign in after creating
      const { data: afterCreate } = await admin.auth.signInWithPassword({ email, password })
      if (afterCreate?.session) {
        return buildSessionResponse(afterCreate.session, userRow)
      }
    } else if (signInData?.session) {
      return buildSessionResponse(signInData.session, userRow)
    }

    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}

function buildSessionResponse(session: { access_token: string; refresh_token: string; expires_in: number }, userRow: { role: string; telegram_id: number; name: string }) {
  const res = NextResponse.json({
    role: userRow.role,
    telegram_id: userRow.telegram_id,
    name: userRow.name,
  })

  // Set session cookies
  res.cookies.set('sb-access-token', session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: session.expires_in,
    path: '/',
  })
  res.cookies.set('sb-refresh-token', session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  res.cookies.set('user-role', userRow.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return res
}
