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
  const firstName = student?.name?.split(' ')[0] ?? 'Student'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium">Welcome back</p>
          <h1 className="text-2xl font-bold text-[#1A2340]">Hi, {firstName} 👋</h1>
        </div>
        <div className="text-right">
          <span className="text-xs bg-[#EEF3FF] text-[#1B4FD8] font-semibold px-3 py-1.5 rounded-full capitalize">
            {student?.subject ?? 'SAT'}
          </span>
        </div>
      </div>

      {/* Exam countdown */}
      {examDays !== null && (
        <div className="bg-[#1B4FD8] rounded-2xl p-5 mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">SAT Exam Countdown</p>
          <p className="text-5xl font-bold text-white">{examDays}</p>
          <p className="text-white/70 text-sm mt-0.5">days remaining</p>
          {scoreGap !== null && scoreGap > 0 && (
            <p className="text-white/50 text-xs mt-2">+{scoreGap} points to target score</p>
          )}
        </div>
      )}

      {/* Score card */}
      {student?.current_score && (
        <div className="bg-white rounded-2xl p-4 mb-3 border border-[#E2E8F5] shadow-card-sm flex justify-between items-center">
          <div>
            <p className="text-xs text-[#6B7B9C] font-medium mb-0.5">Current Score</p>
            <p className="text-3xl font-bold text-[#1A2340]">{student.current_score}</p>
          </div>
          <div className="w-px h-12 bg-[#E2E8F5]" />
          <div className="text-right">
            <p className="text-xs text-[#6B7B9C] font-medium mb-0.5">Target</p>
            <p className="text-3xl font-bold text-[#1B4FD8]">{student.target_score}</p>
          </div>
          <Link
            href="/student/scores"
            className="bg-[#EEF3FF] text-[#1B4FD8] text-xs font-semibold px-3 py-2 rounded-xl"
          >
            Details →
          </Link>
        </div>
      )}

      {/* Pending HW */}
      {(pendingHW ?? 0) > 0 && (
        <Link
          href="/student/homework"
          className="flex items-center gap-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-4 mb-3 active:scale-95 transition-transform"
        >
          <span className="text-2xl">📝</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">{pendingHW} homework set(s) due</p>
            <p className="text-xs text-orange-600 mt-0.5">Tap to view and submit</p>
          </div>
          <span className="text-orange-400">›</span>
        </Link>
      )}

      {/* Payment status */}
      {payment && (
        <Link
          href="/student/payments"
          className={`flex items-center gap-3 rounded-2xl p-4 mb-3 border active:scale-95 transition-transform ${
            payment.status === 'paid'
              ? 'bg-[#ECFDF5] border-[#A7F3D0]'
              : payment.status === 'overdue'
              ? 'bg-[#FEF2F2] border-[#FECACA]'
              : 'bg-[#FFFBEB] border-[#FDE68A]'
          }`}
        >
          <span className="text-2xl">
            {payment.status === 'paid' ? '✅' : payment.status === 'overdue' ? '⚠️' : '💳'}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              payment.status === 'paid' ? 'text-emerald-800'
              : payment.status === 'overdue' ? 'text-red-800'
              : 'text-amber-800'
            }`}>
              {payment.status === 'paid' ? 'Payment received'
               : payment.status === 'overdue' ? 'Payment overdue'
               : 'Payment due soon'}
            </p>
            <p className="text-xs mt-0.5 opacity-70">{formatUZS(payment.net_amount)}</p>
          </div>
          <span className="opacity-40">›</span>
        </Link>
      )}

      {!student && (
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F5] text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-[#1A2340] font-semibold">Profile not set up yet</p>
          <p className="text-[#6B7B9C] text-sm mt-1">Contact your admin to complete enrollment</p>
        </div>
      )}
    </div>
  )
}
