import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default async function NewPaymentPage({ searchParams }: { searchParams: { student_id?: string } }) {
  const supabase = createClient()

  const { data: students } = await supabase
    .from('students')
    .select('id, name, subject, monthly_fee_math, monthly_fee_english')
    .eq('status', 'active')
    .order('name')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const preSelected  = searchParams.student_id
  const preStudent   = students?.find(s => s.id === preSelected)

  async function createPayment(formData: FormData) {
    'use server'
    const admin      = createAdminClient()
    const student_id = formData.get('student_id') as string
    const subject    = formData.get('subject')    as string
    const amount     = parseInt(formData.get('amount') as string)
    const month      = formData.get('month')      as string
    const due_date   = formData.get('due_date')   as string

    await admin.from('payments').insert({
      student_id, subject, amount, net_amount: amount, month, due_date, status: 'unpaid',
    })
    redirect('/admin/finance')
  }

  return (
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href="/admin/finance"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Finance
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Add Payment Record</h1>
      </div>

      <form action={createPayment} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Payment Details</p>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Student *</label>
            <select name="student_id" required defaultValue={preSelected ?? ''} className={INPUT} style={INPUT_STYLE}>
              <option value="">Select student…</option>
              {students?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Subject *</label>
              <select name="subject" required className={INPUT} style={INPUT_STYLE}>
                <option value="math">Math</option>
                <option value="english">English</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Month *</label>
              <input type="month" name="month" defaultValue={currentMonth} required className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Amount (UZS) *</label>
              <input type="number" name="amount" required
                defaultValue={preStudent?.monthly_fee_math || ''}
                placeholder="e.g. 800000" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Due Date *</label>
              <input type="date" name="due_date" required className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href="/admin/finance"
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Add Payment
          </button>
        </div>
      </form>
    </div>
  )
}
