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

  const submittedIds = new Set(submissions?.map((s) => s.assignment_id))
  const submissionMap = Object.fromEntries(submissions?.map((s) => [s.assignment_id, s]) ?? [])

  const today = new Date().toISOString().slice(0, 10)
  const todayAssignments = assignments?.filter(a => a.due_date === today) ?? []
  const pastAssignments = assignments?.filter(a => a.due_date !== today) ?? []

  const doneCount = submissions?.length ?? 0
  const totalCount = assignments?.length ?? 0

  return (
    <div>
      <div className="mb-5">
        <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Homework</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">My Homework</h1>
      </div>

      {/* Stats bar */}
      {totalCount > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F5] mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[#6B7B9C]">Completed</p>
            <p className="text-xs font-bold text-[#1B4FD8]">{doneCount} / {totalCount}</p>
          </div>
          <div className="w-full bg-[#EEF3FF] rounded-full h-2.5">
            <div className="bg-[#1B4FD8] h-2.5 rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%` }} />
          </div>
        </div>
      )}

      {/* Today's assignments */}
      {todayAssignments.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-2">Due Today</p>
          <div className="space-y-2">
            {todayAssignments.map((a) => {
              const submitted = submittedIds.has(a.id)
              const sub = submissionMap[a.id]
              const pct = sub?.total ? Math.round((sub.score / sub.total) * 100) : null
              return (
                <div key={a.id} className={`bg-white rounded-2xl p-4 border ${submitted ? 'border-[#A7F3D0]' : 'border-[#C7D7FA]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-[#1A2340]">{a.problem_ids?.length ?? 0} problems</p>
                      <p className="text-xs text-[#6B7B9C] mt-0.5">Due: {formatDate(a.due_date)}</p>
                      {submitted && sub && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-[#6B7B9C]">Score</p>
                            <p className="text-xs font-bold text-[#1B4FD8]">{sub.score}/{sub.total} ({pct}%)</p>
                          </div>
                          <div className="w-full bg-[#EEF3FF] rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct && pct >= 70 ? 'bg-emerald-500' : pct && pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    {submitted ? (
                      <span className="text-xs bg-[#ECFDF5] text-emerald-700 px-2.5 py-1 rounded-full font-semibold shrink-0">✓ Done</span>
                    ) : (
                      <Link href={`/student/homework/${a.id}`}
                        className="text-xs bg-[#1B4FD8] text-white px-3 py-1.5 rounded-xl font-semibold shrink-0 active:scale-95 transition-transform">
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
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-2">Past Assignments</p>
          <div className="bg-white rounded-2xl border border-[#E2E8F5] divide-y divide-[#F5F7FF]">
            {pastAssignments.map((a) => {
              const submitted = submittedIds.has(a.id)
              const sub = submissionMap[a.id]
              const isOverdue = a.due_date < today && !submitted
              const pct = sub?.total ? Math.round((sub.score / sub.total) * 100) : null
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2340]">{a.problem_ids?.length ?? 0} problems</p>
                    <p className="text-xs text-[#6B7B9C] mt-0.5">{formatDate(a.due_date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {submitted ? (
                      <div>
                        <span className="text-[10px] bg-[#ECFDF5] text-emerald-700 px-2 py-0.5 rounded-full font-semibold">✓ {sub?.score}/{sub?.total}</span>
                        {pct !== null && (
                          <p className="text-[10px] text-[#6B7B9C] mt-0.5">{pct}%</p>
                        )}
                      </div>
                    ) : isOverdue ? (
                      <Link href={`/student/homework/${a.id}`}
                        className="text-[10px] bg-[#FEF2F2] text-red-700 px-2 py-0.5 rounded-full font-semibold">
                        Late – Submit
                      </Link>
                    ) : (
                      <Link href={`/student/homework/${a.id}`}
                        className="text-[10px] bg-[#EEF3FF] text-[#1B4FD8] px-2 py-0.5 rounded-full font-semibold">
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
        <div className="bg-white rounded-2xl p-8 border border-[#E2E8F5] text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-[#1A2340] font-semibold mb-1">No homework yet</p>
          <p className="text-[#6B7B9C] text-sm">Your teacher will assign problems here</p>
        </div>
      )}
    </div>
  )
}
