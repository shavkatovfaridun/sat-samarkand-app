import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatUZS, formatDate, daysUntil } from '@/lib/format'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  graduated: 'bg-blue-100 text-blue-700',
  dropped: 'bg-gray-100 text-gray-500',
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!student) notFound()

  const { data: payments } = await supabase
    .from('payments')
    .select('id, month, subject, net_amount, status, due_date, paid_date')
    .eq('student_id', student.id)
    .order('due_date', { ascending: false })

  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select('id, score, total, submitted_at')
    .eq('student_id', student.id)
    .order('submitted_at', { ascending: false })
    .limit(5)

  async function updateStatus(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const newStatus = formData.get('status') as string
    await admin.from('students').update({ status: newStatus }).eq('id', params.id)
    redirect(`/admin/students/${params.id}`)
  }

  const examDays = student.exam_date ? daysUntil(student.exam_date) : null

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/students" className="text-xs text-gray-400 hover:text-gray-600">← Students</Link>
          <h1 className="text-xl font-bold mt-1">{student.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{student.subject} · {student.type} · {student.phase}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[student.status] ?? ''}`}>
          {student.status}
        </span>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold">{student.current_score ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Current</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold text-blue-600">{student.target_score ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Target</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <p className="text-xl font-bold">{examDays ?? '—'}</p>
          <p className="text-xs text-gray-500 mt-0.5">Days left</p>
        </div>
      </div>

      {/* Student info */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Student Info</h2>
        <dl className="space-y-1.5 text-sm">
          <Row label="Telegram ID" value={student.telegram_id?.toString() ?? '—'} />
          <Row label="Enrollment" value={student.enrollment_date ? formatDate(student.enrollment_date) : '—'} />
          <Row label="Exam Date" value={student.exam_date ? formatDate(student.exam_date) : '—'} />
          <Row label="Fee (Math)" value={student.monthly_fee_math ? formatUZS(student.monthly_fee_math) : '—'} />
          <Row label="Fee (English)" value={student.monthly_fee_english ? formatUZS(student.monthly_fee_english) : '—'} />
          {student.notes && <Row label="Notes" value={student.notes} />}
        </dl>
      </div>

      {/* Change status */}
      <form action={updateStatus} className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Change Status</h2>
        <div className="flex gap-2">
          <select name="status" defaultValue={student.status} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {['active', 'paused', 'graduated', 'dropped'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">Save</button>
        </div>
      </form>

      {/* Payments */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Payments</h2>
          <Link href={`/admin/finance/new?student_id=${student.id}`} className="text-xs text-blue-600">+ Add</Link>
        </div>
        {!payments?.length ? (
          <p className="text-sm text-gray-400">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{p.month} · {p.subject}</p>
                  <p className="text-xs text-gray-400">{formatUZS(p.net_amount)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'paid' ? 'bg-green-100 text-green-700' :
                  p.status === 'overdue' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent submissions */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Recent Homework</h2>
        {!recentSubmissions?.length ? (
          <p className="text-sm text-gray-400">No submissions yet.</p>
        ) : (
          <div className="space-y-1.5">
            {recentSubmissions.map((s) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-gray-500">{new Date(s.submitted_at).toLocaleDateString()}</span>
                <span className="font-medium">{s.score}/{s.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-right text-gray-900 truncate">{value}</dd>
    </div>
  )
}
