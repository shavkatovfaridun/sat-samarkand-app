import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatUZS, formatDate, daysUntil } from '@/lib/format'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#ECFDF5] text-emerald-700',
  paused: 'bg-[#FFFBEB] text-amber-700',
  graduated: 'bg-[#EEF3FF] text-[#1B4FD8]',
  dropped: 'bg-[#F1F5F9] text-slate-500',
}

async function updateStatus(studentId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('students').update({ status: formData.get('status') as string }).eq('id', studentId)
  redirect(`/admin/students/${studentId}`)
}

async function addScore(studentId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const math = formData.get('math_score') ? parseInt(formData.get('math_score') as string) : null
  const reading = formData.get('reading_score') ? parseInt(formData.get('reading_score') as string) : null
  const total = parseInt(formData.get('total_score') as string)
  await admin.from('score_history').insert({
    student_id: studentId,
    test_date: formData.get('test_date') as string,
    math_score: math,
    reading_score: reading,
    total_score: total,
    test_type: formData.get('test_type') as string,
    notes: formData.get('notes') as string || null,
  })
  await admin.from('students').update({ current_score: total }).eq('id', studentId)
  redirect(`/admin/students/${studentId}`)
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: student } = await admin.from('students').select('*').eq('id', params.id).single()
  if (!student) notFound()

  const [{ data: payments }, { data: scoreHistory }] = await Promise.all([
    admin.from('payments').select('id, month, subject, net_amount, status, due_date, paid_date').eq('student_id', student.id).order('due_date', { ascending: false }),
    admin.from('score_history').select('*').eq('student_id', student.id).order('test_date', { ascending: false }),
  ])

  const updateStatusWithId = updateStatus.bind(null, params.id)
  const addScoreWithId = addScore.bind(null, params.id)
  const examDays = student.exam_date ? daysUntil(student.exam_date) : null
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/students" className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← Students</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340] truncate">{student.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A2340]">{student.name}</h1>
            <p className="text-[#6B7B9C] text-sm capitalize mt-0.5">{student.subject} · {student.type} · {student.phase}</p>
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[student.status] ?? ''}`}>
            {student.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#F5F7FF] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#1A2340]">{student.current_score ?? '—'}</p>
            <p className="text-[10px] text-[#6B7B9C] mt-0.5">Current</p>
          </div>
          <div className="bg-[#EEF3FF] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#1B4FD8]">{student.target_score ?? '—'}</p>
            <p className="text-[10px] text-[#6B7B9C] mt-0.5">Target</p>
          </div>
          <div className="bg-[#F5F7FF] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#1A2340]">{examDays ?? '—'}</p>
            <p className="text-[10px] text-[#6B7B9C] mt-0.5">Days left</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Student Info</p>
        <dl className="space-y-2 text-sm">
          {[
            ['Telegram ID', student.telegram_id?.toString() ?? '—'],
            ['Enrolled', student.enrollment_date ? formatDate(student.enrollment_date) : '—'],
            ['Exam Date', student.exam_date ? formatDate(student.exam_date) : '—'],
            ['Fee (Math)', student.monthly_fee_math ? formatUZS(student.monthly_fee_math) : '—'],
            ['Fee (English)', student.monthly_fee_english ? formatUZS(student.monthly_fee_english) : '—'],
            ['Parent TG', student.parent_telegram_id?.toString() ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-[#6B7B9C] shrink-0">{label}</dt>
              <dd className="text-[#1A2340] text-right truncate">{value}</dd>
            </div>
          ))}
          {student.notes && (
            <div className="mt-2 bg-[#FFFBEB] rounded-xl p-3">
              <p className="text-xs text-amber-700">{student.notes}</p>
            </div>
          )}
        </dl>
        <div className="flex gap-2 mt-4">
          <Link href={`/admin/students/${params.id}/edit`}
            className="flex-1 text-center py-2.5 bg-[#EEF3FF] text-[#1B4FD8] rounded-xl text-sm font-semibold">
            Edit
          </Link>
          <Link href={`/admin/finance/new?student_id=${student.id}`}
            className="flex-1 text-center py-2.5 bg-[#ECFDF5] text-emerald-700 rounded-xl text-sm font-semibold">
            + Payment
          </Link>
        </div>
      </div>

      {/* Change status */}
      <form action={updateStatusWithId} className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Change Status</p>
        <div className="flex gap-2">
          <select name="status" defaultValue={student.status}
            className="flex-1 border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
            {['active', 'paused', 'graduated', 'dropped'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit"
            className="px-5 py-2.5 bg-[#1B4FD8] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">
            Save
          </button>
        </div>
      </form>

      {/* Add score */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Log Score</p>
        <form action={addScoreWithId} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Test Date</label>
              <input name="test_date" type="date" required defaultValue={today}
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Type</label>
              <select name="test_type" className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                <option value="practice">Practice</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="official">Official</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Math (200–800)</label>
              <input name="math_score" type="number" min="200" max="800" placeholder="e.g. 650"
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">R&W (200–800)</label>
              <input name="reading_score" type="number" min="200" max="800" placeholder="e.g. 620"
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Total Score * (400–1600)</label>
            <input name="total_score" type="number" required min="400" max="1600" placeholder="e.g. 1270"
              className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Notes</label>
            <input name="notes" placeholder="Optional"
              className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>
          <button type="submit"
            className="w-full bg-[#1B4FD8] text-white rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform">
            Save Score
          </button>
        </form>

        {scoreHistory && scoreHistory.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-[#6B7B9C]">History</p>
            {scoreHistory.map((s, i) => (
              <div key={s.id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${i === 0 ? 'bg-[#EEF3FF]' : 'bg-[#F5F7FF]'}`}>
                <div>
                  <p className="font-bold text-[#1A2340]">{s.total_score}</p>
                  <p className="text-xs text-[#6B7B9C]">{s.test_type} · {formatDate(s.test_date)}</p>
                </div>
                {(s.math_score || s.reading_score) && (
                  <p className="text-xs text-[#6B7B9C]">
                    {s.math_score ? `M:${s.math_score}` : ''}{s.math_score && s.reading_score ? ' · ' : ''}{s.reading_score ? `R:${s.reading_score}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Payments</p>
          <Link href={`/admin/finance/new?student_id=${student.id}`} className="text-xs font-semibold text-[#1B4FD8]">+ Add</Link>
        </div>
        {!payments?.length ? (
          <p className="text-[#6B7B9C] text-sm">No payments recorded.</p>
        ) : (
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-[#F5F7FF] last:border-0">
                <div>
                  <p className="text-sm font-semibold text-[#1A2340]">{p.month} · {p.subject}</p>
                  <p className="text-xs text-[#6B7B9C]">{formatUZS(p.net_amount)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  p.status === 'paid' ? 'bg-[#ECFDF5] text-emerald-700' :
                  p.status === 'overdue' ? 'bg-[#FEF2F2] text-red-700' :
                  'bg-[#FFFBEB] text-amber-700'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
