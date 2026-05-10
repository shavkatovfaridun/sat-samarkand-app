import { createClient } from '@/lib/supabase/server'
import { formatUZS, formatDate } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  paid: '✅ Paid',
  unpaid: '💳 Unpaid',
  overdue: '⚠️ Overdue',
  partial: '🟡 Partial',
  frozen: '❄️ Frozen',
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
      <h1 className="text-xl font-bold mb-2">Payments</h1>
      {totalOwed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-red-800">Outstanding balance: {formatUZS(totalOwed)}</p>
          <p className="text-xs text-red-600 mt-0.5">Please pay at the front desk or via transfer.</p>
        </div>
      )}

      <div className="space-y-3">
        {!payments?.length ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
            No payment records yet.
          </div>
        ) : (
          payments.map((p) => {
            const hasDiscount = (p.discounts as unknown[])?.length > 0
            return (
              <div key={p.id} className={`bg-white rounded-xl p-4 border ${
                p.status === 'overdue' ? 'border-red-200' :
                p.status === 'paid' ? 'border-green-200' :
                'border-gray-100'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium capitalize">{p.subject} — {p.month}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{formatUZS(p.net_amount)}</p>
                    {hasDiscount && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Discount applied (was {formatUZS(p.amount)})
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Due: {formatDate(p.due_date)}</p>
                    {p.paid_date && <p className="text-xs text-green-600">Paid: {formatDate(p.paid_date)}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.status === 'paid' ? 'bg-green-100 text-green-700' :
                    p.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    p.status === 'frozen' ? 'bg-gray-100 text-gray-500' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {STATUS_LABELS[p.status] ?? p.status}
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
