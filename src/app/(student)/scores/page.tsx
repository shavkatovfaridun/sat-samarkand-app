import { createClient } from '@/lib/supabase/server'
import { formatDate, daysUntil } from '@/lib/format'

export default async function StudentScoresPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, target_score, current_score, exam_date')
    .eq('telegram_id', telegramId)
    .single()

  // Get all submissions as a proxy for score history
  const { data: submissions } = student ? await supabase
    .from('submissions')
    .select('score, total, submitted_at')
    .eq('student_id', student.id)
    .order('submitted_at', { ascending: false })
    .limit(20) : { data: null }

  const examDays = student?.exam_date ? daysUntil(student.exam_date) : null
  const scoreGap = (student?.target_score && student?.current_score)
    ? student.target_score - student.current_score : null

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">My Scores</h1>

      {/* Score vs Target */}
      <div className="bg-gray-900 text-white rounded-xl p-5 mb-4">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-xs opacity-60">Current SAT Score</p>
            <p className="text-4xl font-bold">{student?.current_score ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">Target</p>
            <p className="text-4xl font-bold text-blue-300">{student?.target_score ?? '—'}</p>
          </div>
        </div>
        {scoreGap !== null && (
          <div className="bg-white/10 rounded-lg p-2 text-center">
            <p className="text-sm">+{scoreGap} points needed{examDays ? ` · ${examDays} days left` : ''}</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {student?.current_score && student?.target_score && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <p className="text-xs text-gray-500 mb-2">Progress to target</p>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, (student.current_score / student.target_score) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {Math.round((student.current_score / student.target_score) * 100)}% of target
          </p>
        </div>
      )}

      {/* Homework history */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Homework Scores</h2>
        {!submissions?.length ? (
          <p className="text-sm text-gray-400">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((s, i) => {
              const pct = s.total ? Math.round((s.score / s.total) * 100) : 0
              return (
                <div key={i} className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{formatDate(s.submitted_at)}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-sm font-medium">{s.score}/{s.total}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
