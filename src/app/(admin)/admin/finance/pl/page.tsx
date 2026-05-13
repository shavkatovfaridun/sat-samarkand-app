
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatUZS } from '@/lib/format'

function getPrevMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function getNextMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function PLPage({ searchParams }: { searchParams: { month?: string } }) {
  const admin = createAdminClient()
  const currentMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  // Last 6 months for the chart
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 1 - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [{ data: payments }, { data: expenses }, { data: salaries }] = await Promise.all([
    admin.from('payments').select('month, net_amount, status').in('month', months),
    admin.from('expenses').select('month, amount').in('month', months),
    admin.from('salaries').select('month, net_amount').in('month', months),
  ])

  const data = months.map(month => {
    const revenue = payments?.filter(p => p.month === month && p.status === 'paid').reduce((s, p) => s + p.net_amount, 0) ?? 0
    const expenseTotal = expenses?.filter(e => e.month === month).reduce((s, e) => s + e.amount, 0) ?? 0
    const salaryTotal  = salaries?.filter(s => s.month === month).reduce((s, sl) => s + sl.net_amount, 0) ?? 0
    const totalCosts   = expenseTotal + salaryTotal
    const profit       = revenue - totalCosts
    return { month, revenue, expenseTotal, salaryTotal, totalCosts, profit }
  })

  const current = data.find(d => d.month === currentMonth) ?? { month: currentMonth, revenue: 0, expenseTotal: 0, salaryTotal: 0, totalCosts: 0, profit: 0 }
  const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.totalCosts)), 1)
  const isProfit = current.profit >= 0

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Finance</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>P&L Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/finance/pl?month=${getPrevMonth(currentMonth)}`}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all hover:bg-[rgba(27,79,216,0.08)] active:scale-95 bg-white"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', color: 'rgba(60,60,67,0.40)', fontSize: 18 }}>
            ‹
          </Link>
          <span className="text-[14px] font-bold min-w-[72px] text-center" style={{ color: '#1C1C1E' }}>{currentMonth}</span>
          <Link href={`/admin/finance/pl?month=${getNextMonth(currentMonth)}`}
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all hover:bg-[rgba(27,79,216,0.08)] active:scale-95 bg-white"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', color: 'rgba(60,60,67,0.40)', fontSize: 18 }}>
            ›
          </Link>
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(60,60,67,0.45)' }}>Revenue</p>
          <p className="text-[15px] font-bold tracking-tight" style={{ color: '#1E8A3C' }}>{formatUZS(current.revenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'rgba(60,60,67,0.45)' }}>Costs</p>
          <p className="text-[15px] font-bold tracking-tight" style={{ color: '#C0281F' }}>{formatUZS(current.totalCosts)}</p>
        </div>
        <div className="rounded-2xl p-4"
          style={{
            background: isProfit ? 'linear-gradient(135deg,#1340B0,#1B4FD8)' : 'rgba(255,59,48,0.08)',
            boxShadow: isProfit ? '0 4px 16px rgba(27,79,216,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
          }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2"
            style={{ color: isProfit ? 'rgba(255,255,255,0.55)' : 'rgba(192,40,31,0.70)' }}>Profit</p>
          <p className="text-[15px] font-bold tracking-tight"
            style={{ color: isProfit ? 'white' : '#C0281F' }}>
            {isProfit ? '+' : ''}{formatUZS(current.profit)}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Breakdown</p>
        </div>
        {[
          { label: 'Payments collected',  value: current.revenue,       color: '#1E8A3C', plus: true  },
          { label: 'Operating expenses',  value: current.expenseTotal,  color: '#C0281F', plus: false },
          { label: 'Teacher salaries',    value: current.salaryTotal,   color: '#C0281F', plus: false },
        ].map((row, i) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : '1px solid rgba(60,60,67,0.07)' }}>
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.60)' }}>{row.label}</p>
            <p className="text-[13px] font-bold" style={{ color: row.color }}>
              {row.plus ? '' : '−'}{formatUZS(row.value)}
            </p>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3.5"
          style={{ borderTop: '1px solid rgba(60,60,67,0.07)', background: 'rgba(120,120,128,0.04)' }}>
          <p className="text-[14px] font-bold" style={{ color: '#1C1C1E' }}>Net Profit</p>
          <p className="text-[16px] font-bold" style={{ color: isProfit ? '#1B4FD8' : '#C0281F' }}>
            {isProfit ? '+' : ''}{formatUZS(current.profit)}
          </p>
        </div>
      </div>

      {/* 6-month chart */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'rgba(60,60,67,0.45)' }}>Last 6 Months</p>
        <div className="flex items-end gap-2" style={{ height: 100 }}>
          {data.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: 88 }}>
                <div className="flex-1 rounded-t-lg transition-all"
                  style={{
                    height: `${Math.round((d.revenue / maxValue) * 100)}%`,
                    minHeight: d.revenue > 0 ? 4 : 0,
                    background: d.month === currentMonth ? '#34C759' : 'rgba(52,199,89,0.30)',
                  }} />
                <div className="flex-1 rounded-t-lg transition-all"
                  style={{
                    height: `${Math.round((d.totalCosts / maxValue) * 100)}%`,
                    minHeight: d.totalCosts > 0 ? 4 : 0,
                    background: d.month === currentMonth ? '#FF3B30' : 'rgba(255,59,48,0.25)',
                  }} />
              </div>
              <span className="text-[9px] font-semibold" style={{ color: d.month === currentMonth ? '#1C1C1E' : 'rgba(60,60,67,0.40)' }}>
                {d.month.slice(5)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm" style={{ background: 'rgba(52,199,89,0.40)' }} />
            <span className="text-[10px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm" style={{ background: 'rgba(255,59,48,0.35)' }} />
            <span className="text-[10px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Costs</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href={`/admin/finance?month=${currentMonth}`}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 transition-all hover:bg-[rgba(0,0,0,0.01)] active:scale-[0.98]"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(52,199,89,0.10)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: '#34C759' }}>
              <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
              <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>Payments</p>
        </Link>
        <Link href={`/admin/finance/expenses?month=${currentMonth}`}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 transition-all hover:bg-[rgba(0,0,0,0.01)] active:scale-[0.98]"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,59,48,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: '#FF3B30' }}>
              <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75-6.75a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
              <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>Expenses</p>
        </Link>
      </div>
    </div>
  )
}
