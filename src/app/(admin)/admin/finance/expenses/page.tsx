export const revalidate = 30

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatUZS, formatDate } from '@/lib/format'

const CATEGORY: Record<string, { color: string; bg: string; icon: string }> = {
  rent:      { color: '#1B4FD8', bg: 'rgba(27,79,216,0.10)',   icon: '🏢' },
  utilities: { color: '#AF52DE', bg: 'rgba(175,82,222,0.10)',  icon: '💡' },
  salary:    { color: '#1E8A3C', bg: 'rgba(52,199,89,0.10)',   icon: '💰' },
  marketing: { color: '#FF9500', bg: 'rgba(255,149,0,0.10)',   icon: '📣' },
  supplies:  { color: '#B86800', bg: 'rgba(255,149,0,0.10)',   icon: '📦' },
  other:     { color: 'rgba(60,60,67,0.55)', bg: 'rgba(120,120,128,0.10)', icon: '📋' },
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function ExpensesPage({ searchParams }: { searchParams: { month?: string } }) {
  const admin = createAdminClient()
  const currentMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  const { data: expenses } = await admin
    .from('expenses')
    .select('*')
    .eq('month', currentMonth)
    .order('created_at', { ascending: false })

  const total = expenses?.reduce((s, e) => s + e.amount, 0) ?? 0

  const byCategory = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>) ?? {}

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Finance</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Expenses</h1>
        </div>
        <Link href="/admin/finance/expenses/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          Add
        </Link>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 mb-5"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <Link href={`/admin/finance/expenses?month=${prevMonth(currentMonth)}`}
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all hover:bg-[rgba(27,79,216,0.08)] active:scale-95"
          style={{ color: 'rgba(60,60,67,0.40)', fontSize: 18 }}>‹</Link>
        <span className="flex-1 text-center text-[15px] font-bold" style={{ color: '#1C1C1E' }}>{currentMonth}</span>
        <Link href={`/admin/finance/expenses?month=${nextMonth(currentMonth)}`}
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-all hover:bg-[rgba(27,79,216,0.08)] active:scale-95"
          style={{ color: 'rgba(60,60,67,0.40)', fontSize: 18 }}>›</Link>
        <Link href="/admin/finance/pl"
          className="text-[12px] font-semibold ml-2 px-3 py-1.5 rounded-xl"
          style={{ color: '#1B4FD8', background: 'rgba(27,79,216,0.08)' }}>
          P&L →
        </Link>
      </div>

      {/* Total card */}
      <div className="rounded-2xl p-5 mb-4"
        style={{ background: 'linear-gradient(135deg,rgba(255,59,48,0.08),rgba(255,59,48,0.04))', border: '1px solid rgba(255,59,48,0.15)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: 'rgba(192,40,31,0.70)' }}>Total Expenses</p>
        <p className="text-[32px] font-bold tracking-tight" style={{ color: '#C0281F' }}>{formatUZS(total)}</p>
        {expenses?.length ? (
          <p className="text-[12px] mt-1" style={{ color: 'rgba(192,40,31,0.55)' }}>{expenses.length} items this month</p>
        ) : null}
      </div>

      {/* Category breakdown */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {sorted.map(([cat, amt]) => {
            const c = CATEGORY[cat] ?? CATEGORY.other
            const pct = total > 0 ? Math.round((amt / total) * 100) : 0
            return (
              <div key={cat} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{ background: c.bg }}>{c.icon}</span>
                  <span className="text-[12px] font-semibold capitalize" style={{ color: 'rgba(60,60,67,0.55)' }}>{cat}</span>
                </div>
                <p className="text-[16px] font-bold tracking-tight" style={{ color: c.color }}>{formatUZS(amt)}</p>
                <div className="mt-2 w-full h-1 rounded-full" style={{ background: 'rgba(120,120,128,0.12)' }}>
                  <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                </div>
                <p className="text-[10px] font-semibold mt-1" style={{ color: 'rgba(60,60,67,0.35)' }}>{pct}%</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Items list */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>All Items</p>
      {!expenses?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No expenses for {currentMonth}</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Tap + Add to record an expense</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {expenses.map((e, i) => {
            const c = CATEGORY[e.category] ?? CATEGORY.other
            return (
              <div key={e.id} className="flex items-center gap-4 px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-lg"
                  style={{ background: c.bg }}>
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">
                    {e.description || e.category}
                  </p>
                  <p className="text-[12px] capitalize mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {e.category} · {formatDate(e.created_at)}
                  </p>
                </div>
                <p className="text-[15px] font-bold shrink-0" style={{ color: '#1C1C1E' }}>
                  {formatUZS(e.amount)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
