import { createClient } from '@/lib/supabase/server'
import { formatDate, daysUntil } from '@/lib/format'

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  official:   { bg: 'rgba(27,79,216,0.10)',   color: '#1B4FD8' },
  practice:   { bg: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.55)' },
  diagnostic: { bg: 'rgba(175,82,222,0.10)',  color: '#AF52DE' },
}

function ScoreChart({ scores, target }: { scores: number[]; target: number | null }) {
  if (scores.length < 2) return null

  const MIN_SCORE = 400
  const MAX_SCORE = Math.max(target ?? 1600, ...scores) + 50
  const W = 300
  const H = 80
  const PAD = 8

  const pts = scores.map((s, i) => {
    const x = PAD + (i / (scores.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((s - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * (H - PAD * 2)
    return { x, y, s }
  })

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const area = `M${pts[0].x},${H} L${pts.map(p => `${p.x},${p.y}`).join(' L')} L${pts[pts.length - 1].x},${H} Z`

  const targetY = target
    ? H - PAD - ((target - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * (H - PAD * 2)
    : null

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1B4FD8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1B4FD8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Target line */}
        {targetY !== null && (
          <>
            <line x1={PAD} y1={targetY} x2={W - PAD} y2={targetY}
              stroke="rgba(52,199,89,0.50)" strokeWidth="1" strokeDasharray="4 3" />
            <text x={W - PAD} y={targetY - 3} textAnchor="end"
              fontSize="9" fill="rgba(52,199,89,0.70)" fontWeight="600">target</text>
          </>
        )}
        {/* Area */}
        <path d={area} fill="url(#scoreGrad)" />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke="#1B4FD8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* Dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#1B4FD8" />
            <circle cx={p.x} cy={p.y} r="2" fill="white" />
          </g>
        ))}
        {/* First + last labels */}
        {[pts[0], pts[pts.length - 1]].map((p, i) => (
          <text key={i} x={p.x} y={p.y - 8} textAnchor="middle"
            fontSize="10" fill="#1B4FD8" fontWeight="700">{p.s}</text>
        ))}
      </svg>
    </div>
  )
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
      ? supabase.from('score_history').select('*').eq('student_id', student.id).order('test_date', { ascending: true })
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

  const sortedDesc = scoreHistory ? [...scoreHistory].reverse() : []
  const bestScore = sortedDesc.reduce<(typeof sortedDesc)[0] | null>(
    (best, s) => (s.total_score > (best?.total_score ?? 0) ? s : best), null
  )
  const improvement = scoreHistory && scoreHistory.length >= 2
    ? scoreHistory[scoreHistory.length - 1].total_score - scoreHistory[0].total_score
    : null

  const chartScores = scoreHistory?.map(s => s.total_score) ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>Progress</p>
        <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>My Scores</h1>
      </div>

      {/* Hero card */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1340B0 0%,#1B4FD8 60%,#2563EB 100%)', boxShadow: '0 8px 32px rgba(27,79,216,0.28)' }}>
        <div className="relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="p-5 pb-4">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50 mb-1">Current Score</p>
                <p className="text-[52px] font-bold text-white leading-none tracking-tight">
                  {student?.current_score ?? '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50 mb-1">Target</p>
                <p className="text-[32px] font-bold text-white/70 leading-none">{student?.target_score ?? '—'}</p>
                {examDays !== null && (
                  <p className="text-[12px] font-medium text-white/40 mt-1">{examDays}d left</p>
                )}
              </div>
            </div>
            {student?.current_score && student?.target_score && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  {scoreGap && scoreGap > 0
                    ? <p className="text-[12px] font-medium text-white/50">+{scoreGap} to target</p>
                    : <p className="text-[12px] font-medium text-white/50">Target reached!</p>}
                  <p className="text-[12px] font-bold text-white/70">{progressPct}%</p>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.70)' }} />
                </div>
              </div>
            )}
          </div>
        </div>
        {student?.exam_date && (
          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.10)', background: 'rgba(0,0,0,0.10)' }}>
            <span className="text-[13px] font-medium text-white/60">SAT Exam</span>
            <span className="text-[13px] font-bold text-white/80">{formatDate(student.exam_date)}</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      {sortedDesc.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Tests', value: sortedDesc.length, color: '#1C1C1E' },
            { label: 'Best',  value: bestScore?.total_score ?? '—', color: '#1B4FD8' },
            {
              label: 'Growth',
              value: improvement !== null ? (improvement > 0 ? `+${improvement}` : String(improvement)) : '—',
              color: improvement && improvement > 0 ? '#34C759' : 'rgba(60,60,67,0.55)',
            },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[22px] font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartScores.length >= 2 && (
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: 'rgba(60,60,67,0.45)' }}>Score Trend</p>
          <ScoreChart scores={chartScores} target={student?.target_score ?? null} />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: '#1B4FD8' }} />
              <span className="text-[10px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 border-t border-dashed" style={{ borderColor: 'rgba(52,199,89,0.60)' }} />
              <span className="text-[10px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Target</span>
            </div>
          </div>
        </div>
      )}

      {/* Score history list */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
          History
        </p>
        {!sortedDesc.length ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'rgba(27,79,216,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" style={{ color: '#1B4FD8' }}>
                <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-bold text-[#1C1C1E] text-[15px] mb-1">No test scores yet</p>
            <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Your teacher will log scores after each test</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {sortedDesc.map((s, i) => {
              const ts = TYPE_STYLES[s.test_type] ?? TYPE_STYLES.practice
              const isLatest = i === 0
              return (
                <div key={s.id}
                  className="px-4 py-4"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-[22px] font-bold tracking-tight leading-none" style={{ color: isLatest ? '#1B4FD8' : '#1C1C1E' }}>
                          {s.total_score}
                        </p>
                        {isLatest && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
                            Latest
                          </span>
                        )}
                      </div>
                      {(s.math_score || s.reading_score) && (
                        <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.50)' }}>
                          {s.math_score ? `Math: ${s.math_score}` : ''}
                          {s.math_score && s.reading_score ? ' · ' : ''}
                          {s.reading_score ? `R&W: ${s.reading_score}` : ''}
                        </p>
                      )}
                      {s.notes && (
                        <p className="text-[11px] mt-0.5 italic" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.notes}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-block capitalize"
                        style={{ background: ts.bg, color: ts.color }}>
                        {s.test_type}
                      </span>
                      <p className="text-[11px] mt-1" style={{ color: 'rgba(60,60,67,0.40)' }}>{formatDate(s.test_date)}</p>
                    </div>
                  </div>
                  {/* Progress toward target */}
                  {student?.target_score && (
                    <div className="mt-3 w-full rounded-full h-1.5" style={{ background: 'rgba(120,120,128,0.10)' }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.round(((s.total_score - 400) / (student.target_score - 400)) * 100))}%`,
                          background: isLatest ? '#1B4FD8' : 'rgba(120,120,128,0.35)',
                        }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Homework history */}
      {submissions && submissions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
            Homework History
          </p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {submissions.map((s, i) => {
              const pct = s.total ? Math.round((s.score / s.total) * 100) : 0
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                  <p className="text-[12px] w-20 shrink-0" style={{ color: 'rgba(60,60,67,0.50)' }}>{formatDate(s.submitted_at)}</p>
                  <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(120,120,128,0.10)' }}>
                    <div className="h-1.5 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 70 ? '#34C759' : pct >= 50 ? '#FF9500' : '#FF3B30',
                      }} />
                  </div>
                  <p className="text-[12px] font-semibold w-12 text-right shrink-0" style={{ color: '#1C1C1E' }}>{s.score}/{s.total}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
