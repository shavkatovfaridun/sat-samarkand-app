
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { daysUntil, formatUZS } from '@/lib/format'

export default async function StudentDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const telegramId = match ? parseInt(match[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, subject, phase, exam_date, target_score, current_score, status, group_id')
    .eq('telegram_id', telegramId)
    .single()

  const [{ data: payment }, { data: pendingAssignments }] = await Promise.all([
    supabase.from('payments').select('status, net_amount, due_date, month')
      .eq('student_id', student?.id ?? '')
      .in('status', ['unpaid', 'overdue', 'paid'])
      .order('due_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    student
      ? supabase.from('assignments').select('id').or(`student_id.eq.${student.id}${student.group_id ? `,group_id.eq.${student.group_id}` : ''}`).lte('due_date', new Date().toISOString().slice(0, 10))
      : Promise.resolve({ data: null }),
  ])

  const examDays  = student?.exam_date ? daysUntil(student.exam_date) : null
  const scoreGap  = student?.target_score && student?.current_score ? student.target_score - student.current_score : null
  const progressPct = student?.current_score && student?.target_score
    ? Math.min(100, Math.round(((student.current_score - 400) / (student.target_score - 400)) * 100)) : 0
  const firstName = student?.name?.split(' ')[0] ?? 'Student'
  const pendingHW = pendingAssignments?.length ?? 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-3">
      {/* Greeting */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <div>
          <p className="text-[13px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>{greeting}</p>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>{firstName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {student?.subject && (
            <span className="text-[12px] font-semibold px-3 py-1.5 rounded-full capitalize"
              style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
              {student.subject}
            </span>
          )}
        </div>
      </div>

      {/* Hero — Exam countdown + Score */}
      {student ? (
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1340B0 0%, #1B4FD8 60%, #2563EB 100%)', boxShadow: '0 8px 32px rgba(27,79,216,0.30)' }}>
          {/* Decorative circle */}
          <div className="relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />

            <div className="relative p-5 pb-4">
              {/* Top row */}
              <div className="flex items-start justify-between mb-5">
                {/* Current score */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50 mb-1">Current Score</p>
                  <p className="text-[52px] font-bold text-white leading-none tracking-tight">
                    {student.current_score ?? '—'}
                  </p>
                </div>
                {/* Target + days */}
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50 mb-1">Target</p>
                  <p className="text-[32px] font-bold text-white/70 leading-none tracking-tight">{student.target_score ?? '—'}</p>
                  {examDays !== null && (
                    <p className="text-[12px] font-medium text-white/40 mt-1">{examDays}d left</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {student.current_score && student.target_score && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {scoreGap !== null && scoreGap > 0 ? (
                      <p className="text-[12px] font-medium text-white/50">+{scoreGap} to target</p>
                    ) : (
                      <p className="text-[12px] font-medium text-white/50">Target reached!</p>
                    )}
                    <p className="text-[12px] font-bold text-white/70">{progressPct}%</p>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.70)' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom link */}
          <Link href="/student/scores"
            className="flex items-center justify-between px-5 py-3.5 transition-all active:opacity-70"
            style={{ borderTop: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.10)' }}>
            <span className="text-[13px] font-medium text-white/70">View score history</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 text-center" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" style={{ color: '#1B4FD8' }} stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">Profile not set up</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.55)' }}>Contact your admin to complete enrollment</p>
        </div>
      )}

      {/* Notification cards */}
      {pendingHW > 0 && (
        <Link href="/student/homework"
          className="flex items-center gap-4 bg-white rounded-2xl p-4 transition-all active:scale-[0.98]"
          style={{ boxShadow: '0 2px 12px rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.20)' }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,149,0,0.12)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="#FF9500" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[#1C1C1E]">{pendingHW} homework assignment{pendingHW > 1 ? 's' : ''} due</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>Tap to view and submit</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0" style={{ color: 'rgba(60,60,67,0.25)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      {payment && (
        <Link href="/student/payments"
          className="flex items-center gap-4 bg-white rounded-2xl p-4 transition-all active:scale-[0.98]"
          style={{
            boxShadow: payment.status === 'overdue' ? '0 2px 12px rgba(255,59,48,0.10)' : '0 2px 8px rgba(0,0,0,0.05)',
            border: payment.status === 'overdue' ? '1px solid rgba(255,59,48,0.20)' : '1px solid rgba(0,0,0,0.05)',
          }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: payment.status === 'paid' ? 'rgba(52,199,89,0.12)' : payment.status === 'overdue' ? 'rgba(255,59,48,0.10)' : 'rgba(255,149,0,0.10)' }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth="1.8"
              stroke={payment.status === 'paid' ? '#34C759' : payment.status === 'overdue' ? '#FF3B30' : '#FF9500'}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[#1C1C1E]">
              {payment.status === 'paid' ? 'Payment received' : payment.status === 'overdue' ? 'Payment overdue' : 'Payment due soon'}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>{formatUZS(payment.net_amount)}</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0" style={{ color: 'rgba(60,60,67,0.25)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      {/* Quick actions grid */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2.5 px-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>Quick Access</p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { href: '/student/scores',     label: 'My Scores',    sub: 'Test history',   color: '#1B4FD8', bg: 'rgba(27,79,216,0.08)',  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" /></svg> },
            { href: '/student/vocab',      label: 'Vocab Quiz',   sub: 'Daily words',    color: '#AF52DE', bg: 'rgba(175,82,222,0.10)',  icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" /></svg> },
            { href: '/student/attendance', label: 'Attendance',   sub: 'Class records',  color: '#34C759', bg: 'rgba(52,199,89,0.10)',   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" /></svg> },
            { href: '/student/homework',   label: 'Homework',     sub: 'Assignments',    color: '#FF9500', bg: 'rgba(255,149,0,0.10)',   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM9.75 14.25a.75.75 0 000 1.5H15a.75.75 0 000-1.5H9.75zm.75-3a.75.75 0 01.75-.75H15a.75.75 0 010 1.5h-3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /><path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" /></svg> },
            { href: '/student/payments',   label: 'Payments',     sub: 'Billing status', color: '#FF3B30', bg: 'rgba(255,59,48,0.08)',   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" /><path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" /></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="bg-white rounded-2xl p-4 flex items-start gap-3 transition-all active:scale-[0.97]"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: item.bg, color: item.color }}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#1C1C1E] leading-snug">{item.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
