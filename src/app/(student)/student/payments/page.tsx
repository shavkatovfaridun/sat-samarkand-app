import { createClient } from '@/lib/supabase/server'
import { formatUZS, formatDate } from '@/lib/format'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'Paid',     color: '#1E8A3C',  bg: 'rgba(52,199,89,0.12)'  },
  unpaid:  { label: 'Unpaid',   color: '#B86800',  bg: 'rgba(255,149,0,0.12)'  },
  overdue: { label: 'Overdue',  color: '#C0281F',  bg: 'rgba(255,59,48,0.12)'  },
  partial: { label: 'Partial',  color: '#B86800',  bg: 'rgba(255,149,0,0.12)'  },
  frozen:  { label: 'Frozen',   color: 'rgba(60,60,67,0.50)', bg: 'rgba(120,120,128,0.12)' },
}

export default async function StudentPaymentsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const telegramId = match ? parseInt(match[1]) : null

  const { data: student } = await supabase
    .from('students').select('id, name').eq('telegram_id', telegramId).single()

  const { data: payments } = student
    ? await supabase.from('payments')
        .select('id, month, subject, amount, net_amount, status, due_date, paid_date, discounts')
        .eq('student_id', student.id)
        .order('due_date', { ascending: false })
    : { data: null }

  const totalOwed = payments
    ?.filter(p => p.status !== 'paid' && p.status !== 'frozen')
    .reduce((s, p) => s + p.net_amount, 0) ?? 0

  const totalPaid = payments
    ?.filter(p => p.status === 'paid')
    .reduce((s, p) => s + p.net_amount, 0) ?? 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: 'rgba(60,60,67,0.45)' }}>Billing</p>
        <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Payments</h1>
      </div>

      {/* Summary */}
      {payments && payments.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: 'rgba(60,60,67,0.45)' }}>Total Paid</p>
            <p className="text-[20px] font-bold tracking-tight" style={{ color: '#34C759' }}>{formatUZS(totalPaid)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4" style={{ boxShadow: totalOwed > 0 ? '0 2px 12px rgba(255,59,48,0.10)' : '0 1px 4px rgba(0,0,0,0.05)', border: totalOwed > 0 ? '1px solid rgba(255,59,48,0.15)' : 'none' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2" style={{ color: 'rgba(60,60,67,0.45)' }}>Outstanding</p>
            <p className="text-[20px] font-bold tracking-tight" style={{ color: totalOwed > 0 ? '#FF3B30' : '#34C759' }}>
              {totalOwed > 0 ? formatUZS(totalOwed) : 'All clear'}
            </p>
          </div>
        </div>
      )}

      {/* Payment list */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>History</p>

        {!payments?.length ? (
          <div className="bg-white rounded-3xl p-8 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(120,120,128,0.10)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: 'rgba(60,60,67,0.35)' }}>
                <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-semibold text-[#1C1C1E] mb-1">No payment records yet</p>
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Records will appear after enrollment</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {payments.map((p, i) => {
              const st = STATUS[p.status] ?? STATUS.unpaid
              const hasDiscount = (p.discounts as unknown[])?.length > 0
              return (
                <div key={p.id}
                  className="flex items-center gap-4 px-4 py-4"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.08)' : 'none' }}>
                  {/* Status dot */}
                  <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: st.bg }}>
                    {p.status === 'paid' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: st.color }}>
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    ) : p.status === 'overdue' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: st.color }}>
                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: st.color }}>
                        <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                        <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1C1C1E] capitalize">{p.subject} · {p.month}</p>
                    <p className="text-[16px] font-bold tracking-tight leading-tight mt-0.5" style={{ color: '#1C1C1E' }}>{formatUZS(p.net_amount)}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {hasDiscount && (
                        <span className="text-[11px]" style={{ color: '#34C759' }}>Discount applied</span>
                      )}
                      <span className="text-[11px]" style={{ color: 'rgba(60,60,67,0.45)' }}>
                        {p.paid_date ? `Paid ${formatDate(p.paid_date)}` : `Due ${formatDate(p.due_date)}`}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {totalOwed > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.15)' }}>
          <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#C0281F' }}>Outstanding balance: {formatUZS(totalOwed)}</p>
          <p className="text-[12px]" style={{ color: 'rgba(192,40,31,0.70)' }}>Please pay at the front desk or via transfer.</p>
        </div>
      )}
    </div>
  )
}
