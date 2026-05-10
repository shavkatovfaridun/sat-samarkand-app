import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { daysUntil, formatUZS } from '@/lib/format'

export default async function StudentDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('name, subject, phase, exam_date, target_score, current_score, status')
    .eq('telegram_id', telegramId)
    .single()

  const { data: payment } = await supabase
    .from('payments')
    .select('status, net_amount, due_date')
    .eq('student_id', telegramId)
    .order('due_date', { ascending: false })
    .limit(1)
    .single()

  const { count: pendingHW } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .lte('due_date', new Date().toISOString().slice(0, 10))

  const examDays = student?.exam_date ? daysUntil(student.exam_date) : null
  const scoreGap = (student?.target_score && student?.current_score)
    ? student.target_score - student.current_score
    : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Hi, {student?.name?.split(' ')[0] ?? 'Student'} 👋</h1>
        <p className="text-gray-500 text-sm capitalize">{student?.subject} · {student?.phase}</p>
      </div>

      {/* Exam countdown */}
      {examDays !== null && (
        <div className="bg-gray-900 text-white rounded-xl p-4 mb-4">
          <p className="text-xs opacity-60 mb-1">SAT Exam Countdown</p>
          <p className="text-3xl font-bold">{examDays} days</p>
          {scoreGap !== null && scoreGap > 0 && (
            <p className="text-xs opacity-60 mt-1">+{scoreGap} points to target</p>
          )}
        </div>
      )}

      {/* Score card */}
      {student?.current_score && (
        <div className="bg-white rounded-xl p-4 mb-3 border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Current Score</p>
            <p className="text-2xl font-bold">{student.current_score}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Target</p>
            <p className="text-2xl font-bold text-blue-600">{student.target_score}</p>
          </div>
        </div>
      )}

      {/* Pending HW */}
      {(pendingHW ?? 0) > 0 && (
        <Link href="/student/homework" className="block bg-orange-50 border border-orange-200 rounded-xl p-4 mb-3">
          <p className="text-sm font-medium text-orange-800">📝 {pendingHW} homework set(s) due</p>
          <p className="text-xs text-orange-600 mt-0.5">Tap to submit</p>
        </Link>
      )}

      {/* Payment status */}
      {payment && (
        <Link href="/student/payments" className={`block rounded-xl p-4 mb-3 ${
          payment.status === 'paid' ? 'bg-green-50 border border-green-200' :
          payment.status === 'overdue' ? 'bg-red-50 border border-red-200' :
          'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className="text-sm font-medium">
            {payment.status === 'paid' ? '✅ Payment received' :
             payment.status === 'overdue' ? '⚠️ Payment overdue' :
             '💳 Payment due soon'}
          </p>
          <p className="text-xs mt-0.5 opacity-70">{formatUZS(payment.net_amount)}</p>
        </Link>
      )}
    </div>
  )
}
