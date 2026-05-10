import { createClient } from '@/lib/supabase/server'
import { formatUZS, formatDate, daysUntil } from '@/lib/format'

export default async function ParentDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  // Parent sees their child's data via parent_telegram_id field
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
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">👤</p>
        <p className="text-sm">No student linked to your account yet.</p>
        <p className="text-xs mt-1">Contact admin to link your child.</p>
      </div>
    )
  }

  const presentCount = recentAttendance?.filter((a) => a.status === 'present').length ?? 0
  const examDays = student.exam_date ? daysUntil(student.exam_date) : null

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">{student.name}</h1>
      <p className="text-gray-500 text-sm capitalize mb-6">{student.subject} · {student.phase}</p>

      {/* Exam countdown */}
      {examDays !== null && (
        <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
          <p className="text-xs opacity-60 mb-1">SAT Exam</p>
          <p className="text-2xl font-bold">{examDays} days left</p>
          <p className="text-xs opacity-50 mt-1">{formatDate(student.exam_date!)}</p>
        </div>
      )}

      {/* Scores */}
      <div className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex justify-between">
        <div>
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-xl font-bold">{student.current_score ?? '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Target</p>
          <p className="text-xl font-bold text-blue-600">{student.target_score ?? '—'}</p>
        </div>
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Recent Attendance (last 10 classes)</p>
        <p className="text-lg font-bold">{presentCount}/10 present</p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {recentAttendance?.map((a) => (
            <span
              key={a.class_date}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                a.status === 'present' ? 'bg-green-100 text-green-700' :
                a.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}
              title={`${a.class_date}: ${a.status}`}
            >
              {a.status === 'present' ? '✓' : a.status === 'late' ? '~' : '✗'}
            </span>
          ))}
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Payments</p>
        <div className="space-y-2">
          {payments?.map((p) => (
            <div key={p.month} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{p.month}</p>
                <p className="text-xs text-gray-400">{formatUZS(p.net_amount)}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                p.status === 'paid' ? 'bg-green-100 text-green-700' :
                p.status === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
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
