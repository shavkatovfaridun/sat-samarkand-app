import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatUZS, formatDate } from '@/lib/format'

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  rent:       { bg: 'bg-[#EEF3FF]', text: 'text-[#1B4FD8]', icon: '🏢' },
  utilities:  { bg: 'bg-[#F5F3FF]', text: 'text-violet-700', icon: '💡' },
  salary:     { bg: 'bg-[#ECFDF5]', text: 'text-emerald-700', icon: '💰' },
  marketing:  { bg: 'bg-[#FFF7ED]', text: 'text-orange-700', icon: '📣' },
  supplies:   { bg: 'bg-[#FFFBEB]', text: 'text-amber-700', icon: '📦' },
  other:      { bg: 'bg-[#F1F5F9]', text: 'text-slate-600', icon: '📋' },
}

export default async function ExpensesPage({ searchParams }: { searchParams: { month?: string } }) {
  const admin = createAdminClient()
  const currentMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  const { data: expenses } = await admin
    .from('expenses')
    .select('*')
    .eq('month', currentMonth)
    .order('created_at', { ascending: false })

  const total = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0

  const byCategory = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Finance</p>
          <h1 className="text-2xl font-bold text-[#1A2340]">Expenses</h1>
        </div>
        <Link href="/admin/finance/expenses/new"
          className="bg-[#1B4FD8] text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
          + Add
        </Link>
      </div>

      {/* Month picker */}
      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F5] mb-4 flex items-center gap-3">
        <span className="text-xs text-[#6B7B9C] font-medium">Month:</span>
        <Link href={`/admin/finance/expenses?month=${getPrevMonth(currentMonth)}`}
          className="text-[#6B7B9C] hover:text-[#1B4FD8] text-sm px-2">‹</Link>
        <span className="text-sm font-semibold text-[#1A2340]">{currentMonth}</span>
        <Link href={`/admin/finance/expenses?month=${getNextMonth(currentMonth)}`}
          className="text-[#6B7B9C] hover:text-[#1B4FD8] text-sm px-2">›</Link>
        <Link href="/admin/finance/pl" className="ml-auto text-xs font-semibold text-[#1B4FD8]">
          View P&L →
        </Link>
      </div>

      {/* Total + breakdown */}
      <div className="bg-[#FEF2F2] rounded-2xl p-4 border border-[#FECACA] mb-4">
        <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">Total Expenses</p>
        <p className="text-2xl font-bold text-red-800">{formatUZS(total)}</p>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(byCategory).map(([cat, amt]) => {
            const s = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.other
            return (
              <div key={cat} className={`${s.bg} rounded-xl p-3`}>
                <p className="text-xs text-[#6B7B9C] capitalize mb-0.5">{s.icon} {cat}</p>
                <p className={`text-sm font-bold ${s.text}`}>{formatUZS(amt)}</p>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-2">
        {!expenses?.length ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F5]">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-[#6B7B9C] text-sm">No expenses for {currentMonth}</p>
          </div>
        ) : (
          expenses.map(e => {
            const s = CATEGORY_STYLES[e.category] ?? CATEGORY_STYLES.other
            return (
              <div key={e.id} className="bg-white rounded-2xl px-4 py-3.5 border border-[#E2E8F5] flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2340] text-sm">{e.description || e.category}</p>
                  <p className="text-xs text-[#6B7B9C] capitalize">{e.category} · {formatDate(e.created_at)}</p>
                </div>
                <p className="font-bold text-[#1A2340] text-sm shrink-0">{formatUZS(e.amount)}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

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
