import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

export default async function StudentHomeworkPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('telegram_id', telegramId)
    .single()

  // Get assignments for this student (either individual or via group)
  const { data: assignments } = student ? await supabase
    .from('assignments')
    .select('id, due_date, problem_ids, assigned_by, created_at')
    .or(`student_id.eq.${student.id}`)
    .order('due_date', { ascending: false })
    .limit(10) : { data: null }

  // Get submissions for this student
  const { data: submissions } = student ? await supabase
    .from('submissions')
    .select('assignment_id, score, total, submitted_at')
    .eq('student_id', student.id) : { data: null }

  const submittedIds = new Set(submissions?.map((s) => s.assignment_id))
  const submissionMap = Object.fromEntries(submissions?.map((s) => [s.assignment_id, s]) ?? [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Homework</h1>

      {!assignments?.length ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
          <p className="text-3xl mb-3">📚</p>
          No homework assigned yet.
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const submitted = submittedIds.has(a.id)
            const sub = submissionMap[a.id]
            const isOverdue = new Date(a.due_date) < new Date() && !submitted

            return (
              <div key={a.id} className={`bg-white rounded-xl p-4 border ${
                submitted ? 'border-green-200' :
                isOverdue ? 'border-red-200' :
                'border-gray-100'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.problem_ids?.length ?? 0} problems</p>
                    <p className="text-xs text-gray-400 mt-0.5">Due: {formatDate(a.due_date)}</p>
                  </div>
                  <div className="text-right">
                    {submitted ? (
                      <div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Submitted</span>
                        {sub && <p className="text-xs text-gray-500 mt-1">{sub.score}/{sub.total} correct</p>}
                      </div>
                    ) : (
                      <Link
                        href={`/student/homework/${a.id}`}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isOverdue ? 'Late — Submit' : 'Start →'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
