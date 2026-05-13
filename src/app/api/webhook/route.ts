export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/bot'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message

    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id
    const text: string = message.text ?? ''
    const userId: number = message.from?.id
    const firstName: string = message.from?.first_name ?? ''
    const lastName: string = message.from?.last_name ?? ''
    const username: string = message.from?.username ?? ''

    if (!chatId || !userId) return NextResponse.json({ ok: true })

    const admin = createAdminClient()

    // Handle /start auth_TOKEN — web login flow
    const authMatch = text.match(/^\/start auth_(.+)$/)
    if (authMatch) {
      const token = authMatch[1]

      // Upsert user
      await admin.from('users').upsert(
        {
          telegram_id: userId,
          name: [firstName, lastName].filter(Boolean).join(' ') || 'User',
          telegram_username: username || null,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' }
      )

      // Claim the token
      const { error } = await admin
        .from('login_tokens')
        .update({ telegram_id: userId })
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .is('telegram_id', null)

      if (error) {
        await sendTelegramMessage(chatId, '⚠️ Login link expired or already used. Please request a new one.')
        return NextResponse.json({ ok: true })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sat-samarkand-app.vercel.app'

      await sendTelegramMessage(
        chatId,
        `✅ <b>You're logged in!</b>\n\nTap the button below to open the app.`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🚀 Open SAT Samarkand', web_app: { url: appUrl } },
            ]],
          },
        },
      )
      return NextResponse.json({ ok: true })
    }

    // Look up the user's role for other commands
    const { data: user } = await admin
      .from('users')
      .select('role, name')
      .eq('telegram_id', userId)
      .single()

    if (!user) {
      await sendTelegramMessage(chatId, '⚠️ You are not registered in the SAT Samarkand system.\n\nOpen the app to sign in.')
      return NextResponse.json({ ok: true })
    }

    if (text === '/start') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sat-samarkand-app.vercel.app'
      await sendTelegramMessage(chatId, `👋 Hi ${user.name}!\n\nOpen the SAT Samarkand app:\n${appUrl}`)
      return NextResponse.json({ ok: true })
    }

    await sendTelegramMessage(chatId, `Open the SAT Samarkand app:\n${process.env.NEXT_PUBLIC_APP_URL || 'https://sat-samarkand-app.vercel.app'}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook] error:', err)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'SAT Samarkand bot webhook is live' })
}
