import { createClient } from '@/lib/supabase/server'
import { formatUZS, formatDate, daysUntil } from '@/lib/format'

export default async function ParentDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, subject, phase, exam_date, target_score, current_score, status')
    .eq('parent_telegram_id', telegramId)
    .single()

  const { data: recentAttendance } = student ? await supabase
    .from('attendance')
    .select('class_date, status')
    .eq('student_id', student.id)
    .order('class_date', { ascending: false })
    .limit(10) : { data: null }

  const { data: payments } = student ? await supabase
    .from('payments')
    .select('month, status, net_amount, due_date, paid_date')
    .eq('student_id', student.id)
    .order('due_date', { ascending: false })
    .limit(3) : { data: null }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 bg-[#EEF3FF] rounded-2xl flex items-center justify-center text-3xl mb-4">👤</div>
        <p className="font-semibold text-[#1A2340]">No student linked yet</p>
        <p className="text-[#6B7B9C] text-sm mt-1">Contact admin to link your child's profile.</p>
      </div>
    )
  }

  const presentCount = recentAttendance?.filter((a) => a.status === 'present').length ?? 0
  const examDays = student.exam_date ? daysUntil(student.exam_date) : null

  return (
    <div>
      <div className="mb-6">
        <p className="text-[#6B7B9C] text-xs font-medium">Your child</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">{student.name}</h1>
        <p className="text-[#6B7B9C] text-sm capitalize mt-0.5">{student.subject} · {student.phase}</p>
      </div>

      {examDays !== null && (
        <div className="bg-[#1B4FD8] rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">SAT Exam</p>
          <p className="text-4xl font-bold text-white">{examDays}</p>
          <p className="text-white/70 text-sm">days remaining · {formatDate(student.exam_date!)}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 mb-3 border border-[#E2E8F5] flex justify-between items-center">
        <div>
          <p className="text-xs text-[#6B7B9C] font-medium">Current Score</p>
          <p className="text-2xl font-bold text-[#1A2340]">{student.current_score ?? '—'}</p>
        </div>
        <div className="w-px h-10 bg-[#E2E8F5]" />
        <div className="text-right">
          <p className="text-xs text-[#6B7B9C] font-medium">Target</p>
          <p className="text-2xl font-bold text-[#1B4FD8]">{student.target_score ?? '—'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-3 border border-[#E2E8F5]">
        <p className="text-xs text-[#6B7B9C] font-medium mb-3">Recent Attendance (last 10 classes)</p>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-2xl font-bold text-[#1A2340]">{presentCount}<span className="text-sm text-[#6B7B9C] font-normal">/10</span></p>
          <p className="text-xs text-[#6B7B9C]">classes attended</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {recentAttendance?.map((a) => (
            <span
              key={a.class_date}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                a.status === 'present' ? 'bg-[#ECFDF5] text-emerald-700' :
                a.status === 'late' ? 'bg-[#FFFBEB] text-amber-700' :
                'bg-[#FEF2F2] text-red-700'
              }`}
              title={`${a.class_date}: ${a.status}`}
            >
              {a.status === 'present' ? '✓' : a.status === 'late' ? '~' : '✗'}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#E2E8F5]">
        <p className="text-xs text-[#6B7B9C] font-medium mb-3">Recent Payments</p>
        <div className="space-y-2.5">
          {payments?.map((p) => (
            <div key={p.month} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-[#1A2340]">{p.month}</p>
                <p className="text-xs text-[#6B7B9C]">{formatUZS(p.net_amount)}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                p.status === 'paid' ? 'bg-[#ECFDF5] text-emerald-700' :
                p.status === 'overdue' ? 'bg-[#FEF2F2] text-red-700' :
                'bg-[#FFFBEB] text-amber-700'
              }`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
