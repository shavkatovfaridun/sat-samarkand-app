import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/bot'

// Called daily by Vercel Cron — see vercel.json
// Sends payment reminders: 5 days before due, on due date, 3 days overdue

export async function GET(req: NextRequest) {
  // Verify cron secret so only Vercel can call this
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const in5Days = new Date(today)
  in5Days.setDate(today.getDate() + 5)
  const in5DaysStr = in5Days.toISOString().slice(0, 10)

  const minus3Days = new Date(today)
  minus3Days.setDate(today.getDate() - 3)
  const minus3DaysStr = minus3Days.toISOString().slice(0, 10)

  // Get relevant payments with student info
  const { data: payments } = await admin
    .from('payments')
    .select(`
      id, month, subject, net_amount, due_date, status,
      students(name, telegram_id, parent_telegram_id)
    `)
    .in('status', ['unpaid', 'overdue'])

  if (!payments) return NextResponse.json({ ok: true, sent: 0 })

  let sent = 0

  for (const p of payments) {
    const student = (p.students as unknown) as {
      name: string
      telegram_id: number | null
      parent_telegram_id: number | null
    } | null

    if (!student) continue

    const { formatUZS } = await import('@/lib/format')
    const amount = formatUZS(p.net_amount)

    let msg: string | null = null

    if (p.due_date === in5DaysStr) {
      // 5 days before
      msg = `⏰ <b>Payment reminder</b>\n\nHi ${student.name}!\n\nYour payment for <b>${p.month} · ${p.subject}</b> is due in <b>5 days</b>.\nAmount: <b>${amount}</b>\n\nPlease pay at the front desk. Thank you! 🙏`
    } else if (p.due_date === todayStr) {
      // Due today
      msg = `🔔 <b>Payment due today</b>\n\nHi ${student.name}!\n\nYour payment for <b>${p.month} · ${p.subject}</b> is due <b>today</b>.\nAmount: <b>${amount}</b>\n\nPlease pay at the front desk. 🙏`
    } else if (p.due_date === minus3DaysStr) {
      // 3 days overdue
      msg = `⚠️ <b>Payment overdue</b>\n\nHi ${student.name},\n\nYour payment for <b>${p.month} · ${p.subject}</b> was due 3 days ago.\nAmount: <b>${amount}</b>\n\nPlease contact us to resolve this. Thank you!`
    }

    if (msg) {
      const recipients = [student.telegram_id, student.parent_telegram_id].filter(Boolean) as number[]
      await Promise.all(recipients.map(id => sendTelegramMessage(id, msg!)))
      sent += recipients.length
    }
  }

  return NextResponse.json({ ok: true, sent })
}
