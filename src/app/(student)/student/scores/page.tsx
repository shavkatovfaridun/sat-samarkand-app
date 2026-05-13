import { createClient } from '@/lib/supabase/server'
import { formatDate, daysUntil } from '@/lib/format'

const TYPE_STYLES: Record<string, string> = {
  official:   'bg-[#EEF3FF] text-[#1B4FD8]',
  practice:   'bg-[#F5F7FF] text-[#6B7B9C]',
  diagnostic: 'bg-[#F5F3FF] text-violet-700',
}

export default async function StudentScoresPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const telegramId = match ? parseInt(match[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, target_score, current_score, exam_date')
    .eq('telegram_id', telegramId)
    .single()

  const [{ data: scoreHistory }, { data: submissions }] = await Promise.all([
    student
      ? supabase.from('score_history').select('*').eq('student_id', student.id).order('test_date', { ascending: false })
      : Promise.resolve({ data: null }),
    student
      ? supabase.from('submissions').select('score, total, submitted_at').eq('student_id', student.id).order('submitted_at', { ascending: false }).limit(15)
      : Promise.resolve({ data: null }),
  ])

  const examDays = student?.exam_date ? daysUntil(student.exam_date) : null
  const scoreGap = student?.target_score && student?.current_score
    ? student.target_score - student.current_score : null
  const progressPct = student?.current_score && student?.target_score
    ? Math.min(100, Math.round(((student.current_score - 400) / (student.target_score - 400)) * 100))
    : 0

  const bestScore = scoreHistory?.reduce((best, s) => s.total_score > (best?.total_score ?? 0) ? s : best, scoreHistory[0])
  const improvement = scoreHistory && scoreHistory.length >= 2
    ? scoreHistory[0].total_score - scoreHistory[scoreHistory.length - 1].total_score
    : null

  return (
    <div>
      <div className="mb-5">
        <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Progress</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">My Scores</h1>
      </div>

      {/* Hero score card */}
      <div className="bg-[#1B4FD8] rounded-2xl p-5 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">Current Score</p>
            <p className="text-5xl font-bold text-white">{student?.current_score ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">Target</p>
            <p className="text-5xl font-bold text-white/60">{student?.target_score ?? '—'}</p>
          </div>
        </div>
        {scoreGap !== null && scoreGap > 0 && (
          <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center justify-between">
            <span className="text-white/80 text-sm">+{scoreGap} points to target</span>
            {examDays !== null && (
              <span className="text-white/60 text-sm">{examDays} days left</span>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {student?.current_score && student?.target_score && (
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F5] mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[#6B7B9C]">Progress to target</p>
            <p className="text-xs font-bold text-[#1B4FD8]">{progressPct}%</p>
          </div>
          <div className="w-full bg-[#EEF3FF] rounded-full h-3">
            <div className="bg-[#1B4FD8] h-3 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* Stats row */}
      {scoreHistory && scoreHistory.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-2xl p-3 border border-[#E2E8F5] text-center">
            <p className="text-xs text-[#6B7B9C] mb-0.5">Tests taken</p>
            <p className="font-bold text-[#1A2340]">{scoreHistory.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-[#E2E8F5] text-center">
            <p className="text-xs text-[#6B7B9C] mb-0.5">Best score</p>
            <p className="font-bold text-[#1B4FD8]">{bestScore?.total_score ?? '—'}</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-[#E2E8F5] text-center">
            <p className="text-xs text-[#6B7B9C] mb-0.5">Improvement</p>
            <p className={`font-bold ${improvement && improvement > 0 ? 'text-emerald-600' : 'text-[#6B7B9C]'}`}>
              {improvement !== null ? (improvement > 0 ? `+${improvement}` : improvement) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Score history */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Score History</p>
        {!scoreHistory?.length ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-[#6B7B9C] text-sm">No test scores yet</p>
            <p className="text-[#6B7B9C] text-xs mt-1">Your teacher will log scores after each test</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scoreHistory.map((s, i) => (
              <div key={s.id} className={`rounded-xl p-3 ${i === 0 ? 'bg-[#EEF3FF] border border-[#C7D7FA]' : 'bg-[#F5F7FF]'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-[#1A2340] text-lg">{s.total_score}</p>
                      {i === 0 && <span className="text-[10px] font-bold text-[#1B4FD8] bg-white px-2 py-0.5 rounded-full">Latest</span>}
                    </div>
                    {(s.math_score || s.reading_score) && (
                      <p className="text-xs text-[#6B7B9C]">
                        {s.math_score ? `Math: ${s.math_score}` : ''}
                        {s.math_score && s.reading_score ? ' · ' : ''}
                        {s.reading_score ? `R&W: ${s.reading_score}` : ''}
                      </p>
                    )}
                    {s.notes && <p className="text-xs text-[#6B7B9C] mt-0.5 italic">{s.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${TYPE_STYLES[s.test_type] ?? TYPE_STYLES.practice}`}>
                      {s.test_type}
                    </span>
                    <p className="text-xs text-[#6B7B9C] mt-1">{formatDate(s.test_date)}</p>
                  </div>
                </div>
                {/* Mini progress bar */}
                {student?.target_score && (
                  <div className="mt-2 w-full bg-white rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${i === 0 ? 'bg-[#1B4FD8]' : 'bg-[#6B7B9C]/40'}`}
                      style={{ width: `${Math.min(100, Math.round((s.total_score / student.target_score) * 100))}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Homework submissions */}
      {submissions && submissions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Homework History</p>
          <div className="space-y-2">
            {submissions.map((s, i) => {
              const pct = s.total ? Math.round((s.score / s.total) * 100) : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <p className="text-xs text-[#6B7B9C] w-20 shrink-0">{formatDate(s.submitted_at)}</p>
                  <div className="flex-1 bg-[#F5F7FF] rounded-full h-2">
                    <div className={`h-2 rounded-full ${pct >= 70 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-[#1A2340] w-12 text-right shrink-0">{s.score}/{s.total}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
