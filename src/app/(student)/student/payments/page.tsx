import { createClient } from '@/lib/supabase/server'
import { formatUZS, formatDate } from '@/lib/format'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paid:    { bg: 'bg-[#ECFDF5]', text: 'text-emerald-700', label: '✅ Paid' },
  unpaid:  { bg: 'bg-[#FFFBEB]', text: 'text-amber-700', label: '💳 Unpaid' },
  overdue: { bg: 'bg-[#FEF2F2]', text: 'text-red-700', label: '⚠️ Overdue' },
  partial: { bg: 'bg-[#FFF7ED]', text: 'text-orange-700', label: '🟡 Partial' },
  frozen:  { bg: 'bg-[#F1F5F9]', text: 'text-slate-500', label: '❄️ Frozen' },
}

export default async function StudentPaymentsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name')
    .eq('telegram_id', telegramId)
    .single()

  const { data: payments } = student ? await supabase
    .from('payments')
    .select('id, month, subject, amount, net_amount, status, due_date, paid_date, discounts')
    .eq('student_id', student.id)
    .order('due_date', { ascending: false }) : { data: null }

  const totalOwed = payments?.filter((p) => p.status !== 'paid' && p.status !== 'frozen')
    .reduce((sum, p) => sum + p.net_amount, 0) ?? 0

  return (
    <div>
      <div className="mb-6">
        <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Billing</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">Payments</h1>
      </div>

      {totalOwed > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 mb-5">
          <p className="text-sm font-bold text-red-800">Outstanding: {formatUZS(totalOwed)}</p>
          <p className="text-xs text-red-600 mt-0.5">Please pay at the front desk or via transfer.</p>
        </div>
      )}

      <div className="space-y-3">
        {!payments?.length ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F5]">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-[#6B7B9C] text-sm">No payment records yet</p>
          </div>
        ) : (
          payments.map((p) => {
            const hasDiscount = (p.discounts as unknown[])?.length > 0
            const style = STATUS_STYLES[p.status] ?? { bg: 'bg-white', text: 'text-[#6B7B9C]', label: p.status }
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-4 border ${
                  p.status === 'overdue' ? 'bg-[#FEF2F2] border-[#FECACA]' :
                  p.status === 'paid' ? 'bg-white border-[#A7F3D0]' :
                  'bg-white border-[#E2E8F5]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A2340] capitalize">{p.subject} — {p.month}</p>
                    <p className="text-base font-bold text-[#1A2340] mt-0.5">{formatUZS(p.net_amount)}</p>
                    {hasDiscount && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Discount applied (was {formatUZS(p.amount)})
                      </p>
                    )}
                    <p className="text-xs text-[#6B7B9C] mt-1">Due: {formatDate(p.due_date)}</p>
                    {p.paid_date && (
                      <p className="text-xs text-emerald-600">Paid: {formatDate(p.paid_date)}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
