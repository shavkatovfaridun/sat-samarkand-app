import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatUZS, formatDate, daysUntil } from '@/lib/format'

const STATUS: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,199,89,0.12)',   color: '#1E8A3C' },
  paused:    { bg: 'rgba(255,149,0,0.12)',   color: '#B86800' },
  graduated: { bg: 'rgba(27,79,216,0.10)',   color: '#1B4FD8' },
  dropped:   { bg: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.55)' },
}

const PAY_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: 'rgba(52,199,89,0.12)',  color: '#1E8A3C', label: 'Paid'    },
  unpaid:  { bg: 'rgba(255,149,0,0.12)', color: '#B86800', label: 'Unpaid'  },
  overdue: { bg: 'rgba(255,59,48,0.12)', color: '#C0281F', label: 'Overdue' },
  partial: { bg: 'rgba(255,149,0,0.12)', color: '#B86800', label: 'Partial' },
  frozen:  { bg: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.50)', label: 'Frozen' },
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
  const math    = formData.get('math_score')    ? parseInt(formData.get('math_score')    as string) : null
  const reading = formData.get('reading_score') ? parseInt(formData.get('reading_score') as string) : null
  const total   = parseInt(formData.get('total_score') as string)
  await admin.from('score_history').insert({
    student_id:    studentId,
    test_date:     formData.get('test_date') as string,
    math_score:    math,
    reading_score: reading,
    total_score:   total,
    test_type:     formData.get('test_type') as string,
    notes:         (formData.get('notes') as string) || null,
  })
  await admin.from('students').update({ current_score: total }).eq('id', studentId)
  redirect(`/admin/students/${studentId}`)
}

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: student } = await admin.from('students').select('*').eq('id', params.id).single()
  if (!student) notFound()

  const [{ data: payments }, { data: scoreHistory }] = await Promise.all([
    admin.from('payments').select('id, month, subject, net_amount, status, due_date, paid_date').eq('student_id', student.id).order('due_date', { ascending: false }),
    admin.from('score_history').select('*').eq('student_id', student.id).order('test_date', { ascending: false }),
  ])

  const updateStatusWithId = updateStatus.bind(null, params.id)
  const addScoreWithId     = addScore.bind(null, params.id)
  const examDays = student.exam_date ? daysUntil(student.exam_date) : null
  const today    = new Date().toISOString().slice(0, 10)
  const st       = STATUS[student.status] ?? STATUS.active
  const scoreGap = student.target_score && student.current_score ? student.target_score - student.current_score : null
  const progressPct = student.current_score && student.target_score
    ? Math.min(100, Math.round(((student.current_score - 400) / (student.target_score - 400)) * 100)) : 0

  return (
    <div className="max-w-2xl space-y-4">
      {/* Back */}
      <div className="pt-1">
        <Link href="/admin/students"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Students
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>{student.name}</h1>
            <p className="text-[13px] mt-0.5 capitalize" style={{ color: 'rgba(60,60,67,0.55)' }}>
              {student.subject} · {student.type} · {student.phase}
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize shrink-0 mt-1"
            style={{ background: st.bg, color: st.color }}>
            {student.status}
          </span>
        </div>
      </div>

      {/* Score hero */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1340B0 0%,#1B4FD8 60%,#2563EB 100%)', boxShadow: '0 8px 32px rgba(27,79,216,0.25)' }}>
        <div className="relative overflow-hidden p-5">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Current', value: student.current_score ?? '—', big: true },
              { label: 'Target',  value: student.target_score  ?? '—', big: false },
              { label: 'Days left', value: examDays ?? '—', big: false },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`font-bold text-white leading-none ${s.big ? 'text-[40px]' : 'text-[28px]'}`}
                  style={{ opacity: s.big ? 1 : 0.75 }}>{s.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          {student.current_score && student.target_score && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                {scoreGap && scoreGap > 0
                  ? <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>+{scoreGap} to target</p>
                  : <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>Target reached!</p>}
                <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.70)' }}>{progressPct}%</p>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.70)' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href={`/admin/students/${params.id}/edit`}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
          style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
          </svg>
          Edit Profile
        </Link>
        <Link href={`/admin/finance/new?student_id=${student.id}`}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
          style={{ background: 'rgba(52,199,89,0.10)', color: '#1E8A3C' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          Add Payment
        </Link>
      </div>

      {/* Info table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>
            Student Info
          </p>
        </div>
        {[
          ['Telegram ID',   student.telegram_id?.toString()        ?? '—'],
          ['Parent TG',     student.parent_telegram_id?.toString() ?? '—'],
          ['Enrolled',      student.enrollment_date ? formatDate(student.enrollment_date) : '—'],
          ['Exam Date',     student.exam_date ? formatDate(student.exam_date) : '—'],
          ['Fee (Math)',    student.monthly_fee_math    ? formatUZS(student.monthly_fee_math)    : '—'],
          ['Fee (English)', student.monthly_fee_english ? formatUZS(student.monthly_fee_english) : '—'],
        ].map(([label, value], i) => (
          <div key={label} className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: i === 0 ? '1px solid rgba(60,60,67,0.07)' : '1px solid rgba(60,60,67,0.07)' }}>
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>{label}</p>
            <p className="text-[13px] font-medium" style={{ color: '#1C1C1E' }}>{value}</p>
          </div>
        ))}
        {student.notes && (
          <div className="mx-4 mb-4 mt-1 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,149,0,0.08)' }}>
            <p className="text-[12px]" style={{ color: '#B86800' }}>{student.notes}</p>
          </div>
        )}
      </div>

      {/* Change status */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
          Change Status
        </p>
        <form action={updateStatusWithId} className="flex gap-2">
          <select name="status" defaultValue={student.status}
            className={`flex-1 ${INPUT}`} style={INPUT_STYLE}>
            {['active', 'paused', 'graduated', 'dropped'].map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
          <button type="submit"
            className="px-5 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Save
          </button>
        </form>
      </div>

      {/* Log score */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'rgba(60,60,67,0.45)' }}>
          Log SAT Score
        </p>
        <form action={addScoreWithId} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Test Date</label>
              <input name="test_date" type="date" required defaultValue={today} className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Type</label>
              <select name="test_type" className={INPUT} style={INPUT_STYLE}>
                <option value="practice">Practice</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="official">Official</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Math (200–800)</label>
              <input name="math_score" type="number" min="200" max="800" placeholder="e.g. 650" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>R&W (200–800)</label>
              <input name="reading_score" type="number" min="200" max="800" placeholder="e.g. 620" className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Total Score * (400–1600)</label>
            <input name="total_score" type="number" required min="400" max="1600" placeholder="e.g. 1270" className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Notes</label>
            <input name="notes" placeholder="Optional" className={INPUT} style={INPUT_STYLE} />
          </div>
          <button type="submit"
            className="w-full rounded-xl py-3 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Save Score
          </button>
        </form>

        {/* Score history */}
        {scoreHistory && scoreHistory.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>History</p>
            {scoreHistory.map((s, i) => (
              <div key={s.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: i === 0 ? 'rgba(27,79,216,0.07)' : 'rgba(120,120,128,0.05)' }}>
                <div>
                  <p className="text-[15px] font-bold" style={{ color: i === 0 ? '#1B4FD8' : '#1C1C1E' }}>{s.total_score}</p>
                  <p className="text-[11px] capitalize" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {s.test_type} · {formatDate(s.test_date)}
                  </p>
                </div>
                {(s.math_score || s.reading_score) && (
                  <p className="text-[11px]" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {s.math_score ? `M:${s.math_score}` : ''}
                    {s.math_score && s.reading_score ? ' · ' : ''}
                    {s.reading_score ? `R:${s.reading_score}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Payments</p>
          <Link href={`/admin/finance/new?student_id=${student.id}`}
            className="text-[12px] font-semibold" style={{ color: '#1B4FD8' }}>
            + Add
          </Link>
        </div>
        {!payments?.length ? (
          <div className="bg-white rounded-2xl p-5 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>No payments recorded</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {payments.map((p, i) => {
              const ps = PAY_STATUS[p.status] ?? PAY_STATUS.unpaid
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3.5"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: '#1C1C1E' }}>{p.month} · {p.subject}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>{formatUZS(p.net_amount)}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: ps.bg, color: ps.color }}>
                    {ps.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
