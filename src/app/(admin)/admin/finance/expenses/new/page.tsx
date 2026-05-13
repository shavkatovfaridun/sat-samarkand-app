import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = ['rent', 'utilities', 'salary', 'marketing', 'supplies', 'other']

const CAT_META: Record<string, { icon: string; color: string }> = {
  rent:      { icon: '🏢', color: '#1B4FD8' },
  utilities: { icon: '💡', color: '#AF52DE' },
  salary:    { icon: '💰', color: '#1E8A3C' },
  marketing: { icon: '📣', color: '#B86800' },
  supplies:  { icon: '📦', color: '#B86800' },
  other:     { icon: '📋', color: 'rgba(60,60,67,0.55)' },
}

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

async function createExpense(formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const month = formData.get('month') as string
  await admin.from('expenses').insert({
    month,
    category:    formData.get('category')    as string,
    description: (formData.get('description') as string) || null,
    amount:      parseInt(formData.get('amount') as string),
    paid_date:   (formData.get('paid_date') as string) || null,
    status:      'paid',
  })
  redirect(`/admin/finance/expenses?month=${month}`)
}

export default function NewExpensePage() {
  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href="/admin/finance/expenses"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Expenses
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Add Expense</h1>
      </div>

      <form action={createExpense} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Expense Details</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Month *</label>
              <input name="month" type="month" required defaultValue={currentMonth} className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Category *</label>
              <select name="category" required className={INPUT} style={INPUT_STYLE}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CAT_META[c]?.icon} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Description</label>
            <input name="description" placeholder="e.g. Office rent — May 2025" className={INPUT} style={INPUT_STYLE} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Amount (UZS) *</label>
              <input name="amount" type="number" required min="0" placeholder="e.g. 5000000" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Date Paid</label>
              <input name="paid_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href="/admin/finance/expenses"
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Add Expense
          </button>
        </div>
      </form>
    </div>
  )
}
