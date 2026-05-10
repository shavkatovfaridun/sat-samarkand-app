import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function NewPaymentPage({ searchParams }: { searchParams: { student_id?: string } }) {
  const supabase = createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, subject, monthly_fee_math, monthly_fee_english')
    .eq('status', 'active')
    .order('name')

  const currentMonth = new Date().toISOString().slice(0, 7)

  async function createPayment(formData: FormData) {
    'use server'
    const admin = createAdminClient()

    const student_id = formData.get('student_id') as string
    const subject = formData.get('subject') as string
    const amount = parseInt(formData.get('amount') as string)
    const month = formData.get('month') as string
    const due_date = formData.get('due_date') as string

    await admin.from('payments').insert({
      student_id,
      subject,
      amount,
      net_amount: amount,
      month,
      due_date,
      status: 'unpaid',
    })

    redirect('/admin/finance')
  }

  const preSelected = searchParams.student_id
  const preStudent = students?.find((s) => s.id === preSelected)

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Add Payment Record</h1>

      <form action={createPayment} className="space-y-4 bg-white rounded-xl p-6 border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
          <select name="student_id" required defaultValue={preSelected ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Select student…</option>
            {students?.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <select name="subject" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="math">Math</option>
            <option value="english">English</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
          <input type="month" name="month" defaultValue={currentMonth} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (UZS) *</label>
          <input
            type="number"
            name="amount"
            required
            defaultValue={preStudent?.monthly_fee_math || ''}
            placeholder="e.g. 800000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
          <input type="date" name="due_date" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <button type="submit" className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium">
          Add Payment
        </button>
      </form>
    </div>
  )
}
