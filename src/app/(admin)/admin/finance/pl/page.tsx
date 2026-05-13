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

  // Build last 6 months for the chart
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 1 - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const [
    { data: payments },
    { data: expenses },
    { data: salaries },
  ] = await Promise.all([
    admin.from('payments').select('month, net_amount, status').in('month', months),
    admin.from('expenses').select('month, amount').in('month', months),
    admin.from('salaries').select('month, net_amount').in('month', months),
  ])

  // Aggregate by month
  const data = months.map(month => {
    const revenue = payments
      ?.filter(p => p.month === month && p.status === 'paid')
      .reduce((sum, p) => sum + p.net_amount, 0) ?? 0

    const expenseTotal = expenses
      ?.filter(e => e.month === month)
      .reduce((sum, e) => sum + e.amount, 0) ?? 0

    const salaryTotal = salaries
      ?.filter(s => s.month === month)
      .reduce((sum, s) => sum + s.net_amount, 0) ?? 0

    const totalCosts = expenseTotal + salaryTotal
    const profit = revenue - totalCosts

    return { month, revenue, expenseTotal, salaryTotal, totalCosts, profit }
  })

  const current = data.find(d => d.month === currentMonth) ?? {
    month: currentMonth, revenue: 0, expenseTotal: 0, salaryTotal: 0, totalCosts: 0, profit: 0,
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.totalCosts)), 1)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Finance</p>
          <h1 className="text-2xl font-bold text-[#1A2340]">P&L Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/finance/pl?month=${getPrevMonth(currentMonth)}`}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#E2E8F5] rounded-xl text-[#6B7B9C] hover:border-[#1B4FD8]">‹</Link>
          <span className="text-sm font-semibold text-[#1A2340] min-w-[70px] text-center">{currentMonth}</span>
          <Link href={`/admin/finance/pl?month=${getNextMonth(currentMonth)}`}
            className="w-8 h-8 flex items-center justify-center bg-white border border-[#E2E8F5] rounded-xl text-[#6B7B9C] hover:border-[#1B4FD8]">›</Link>
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#ECFDF5] rounded-2xl p-4 border border-[#A7F3D0]">
          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Revenue</p>
          <p className="text-lg font-bold text-emerald-800">{formatUZS(current.revenue)}</p>
        </div>
        <div className="bg-[#FEF2F2] rounded-2xl p-4 border border-[#FECACA]">
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Expenses</p>
          <p className="text-lg font-bold text-red-800">{formatUZS(current.totalCosts)}</p>
        </div>
        <div className={`rounded-2xl p-4 border ${
          current.profit >= 0
            ? 'bg-[#EEF3FF] border-[#C7D7FA]'
            : 'bg-[#FEF2F2] border-[#FECACA]'
        }`}>
          <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${current.profit >= 0 ? 'text-[#1B4FD8]' : 'text-red-600'}`}>
            Profit
          </p>
          <p className={`text-lg font-bold ${current.profit >= 0 ? 'text-[#1B4FD8]' : 'text-red-800'}`}>
            {current.profit >= 0 ? '+' : ''}{formatUZS(current.profit)}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Breakdown</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1A2340]">💳 Payments collected</span>
            <span className="font-semibold text-emerald-700">{formatUZS(current.revenue)}</span>
          </div>
          <div className="h-px bg-[#E2E8F5]" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1A2340]">🏢 Operating expenses</span>
            <span className="font-semibold text-red-600">{formatUZS(current.expenseTotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1A2340]">💰 Teacher salaries</span>
            <span className="font-semibold text-red-600">{formatUZS(current.salaryTotal)}</span>
          </div>
          <div className="h-px bg-[#E2E8F5]" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#1A2340]">Net Profit</span>
            <span className={`font-bold text-base ${current.profit >= 0 ? 'text-[#1B4FD8]' : 'text-red-700'}`}>
              {current.profit >= 0 ? '+' : ''}{formatUZS(current.profit)}
            </span>
          </div>
        </div>
      </div>

      {/* 6-month bar chart */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-4">Last 6 Months</p>
        <div className="flex items-end gap-2 h-32">
          {data.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5 items-end" style={{ height: '100px' }}>
                <div
                  className="flex-1 bg-[#ECFDF5] rounded-t-md"
                  style={{ height: `${Math.round((d.revenue / maxValue) * 100)}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
                />
                <div
                  className="flex-1 bg-[#FEF2F2] rounded-t-md"
                  style={{ height: `${Math.round((d.totalCosts / maxValue) * 100)}%`, minHeight: d.totalCosts > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-[9px] text-[#6B7B9C] font-medium">{d.month.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ECFDF5] border border-emerald-200" /><span className="text-xs text-[#6B7B9C]">Revenue</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FEF2F2] border border-red-200" /><span className="text-xs text-[#6B7B9C]">Costs</span></div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/admin/finance?month=${currentMonth}`}
          className="bg-white rounded-2xl p-4 border border-[#E2E8F5] hover:border-[#C7D7FA] text-center">
          <p className="text-xl mb-1">💳</p>
          <p className="text-sm font-semibold text-[#1A2340]">Payments</p>
        </Link>
        <Link href={`/admin/finance/expenses?month=${currentMonth}`}
          className="bg-white rounded-2xl p-4 border border-[#E2E8F5] hover:border-[#C7D7FA] text-center">
          <p className="text-xl mb-1">📋</p>
          <p className="text-sm font-semibold text-[#1A2340]">Expenses</p>
        </Link>
      </div>
    </div>
  )
}
