import { createClient } from '@/lib/supabase/server'
import { formatUZS, formatDate, daysUntil } from '@/lib/format'

export default async function ParentDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const telegramId = match ? parseInt(match[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, subject, phase, exam_date, target_score, current_score, status')
    .eq('parent_telegram_id', telegramId)
    .single()

  const [{ data: recentAttendance }, { data: payments }, { data: scoreHistory }] = await Promise.all([
    student
      ? supabase.from('attendance').select('class_date, status').eq('student_id', student.id).order('class_date', { ascending: false }).limit(10)
      : Promise.resolve({ data: null }),
    student
      ? supabase.from('payments').select('month, status, net_amount, due_date, paid_date').eq('student_id', student.id).order('due_date', { ascending: false }).limit(3)
      : Promise.resolve({ data: null }),
    student
      ? supabase.from('score_history').select('total_score, test_date, test_type').eq('student_id', student.id).order('test_date', { ascending: false }).limit(5)
      : Promise.resolve({ data: null }),
  ])

  if (!student) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(27,79,216,0.08)' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{ color: '#1B4FD8' }}>
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="font-bold text-[#1C1C1E] text-[18px] mb-2">No student linked</p>
      <p className="text-[14px]" style={{ color: 'rgba(60,60,67,0.55)' }}>Contact admin to link your child's profile.</p>
    </div>
  )

  const examDays = student.exam_date ? daysUntil(student.exam_date) : null
  const scoreGap = student.target_score && student.current_score ? student.target_score - student.current_score : null
  const progressPct = student.current_score && student.target_score
    ? Math.min(100, Math.round(((student.current_score - 400) / (student.target_score - 400)) * 100)) : 0
  const presentCount = recentAttendance?.filter(a => a.status === 'present').length ?? 0
  const totalClasses = recentAttendance?.length ?? 0
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : null
  const firstName = student.name.split(' ')[0]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>Your child</p>
        <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>{student.name}</h1>
        <p className="text-[13px] capitalize mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>
          {student.subject} · {student.phase}
        </p>
      </div>

      {/* Hero score card */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1340B0 0%,#1B4FD8 60%,#2563EB 100%)', boxShadow: '0 8px 32px rgba(27,79,216,0.28)' }}>
        <div className="relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50 mb-1">Current Score</p>
                <p className="text-[52px] font-bold text-white leading-none tracking-tight">
                  {student.current_score ?? '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50 mb-1">Target</p>
                <p className="text-[32px] font-bold text-white/70 leading-none tracking-tight">{student.target_score ?? '—'}</p>
                {examDays !== null && (
                  <p className="text-[12px] font-medium text-white/40 mt-1">{examDays}d left</p>
                )}
              </div>
            </div>
            {student.current_score && student.target_score && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  {scoreGap && scoreGap > 0
                    ? <p className="text-[12px] font-medium text-white/50">+{scoreGap} to target</p>
                    : <p className="text-[12px] font-medium text-white/50">Target reached!</p>
                  }
                  <p className="text-[12px] font-bold text-white/70">{progressPct}%</p>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.70)' }} />
                </div>
              </div>
            )}
          </div>
        </div>
        {student.exam_date && (
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.10)' }}>
            <span className="text-[13px] font-medium text-white/60">SAT Exam</span>
            <span className="text-[13px] font-bold text-white/80">{formatDate(student.exam_date)}</span>
          </div>
        )}
      </div>

      {/* Attendance + Score row */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Attendance */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Attendance</p>
          <p className="text-[32px] font-bold tracking-tight leading-none mb-1"
            style={{ color: attendanceRate !== null && attendanceRate >= 80 ? '#34C759' : attendanceRate !== null && attendanceRate >= 60 ? '#FF9500' : '#FF3B30' }}>
            {attendanceRate !== null ? `${attendanceRate}%` : '—'}
          </p>
          <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.45)' }}>
            {presentCount}/{totalClasses} classes
          </p>
          {totalClasses > 0 && (
            <div className="flex gap-1 mt-3 flex-wrap">
              {recentAttendance?.map((a, i) => (
                <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: a.status === 'present' ? 'rgba(52,199,89,0.15)' : a.status === 'late' ? 'rgba(255,149,0,0.15)' : 'rgba(255,59,48,0.12)',
                    color: a.status === 'present' ? '#1E8A3C' : a.status === 'late' ? '#B86800' : '#C0281F',
                  }}>
                  {a.status === 'present' ? '✓' : a.status === 'late' ? '~' : '✗'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score history mini */}
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Recent Tests</p>
          {!scoreHistory?.length ? (
            <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.40)' }}>No tests yet</p>
          ) : (
            <div className="space-y-2">
              {scoreHistory.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.50)' }}>{formatDate(s.test_date)}</p>
                  <p className="text-[14px] font-bold" style={{ color: i === 0 ? '#1B4FD8' : '#1C1C1E' }}>{s.total_score}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payments */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Recent Payments</p>
        {!payments?.length ? (
          <div className="bg-white rounded-2xl p-5 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>No payment records</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {payments.map((p, i) => (
              <div key={p.month} className="flex items-center justify-between px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                <div>
                  <p className="text-[14px] font-semibold text-[#1C1C1E]">{p.month}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>{formatUZS(p.net_amount)}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: p.status === 'paid' ? 'rgba(52,199,89,0.12)' : p.status === 'overdue' ? 'rgba(255,59,48,0.12)' : 'rgba(255,149,0,0.12)',
                    color: p.status === 'paid' ? '#1E8A3C' : p.status === 'overdue' ? '#C0281F' : '#B86800',
                  }}>
                  {p.status === 'paid' ? 'Paid' : p.status === 'overdue' ? 'Overdue' : 'Due'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact note */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(27,79,216,0.06)', border: '1px solid rgba(27,79,216,0.12)' }}>
        <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#1B4FD8' }}>Stay updated</p>
        <p className="text-[12px]" style={{ color: 'rgba(27,79,216,0.65)' }}>
          You'll receive Telegram notifications for attendance, payments, and exam updates automatically.
        </p>
      </div>
    </div>
  )
}
