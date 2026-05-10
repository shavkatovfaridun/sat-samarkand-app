import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { sendTelegramMessage } from '@/lib/bot'
import { formatUZS } from '@/lib/format'

export default async function MarkPaidPage({ params }: { params: { id: string } }) {
  async function markPaid() {
    'use server'
    const admin = createAdminClient()

    const { data: payment } = await admin
      .from('payments')
      .select('id, month, subject, net_amount, student_id, students(telegram_id, name, parent_telegram_id)')
      .eq('id', params.id)
      .single()

    if (!payment) return

    await admin
      .from('payments')
      .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10), receipt_sent: true })
      .eq('id', params.id)

    // Send Telegram receipt to student and parent
    const student = (payment.students as unknown) as { telegram_id: number; name: string; parent_telegram_id: number | null } | null
    if (student?.telegram_id) {
      const msg = `✅ <b>Payment received!</b>\n\nStudent: ${student.name}\nMonth: ${payment.month}\nSubject: ${payment.subject}\nAmount: ${formatUZS(payment.net_amount)}\n\nThank you! 🎓`
      await sendTelegramMessage(student.telegram_id, msg)
      if (student.parent_telegram_id) {
        await sendTelegramMessage(student.parent_telegram_id, msg)
      }
    }

    redirect('/admin/finance')
  }

  const admin = createAdminClient()
  const { data: payment } = await admin
    .from('payments')
    .select('month, subject, net_amount, students(name)')
    .eq('id', params.id)
    .single()

  const student = (payment?.students as unknown) as { name: string } | null

  return (
    <div className="max-w-sm mx-auto pt-12">
      <div className="bg-white rounded-xl p-6 border border-gray-100 text-center">
        <p className="text-4xl mb-4">💳</p>
        <h1 className="text-lg font-bold mb-1">Mark Payment as Paid?</h1>
        <p className="text-sm text-gray-500 mb-1">{student?.name}</p>
        <p className="text-sm text-gray-500 mb-6">
          {payment?.month} · {payment?.subject} · {payment?.net_amount ? formatUZS(payment.net_amount) : ''}
        </p>
        <p className="text-xs text-gray-400 mb-6">
          This will send a Telegram receipt to the student and parent.
        </p>
        <form action={markPaid}>
          <button type="submit" className="w-full bg-green-600 text-white rounded-xl py-3 text-sm font-medium mb-3">
            ✅ Confirm Paid — Send Receipt
          </button>
        </form>
        <a href="/admin/finance" className="block text-sm text-gray-400 hover:text-gray-600">Cancel</a>
      </div>
    </div>
  )
}
