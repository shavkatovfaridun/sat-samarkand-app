import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

export default async function StudentHomeworkPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const telegramId = match ? parseInt(match[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, group_id')
    .eq('telegram_id', telegramId)
    .single()

  const { data: assignments } = student
    ? await supabase
        .from('assignments')
        .select('id, due_date, problem_ids, created_at')
        .or(`student_id.eq.${student.id}${student.group_id ? `,group_id.eq.${student.group_id}` : ''}`)
        .order('due_date', { ascending: false })
        .limit(20)
    : { data: null }

  const { data: submissions } = student
    ? await supabase
        .from('submissions')
        .select('assignment_id, score, total, submitted_at')
        .eq('student_id', student.id)
    : { data: null }

  const submittedIds   = new Set(submissions?.map(s => s.assignment_id))
  const submissionMap  = Object.fromEntries(submissions?.map(s => [s.assignment_id, s]) ?? [])

  const today           = new Date().toISOString().slice(0, 10)
  const todayAssignments = assignments?.filter(a => a.due_date === today) ?? []
  const pastAssignments  = assignments?.filter(a => a.due_date !== today) ?? []

  const doneCount  = submissions?.length ?? 0
  const totalCount = assignments?.length ?? 0
  const pctDone    = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Student</p>
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>My Homework</h1>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(60,60,67,0.55)' }}>Completed</p>
            <p className="text-[12px] font-bold" style={{ color: '#1B4FD8' }}>{doneCount} / {totalCount}</p>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(27,79,216,0.10)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pctDone}%`, background: '#1B4FD8' }} />
          </div>
        </div>
      )}

      {/* Today's assignments */}
      {todayAssignments.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 px-1" style={{ color: 'rgba(60,60,67,0.45)' }}>
            Due Today
          </p>
          <div className="space-y-2.5">
            {todayAssignments.map(a => {
              const submitted = submittedIds.has(a.id)
              const sub = submissionMap[a.id]
              const pct = sub?.total ? Math.round((sub.score / sub.total) * 100) : null
              const scoreColor = pct === null ? '#1B4FD8' : pct >= 70 ? '#1E8A3C' : pct >= 50 ? '#B86800' : '#C0281F'

              return (
                <div key={a.id} className="bg-white rounded-2xl p-4"
                  style={{
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                    borderLeft: submitted ? '3px solid #34C759' : '3px solid #1B4FD8',
                  }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold" style={{ color: '#1C1C1E' }}>
                        {a.problem_ids?.length ?? 0} problems
                      </p>
                      <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>
                        Due: {formatDate(a.due_date)}
                      </p>
                      {submitted && sub && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-[11px]" style={{ color: 'rgba(60,60,67,0.55)' }}>Score</p>
                            <p className="text-[11px] font-bold" style={{ color: scoreColor }}>
                              {sub.score}/{sub.total} ({pct}%)
                            </p>
                          </div>
                          <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: 'rgba(120,120,128,0.12)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: scoreColor }} />
                          </div>
                        </div>
                      )}
                    </div>
                    {submitted ? (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: 'rgba(52,199,89,0.12)', color: '#1E8A3C' }}>
                        ✓ Done
                      </span>
                    ) : (
                      <Link href={`/student/homework/${a.id}`}
                        className="text-[12px] font-bold text-white px-3 py-1.5 rounded-xl shrink-0 transition-all active:scale-95"
                        style={{ background: '#1B4FD8' }}>
                        Start →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Past assignments */}
      {pastAssignments.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 px-1" style={{ color: 'rgba(60,60,67,0.45)' }}>
            Past Assignments
          </p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {pastAssignments.map((a, i) => {
              const submitted  = submittedIds.has(a.id)
              const sub        = submissionMap[a.id]
              const isOverdue  = a.due_date < today && !submitted
              const pct        = sub?.total ? Math.round((sub.score / sub.total) * 100) : null
              const scoreColor = pct === null ? '#1B4FD8' : pct >= 70 ? '#1E8A3C' : pct >= 50 ? '#B86800' : '#C0281F'

              return (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : undefined }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>
                      {a.problem_ids?.length ?? 0} problems
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>{formatDate(a.due_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {submitted ? (
                      <div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(52,199,89,0.12)', color: '#1E8A3C' }}>
                          ✓ {sub?.score}/{sub?.total}
                        </span>
                        {pct !== null && (
                          <p className="text-[10px] mt-0.5" style={{ color: scoreColor }}>{pct}%</p>
                        )}
                      </div>
                    ) : isOverdue ? (
                      <Link href={`/student/homework/${a.id}`}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,59,48,0.10)', color: '#C0281F' }}>
                        Late – Submit
                      </Link>
                    ) : (
                      <Link href={`/student/homework/${a.id}`}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
                        Start →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!assignments?.length && (
        <div className="bg-white rounded-2xl py-14 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold mb-0.5" style={{ color: '#1C1C1E' }}>No homework yet</p>
          <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.45)' }}>Your teacher will assign problems here</p>
        </div>
      )}
    </div>
  )
}
