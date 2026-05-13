import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatUZS, formatDate } from '@/lib/format'

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  paid:    { color: '#1E8A3C', bg: 'rgba(52,199,89,0.12)',    label: 'Paid'    },
  unpaid:  { color: '#B86800', bg: 'rgba(255,149,0,0.12)',    label: 'Unpaid'  },
  overdue: { color: '#C0281F', bg: 'rgba(255,59,48,0.12)',    label: 'Overdue' },
  partial: { color: '#B86800', bg: 'rgba(255,149,0,0.12)',    label: 'Partial' },
  frozen:  { color: 'rgba(60,60,67,0.50)', bg: 'rgba(120,120,128,0.12)', label: 'Frozen' },
}

const FILTERS = [
  { value: '',        label: 'This Month' },
  { value: 'paid',    label: 'Paid'       },
  { value: 'unpaid',  label: 'Unpaid'     },
  { value: 'overdue', label: 'Overdue'    },
  { value: 'partial', label: 'Partial'    },
  { value: 'frozen',  label: 'Frozen'     },
]

export default async function FinancePage({ searchParams }: { searchParams: { status?: string; month?: string } }) {
  const supabase = createClient()
  const currentMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  let query = supabase
    .from('payments')
    .select('id, month, subject, net_amount, status, due_date, paid_date, students(id, name)')
    .order('due_date', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  else query = query.eq('month', currentMonth)

  const { data: payments } = await query

  const { data: summary } = await supabase
    .from('payments').select('status, net_amount').eq('month', currentMonth)

  const totalExpected = summary?.reduce((s, p) => s + (p.net_amount ?? 0), 0) ?? 0
  const totalReceived = summary?.filter(p => p.status === 'paid').reduce((s, p) => s + p.net_amount, 0) ?? 0
  const totalOverdue  = summary?.filter(p => p.status === 'overdue').reduce((s, p) => s + p.net_amount, 0) ?? 0
  const collectionRate = totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100) : 0

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>
            {currentMonth}
          </p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Finance</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/finance/pl"
            className="text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-[0.97]"
            style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
            P&L
          </Link>
          <Link href="/admin/finance/new"
            className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
            style={{ background: '#1B4FD8' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
            Add
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(60,60,67,0.45)' }}>Expected</p>
          <p className="text-[16px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>{formatUZS(totalExpected)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(60,60,67,0.45)' }}>Collected</p>
          <p className="text-[16px] font-bold tracking-tight" style={{ color: '#1E8A3C' }}>{formatUZS(totalReceived)}</p>
          <div className="mt-2 w-full h-1 rounded-full" style={{ background: 'rgba(52,199,89,0.15)' }}>
            <div className="h-1 rounded-full" style={{ width: `${collectionRate}%`, background: '#34C759' }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: totalOverdue > 0 ? '0 2px 12px rgba(255,59,48,0.10)' : '0 1px 4px rgba(0,0,0,0.05)', border: totalOverdue > 0 ? '1px solid rgba(255,59,48,0.15)' : 'none' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(60,60,67,0.45)' }}>Overdue</p>
          <p className="text-[16px] font-bold tracking-tight" style={{ color: totalOverdue > 0 ? '#FF3B30' : '#1C1C1E' }}>
            {formatUZS(totalOverdue)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const active = f.value ? searchParams.status === f.value : !searchParams.status
          return (
            <Link key={f.value}
              href={f.value ? `/admin/finance?status=${f.value}` : `/admin/finance?month=${currentMonth}`}
              className="shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full transition-all"
              style={{
                background: active ? '#1B4FD8' : 'white',
                color: active ? 'white' : 'rgba(60,60,67,0.55)',
                boxShadow: active ? '0 2px 8px rgba(27,79,216,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
              }}>
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Payment rows */}
      {!payments?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(52,199,89,0.10)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#34C759' }}>
              <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
              <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No payments found</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>
            {searchParams.status ? `No ${searchParams.status} payments` : `Nothing recorded for ${currentMonth}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {payments.map((p, i) => {
            const student = (p.students as unknown) as { id: string; name: string } | null
            const st = STATUS[p.status] ?? STATUS.unpaid
            return (
              <div key={p.id}
                className="flex items-center gap-4 px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                {/* Status icon */}
                <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center"
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
                  {student ? (
                    <Link href={`/admin/students/${student.id}`}
                      className="text-[14px] font-semibold truncate block hover:text-[#1B4FD8] transition-colors"
                      style={{ color: '#1C1C1E' }}>
                      {student.name}
                    </Link>
                  ) : (
                    <p className="text-[14px] font-semibold text-[#1C1C1E]">—</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[12px] capitalize" style={{ color: 'rgba(60,60,67,0.50)' }}>
                      {p.month} · {p.subject}
                    </p>
                    <p className="text-[12px] font-semibold" style={{ color: 'rgba(60,60,67,0.60)' }}>
                      {formatUZS(p.net_amount)}
                    </p>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(60,60,67,0.40)' }}>
                    {p.paid_date ? `Paid ${formatDate(p.paid_date)}` : `Due ${formatDate(p.due_date)}`}
                  </p>
                </div>
                {/* Status + action */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  {p.status !== 'paid' && (
                    <Link href={`/admin/finance/${p.id}/mark-paid`}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
                      Mark paid
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
