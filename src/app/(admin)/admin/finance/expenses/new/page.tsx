import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = ['rent', 'utilities', 'salary', 'marketing', 'supplies', 'other']

async function createExpense(formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const month = formData.get('month') as string
  await admin.from('expenses').insert({
    month,
    category: formData.get('category') as string,
    description: formData.get('description') as string || null,
    amount: parseInt(formData.get('amount') as string),
    paid_date: formData.get('paid_date') as string || null,
    status: 'paid',
  })
  redirect(`/admin/finance/expenses?month=${month}`)
}

export default function NewExpensePage() {
  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/finance/expenses" className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← Expenses</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340]">Add Expense</span>
      </div>

      <form action={createExpense} className="space-y-4 max-w-lg">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] space-y-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Expense Details</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Month *</label>
              <input name="month" type="month" required defaultValue={currentMonth}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Category *</label>
              <select name="category" required
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Description</label>
            <input name="description" placeholder="e.g. Office rent — May 2025"
              className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Amount (UZS) *</label>
              <input name="amount" type="number" required min="0" placeholder="e.g. 5000000"
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Date Paid</label>
              <input name="paid_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/finance/expenses"
            className="flex-1 text-center py-3 rounded-xl border border-[#E2E8F5] text-sm font-semibold text-[#6B7B9C]">
            Cancel
          </Link>
          <button type="submit"
            className="flex-1 bg-[#1B4FD8] text-white rounded-xl py-3 text-sm font-bold active:scale-95 transition-transform">
            Add Expense
          </button>
        </div>
      </form>
    </div>
  )
}
