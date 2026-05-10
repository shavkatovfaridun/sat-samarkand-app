import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/bot'

// Telegram Bot webhook handler
// Register with: POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://apps.satsamarkand.uz/api/webhook

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message

    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id
    const text: string = message.text ?? ''
    const userId: number = message.from?.id

    if (!chatId || !userId) return NextResponse.json({ ok: true })

    const admin = createAdminClient()

    // Look up the user's role
    const { data: user } = await admin
      .from('users')
      .select('role, name')
      .eq('telegram_id', userId)
      .single()

    if (!user) {
      await sendTelegramMessage(chatId, '⚠️ You are not registered in the SAT Samarkand system.\n\nOpen the app: https://apps.satsamarkand.uz')
      return NextResponse.json({ ok: true })
    }

    // /start — send app link
    if (text === '/start') {
      const appUrl = 'https://apps.satsamarkand.uz'
      await sendTelegramMessage(chatId, `👋 Hi ${user.name}!\n\nOpen the SAT Samarkand app:\n${appUrl}`)
      return NextResponse.json({ ok: true })
    }

    // Default — guide to app
    await sendTelegramMessage(chatId, `Open the SAT Samarkand app to manage everything:\nhttps://apps.satsamarkand.uz`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook] error:', err)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

export async function GET() {
  return NextResponse.json({ status: 'SAT Samarkand bot webhook is live' })
}
