import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { sendTelegramMessage } from '@/lib/bot'
import { formatUZS } from '@/lib/format'
import Link from 'next/link'

export default async function MarkPaidPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('month, subject, net_amount, students(name)')
    .eq('id', params.id)
    .single()

  const student = (payment?.students as unknown) as { name: string } | null

  async function markPaid() {
    'use server'
    const admin = createAdminClient()

    const { data: p } = await admin
      .from('payments')
      .select('id, month, subject, net_amount, student_id, students(telegram_id, name, parent_telegram_id)')
      .eq('id', params.id)
      .single()

    if (!p) return

    await admin
      .from('payments')
      .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10), receipt_sent: true })
      .eq('id', params.id)

    const s = (p.students as unknown) as { telegram_id: number; name: string; parent_telegram_id: number | null } | null
    if (s?.telegram_id) {
      const msg = `✅ <b>Payment received!</b>\n\nStudent: ${s.name}\nMonth: ${p.month}\nSubject: ${p.subject}\nAmount: ${formatUZS(p.net_amount)}\n\nThank you! 🎓`
      await sendTelegramMessage(s.telegram_id, msg)
      if (s.parent_telegram_id) await sendTelegramMessage(s.parent_telegram_id, msg)
    }

    redirect('/admin/finance')
  }

  return (
    <div className="max-w-sm mx-auto pt-10">
      {/* Confirmation card */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(52,199,89,0.08),rgba(52,199,89,0.04))', border: '1px solid rgba(52,199,89,0.20)', boxShadow: '0 8px 32px rgba(52,199,89,0.12)' }}>
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(52,199,89,0.15)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{ color: '#34C759' }}>
              <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
              <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
            </svg>
          </div>

          <h1 className="text-[18px] font-bold mb-1" style={{ color: '#1C1C1E' }}>Mark as Paid?</h1>

          {/* Payment details */}
          <div className="rounded-2xl px-4 py-3 my-4 text-left" style={{ background: 'rgba(52,199,89,0.08)' }}>
            {student && (
              <p className="text-[14px] font-semibold mb-1" style={{ color: '#1C1C1E' }}>{student.name}</p>
            )}
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.60)' }}>
              {payment?.month} · {payment?.subject}
            </p>
            {payment?.net_amount && (
              <p className="text-[20px] font-bold mt-1" style={{ color: '#1E8A3C' }}>
                {formatUZS(payment.net_amount)}
              </p>
            )}
          </div>

          <p className="text-[12px] mb-5" style={{ color: 'rgba(60,60,67,0.50)' }}>
            This will send a Telegram receipt to the student and parent.
          </p>

          <form action={markPaid}>
            <button type="submit"
              className="w-full rounded-2xl py-3.5 text-[14px] font-bold text-white mb-3 transition-all active:scale-[0.98]"
              style={{ background: '#34C759', boxShadow: '0 4px 16px rgba(52,199,89,0.35)' }}>
              Confirm — Send Receipt
            </button>
          </form>
          <Link href="/admin/finance"
            className="block text-[13px] font-medium"
            style={{ color: 'rgba(60,60,67,0.50)' }}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
