'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Problem = {
  id: string
  content: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  topic: string
  difficulty: string
  explanation: string | null
}

type Assignment = {
  id: string
  problem_ids: string[]
  due_date: string
  group_id: string | null
}

const OPTIONS = ['A', 'B', 'C', 'D'] as const

export default function HomeworkSubmitPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [problems, setProblems]     = useState<Problem[]>([])
  const [student, setStudent]       = useState<{ id: string } | null>(null)
  const [answers, setAnswers]       = useState<Record<string, string>>({})
  const [submitted, setSubmitted]   = useState(false)
  const [results, setResults]       = useState<Record<string, boolean>>({})
  const [score, setScore]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [current, setCurrent]       = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email ?? ''
      const match = email.match(/^tg_(\d+)@/)
      const telegramId = match ? parseInt(match[1]) : null

      const [{ data: asgn }, { data: stu }] = await Promise.all([
        supabase.from('assignments').select('id, problem_ids, due_date, group_id').eq('id', params.id).single(),
        telegramId
          ? supabase.from('students').select('id').eq('telegram_id', telegramId).single()
          : Promise.resolve({ data: null }),
      ])

      if (!asgn || !stu) { setLoading(false); return }

      setAssignment(asgn)
      setStudent(stu)

      // Check existing submission
      const { data: existing } = await supabase
        .from('submissions')
        .select('score, total, answers')
        .eq('assignment_id', params.id)
        .eq('student_id', stu.id)
        .maybeSingle()

      if (existing) {
        setAlreadyDone(true)
        setScore(existing.score)
        setLoading(false)
        return
      }

      // Load problems
      const { data: probs } = await supabase
        .from('problems')
        .select('id, content, option_a, option_b, option_c, option_d, correct_answer, topic, difficulty, explanation')
        .in('id', asgn.problem_ids)

      // Sort by problem_ids order
      const ordered = asgn.problem_ids
        .map(pid => probs?.find(p => p.id === pid))
        .filter(Boolean) as Problem[]

      setProblems(ordered)
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSubmit() {
    if (!student || !assignment || problems.length === 0) return
    setSubmitting(true)

    const res: Record<string, boolean> = {}
    let correct = 0
    for (const p of problems) {
      const isCorrect = answers[p.id]?.toLowerCase() === p.correct_answer?.toLowerCase()
      res[p.id] = isCorrect
      if (isCorrect) correct++
    }

    setResults(res)
    setScore(correct)
    setSubmitted(true)

    const supabase = createClient()
    await supabase.from('submissions').insert({
      assignment_id: assignment.id,
      student_id: student.id,
      answers,
      score: correct,
      total: problems.length,
      submitted_at: new Date().toISOString(),
    })

    setSubmitting(false)
  }

  const allAnswered = problems.length > 0 && problems.every(p => answers[p.id])
  const pct = problems.length > 0 ? Math.round((score / problems.length) * 100) : 0

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
      <div className="w-8 h-8 border-[3px] border-[#1B4FD8] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  /* ── Already submitted ── */
  if (alreadyDone) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'rgba(52,199,89,0.12)' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" style={{ color: '#34C759' }}>
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-[20px] font-bold text-[#1C1C1E] mb-1">Already submitted</h2>
      <p className="text-[14px] mb-1" style={{ color: 'rgba(60,60,67,0.55)' }}>You scored</p>
      <p className="text-[48px] font-bold tracking-tight mb-6" style={{ color: '#1B4FD8' }}>{score}</p>
      <button onClick={() => router.back()}
        className="px-8 py-3 rounded-2xl text-[15px] font-semibold text-white"
        style={{ background: '#1B4FD8' }}>
        Back to Homework
      </button>
    </div>
  )

  /* ── Results screen ── */
  if (submitted) return (
    <div className="pb-8">
      {/* Hero */}
      <div className="rounded-3xl p-6 text-center mb-4"
        style={{ background: pct >= 70 ? 'linear-gradient(135deg,#1E8A3C,#34C759)' : pct >= 50 ? 'linear-gradient(135deg,#B86800,#FF9500)' : 'linear-gradient(135deg,#C0281F,#FF3B30)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <p className="text-white/70 text-[12px] font-semibold uppercase tracking-[0.06em] mb-1">Your Score</p>
        <p className="text-[64px] font-bold text-white leading-none tracking-tight">{score}<span className="text-[32px] text-white/60">/{problems.length}</span></p>
        <p className="text-[18px] font-bold text-white/90 mt-1">{pct}%</p>
        <p className="text-white/60 text-[13px] mt-1">
          {pct >= 70 ? 'Great work!' : pct >= 50 ? 'Good effort' : 'Keep practicing'}
        </p>
      </div>

      {/* Review */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3 px-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>Review</p>
      <div className="space-y-3">
        {problems.map((p, i) => {
          const correct = results[p.id]
          const myAnswer = answers[p.id]
          return (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: correct ? '1.5px solid rgba(52,199,89,0.30)' : '1.5px solid rgba(255,59,48,0.25)' }}>
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: correct ? '#34C759' : '#FF3B30' }}>
                    {correct ? '✓' : '✗'}
                  </span>
                  <p className="text-[14px] font-medium text-[#1C1C1E] leading-snug flex-1">{i + 1}. {p.content}</p>
                </div>
              </div>
              <div className="px-4 pb-4 space-y-1.5">
                {OPTIONS.map(opt => {
                  const val = p[`option_${opt.toLowerCase()}` as keyof Problem] as string
                  const isCorrect = opt.toLowerCase() === p.correct_answer?.toLowerCase()
                  const isMine = opt.toLowerCase() === myAnswer?.toLowerCase()
                  return (
                    <div key={opt} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                      style={{ background: isCorrect ? 'rgba(52,199,89,0.10)' : isMine && !isCorrect ? 'rgba(255,59,48,0.08)' : 'rgba(120,120,128,0.06)' }}>
                      <span className="text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: isCorrect ? 'rgba(52,199,89,0.20)' : isMine && !isCorrect ? 'rgba(255,59,48,0.15)' : 'rgba(120,120,128,0.12)', color: isCorrect ? '#1E8A3C' : isMine && !isCorrect ? '#C0281F' : 'rgba(60,60,67,0.55)' }}>
                        {opt}
                      </span>
                      <p className="text-[13px] flex-1" style={{ color: isCorrect ? '#1E8A3C' : isMine && !isCorrect ? '#C0281F' : 'rgba(60,60,67,0.65)' }}>
                        {val}
                      </p>
                      {isCorrect && (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: '#34C759' }}>
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )
                })}
                {p.explanation && (
                  <div className="mt-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(27,79,216,0.06)' }}>
                    <p className="text-[12px] font-semibold mb-0.5" style={{ color: '#1B4FD8' }}>Explanation</p>
                    <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.70)' }}>{p.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={() => router.push('/student/homework')}
        className="w-full mt-6 py-4 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.97]"
        style={{ background: '#1B4FD8' }}>
        Done
      </button>
    </div>
  )

  /* ── Quiz UI ── */
  const problem = problems[current]
  const progress = (current / problems.length) * 100

  if (!problem) return null

  return (
    <div className="pb-8">
      {/* Progress bar + header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="text-[13px] font-medium" style={{ color: 'rgba(60,60,67,0.50)' }}>
            ← Back
          </button>
          <span className="text-[13px] font-semibold" style={{ color: 'rgba(60,60,67,0.55)' }}>
            {current + 1} / {problems.length}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(120,120,128,0.15)' }}>
          <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: '#1B4FD8' }} />
        </div>
      </div>

      {/* Topic chip */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
          style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
          {problem.topic || 'SAT'} · {problem.difficulty || 'medium'}
        </span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-5 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <p className="text-[16px] font-semibold text-[#1C1C1E] leading-relaxed">{problem.content}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5 mb-6">
        {OPTIONS.map(opt => {
          const val = problem[`option_${opt.toLowerCase()}` as keyof Problem] as string
          if (!val) return null
          const selected = answers[problem.id]?.toLowerCase() === opt.toLowerCase()
          return (
            <button key={opt} onClick={() => setAnswers(prev => ({ ...prev, [problem.id]: opt.toLowerCase() }))}
              className="w-full flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-all active:scale-[0.98]"
              style={{
                background: selected ? 'rgba(27,79,216,0.08)' : 'white',
                border: selected ? '2px solid #1B4FD8' : '2px solid rgba(120,120,128,0.12)',
                boxShadow: selected ? '0 0 0 4px rgba(27,79,216,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all"
                style={{ background: selected ? '#1B4FD8' : 'rgba(120,120,128,0.10)', color: selected ? 'white' : 'rgba(60,60,67,0.55)' }}>
                {opt}
              </span>
              <p className="text-[15px] flex-1" style={{ color: selected ? '#1B4FD8' : '#1C1C1E', fontWeight: selected ? 600 : 400 }}>
                {val}
              </p>
              {selected && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1B4FD8' }}>
                  <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {current > 0 && (
          <button onClick={() => setCurrent(c => c - 1)}
            className="flex-1 py-4 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.97]"
            style={{ background: 'rgba(120,120,128,0.10)', color: '#1C1C1E' }}>
            ← Previous
          </button>
        )}

        {current < problems.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)}
            disabled={!answers[problem.id]}
            className="flex-1 py-4 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ background: '#1B4FD8' }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="flex-1 py-4 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ background: allAnswered ? '#34C759' : '#1B4FD8' }}>
            {submitting ? 'Submitting…' : allAnswered ? 'Submit ✓' : `Answer all (${Object.keys(answers).length}/${problems.length})`}
          </button>
        )}
      </div>

      {/* Dot progress */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {problems.map((p, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className="rounded-full transition-all"
            style={{ width: i === current ? 20 : 6, height: 6, background: answers[p.id] ? '#34C759' : i === current ? '#1B4FD8' : 'rgba(120,120,128,0.20)' }} />
        ))}
      </div>
    </div>
  )
}
