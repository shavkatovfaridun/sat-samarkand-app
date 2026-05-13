'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Word = {
  id: string
  word: string
  definition: string
  example: string | null
  part_of_speech: string | null
  difficulty: string
}

type Progress = {
  word_id: string
  correct_count: number
  wrong_count: number
  mastered: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildOptions(words: Word[], correctWord: Word): Word[] {
  const others = shuffle(words.filter(w => w.id !== correctWord.id)).slice(0, 3)
  return shuffle([correctWord, ...others])
}

const DIFF_COLOR: Record<string, string> = {
  easy: '#1E8A3C', medium: '#B86800', hard: '#C0281F',
}
const DIFF_BG: Record<string, string> = {
  easy: 'rgba(52,199,89,0.12)', medium: 'rgba(255,149,0,0.12)', hard: 'rgba(255,59,48,0.12)',
}
const POS_ABBR: Record<string, string> = {
  noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.',
}

const SESSION_SIZE = 10

export default function VocabQuiz({
  words,
  progress,
  studentId,
}: {
  words: Word[]
  progress: Progress[]
  studentId: string
}) {
  const router = useRouter()
  const progressMap = Object.fromEntries(progress.map(p => [p.word_id, p]))

  // Prioritise un-seen and not-mastered words, then mastered as fallback
  const unseen   = words.filter(w => !progressMap[w.id])
  const learning = words.filter(w => progressMap[w.id] && !progressMap[w.id].mastered)
  const mastered = words.filter(w => progressMap[w.id]?.mastered)

  const pool = shuffle([...unseen, ...learning, ...mastered]).slice(0, SESSION_SIZE)

  const masteredCount = mastered.length
  const learnedPct    = words.length > 0 ? Math.round((masteredCount / words.length) * 100) : 0

  const [current, setCurrent]   = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [scores, setScores]     = useState<boolean[]>([])
  const [done, setDone]         = useState(false)
  const [saving, setSaving]     = useState(false)

  // Pre-build option sets for each question
  const [optionSets] = useState(() =>
    pool.map(word => ({
      word,
      options: words.length >= 4 ? buildOptions(words, word) : [word],
    }))
  )

  if (pool.length === 0) {
    return (
      <div className="space-y-4">
        <div className="pt-1">
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Student</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Vocab Quiz</h1>
        </div>
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
          </div>
          <p className="font-bold text-[16px] mb-1" style={{ color: '#1C1C1E' }}>No words yet</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Your teacher will add vocab words soon</p>
        </div>
      </div>
    )
  }

  async function saveProgress(sessionScores: boolean[]) {
    setSaving(true)
    const supabase = createClient()
    await Promise.all(
      pool.map((word, i) => {
        const correct = sessionScores[i]
        const prev = progressMap[word.id]
        return supabase.from('vocab_progress').upsert({
          student_id:    studentId,
          word_id:       word.id,
          correct_count: (prev?.correct_count ?? 0) + (correct ? 1 : 0),
          wrong_count:   (prev?.wrong_count   ?? 0) + (correct ? 0 : 1),
          last_seen:     new Date().toISOString(),
          mastered:      ((prev?.correct_count ?? 0) + (correct ? 1 : 0)) >= 3,
        }, { onConflict: 'student_id,word_id' })
      })
    )
    setSaving(false)
  }

  function handleSelect(optionWord: Word) {
    if (revealed) return
    const correct = optionWord.id === optionSets[current].word.id
    setSelected(optionWord.id)
    setRevealed(true)
    const next = [...scores, correct]
    setScores(next)
    if (current === pool.length - 1) {
      saveProgress(next).then(() => setDone(true))
    }
  }

  function handleNext() {
    if (current < pool.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  const isLast      = current === pool.length - 1
  const sessionPct  = pool.length > 0 ? Math.round((scores.filter(Boolean).length / pool.length) * 100) : 0

  /* ── Done screen ── */
  if (done) {
    const correct = scores.filter(Boolean).length
    const pct     = Math.round((correct / pool.length) * 100)
    const grad    = pct >= 70 ? 'linear-gradient(135deg,#1E8A3C,#34C759)' : pct >= 50 ? 'linear-gradient(135deg,#B86800,#FF9500)' : 'linear-gradient(135deg,#C0281F,#FF3B30)'

    return (
      <div className="space-y-4 pb-8">
        <div className="pt-1">
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Student</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Vocab Quiz</h1>
        </div>

        {/* Score card */}
        <div className="rounded-3xl p-6 text-center relative overflow-hidden"
          style={{ background: grad, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Quiz Complete</p>
          <p className="text-[64px] font-bold text-white leading-none tracking-tight">
            {correct}<span className="text-[32px] text-white/60">/{pool.length}</span>
          </p>
          <p className="text-[18px] font-bold text-white/90 mt-1">{pct}%</p>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
            {pct >= 70 ? 'Excellent work!' : pct >= 50 ? 'Good effort — keep going!' : 'Keep practicing!'}
          </p>
        </div>

        {/* Vocab progress */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Overall Progress</p>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.55)' }}>Words mastered</p>
            <p className="text-[13px] font-bold" style={{ color: '#1B4FD8' }}>{masteredCount} / {words.length}</p>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(27,79,216,0.10)' }}>
            <div className="h-full rounded-full" style={{ width: `${learnedPct}%`, background: '#1B4FD8' }} />
          </div>
        </div>

        {/* Review */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] px-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>Review</p>
        <div className="space-y-2.5">
          {pool.map((word, i) => {
            const correct = scores[i]
            return (
              <div key={word.id} className="bg-white rounded-2xl p-4 flex items-start gap-3"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderLeft: `3px solid ${correct ? '#34C759' : '#FF3B30'}` }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                  style={{ background: correct ? '#34C759' : '#FF3B30' }}>
                  {correct ? '✓' : '✗'}
                </span>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: '#1C1C1E' }}>{word.word}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>{word.definition}</p>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={() => router.push('/student/vocab')}
          className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          Done
        </button>
      </div>
    )
  }

  /* ── Quiz screen ── */
  const { word, options } = optionSets[current]
  const progress2 = (current / pool.length) * 100
  const pos        = POS_ABBR[word.part_of_speech ?? ''] ?? word.part_of_speech ?? ''

  return (
    <div className="pb-8 space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Student</p>
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Vocab Quiz</h1>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold" style={{ color: 'rgba(60,60,67,0.50)' }}>
            {current + 1} / {pool.length}
          </span>
          <span className="text-[12px] font-semibold" style={{ color: '#34C759' }}>
            {scores.filter(Boolean).length} correct
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(120,120,128,0.15)' }}>
          <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress2}%`, background: '#1B4FD8' }} />
        </div>
      </div>

      {/* Word card */}
      <div className="rounded-3xl p-6 relative overflow-hidden text-center"
        style={{ background: 'linear-gradient(135deg,#1340B0,#1B4FD8,#2563EB)', boxShadow: '0 8px 32px rgba(27,79,216,0.28)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Which definition matches?
        </p>
        <p className="text-[40px] font-bold text-white leading-tight tracking-tight">{word.word}</p>
        {pos && (
          <p className="text-[13px] mt-1 italic" style={{ color: 'rgba(255,255,255,0.50)' }}>{pos}</p>
        )}
        <span className="inline-block mt-3 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.80)' }}>
          {word.difficulty}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {options.map(opt => {
          const isCorrect  = opt.id === word.id
          const isSelected = opt.id === selected
          let bg      = 'white'
          let border  = '2px solid rgba(120,120,128,0.12)'
          let textCol = '#1C1C1E'
          if (revealed && isCorrect) {
            bg = 'rgba(52,199,89,0.08)'; border = '2px solid rgba(52,199,89,0.40)'; textCol = '#1E8A3C'
          } else if (revealed && isSelected && !isCorrect) {
            bg = 'rgba(255,59,48,0.06)'; border = '2px solid rgba(255,59,48,0.30)'; textCol = '#C0281F'
          } else if (!revealed && isSelected) {
            bg = 'rgba(27,79,216,0.06)'; border = '2px solid #1B4FD8'
          }
          return (
            <button key={opt.id} onClick={() => handleSelect(opt)}
              className="w-full text-left px-4 py-3.5 rounded-2xl transition-all"
              style={{ background: bg, border, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p className="text-[14px] leading-snug font-medium" style={{ color: textCol }}>{opt.definition}</p>
            </button>
          )
        })}
      </div>

      {/* Example sentence shown after reveal */}
      {revealed && word.example && (
        <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(27,79,216,0.06)' }}>
          <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#1B4FD8' }}>Example</p>
          <p className="text-[13px] italic" style={{ color: 'rgba(60,60,67,0.70)' }}>"{word.example}"</p>
        </div>
      )}

      {/* Next / Submit */}
      {revealed && (
        isLast ? (
          <button
            disabled={saving}
            className="w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: '#34C759' }}>
            {saving ? 'Saving…' : 'See Results ✓'}
          </button>
        ) : (
          <button onClick={handleNext}
            className="w-full py-4 rounded-2xl text-[15px] font-bold text-white transition-all active:scale-[0.97]"
            style={{ background: '#1B4FD8' }}>
            Next →
          </button>
        )
      )}

      {/* Overall progress bar */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-semibold" style={{ color: 'rgba(60,60,67,0.55)' }}>Words mastered</p>
          <p className="text-[12px] font-bold" style={{ color: '#1B4FD8' }}>{masteredCount} / {words.length}</p>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: 'rgba(27,79,216,0.10)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${learnedPct}%`, background: '#1B4FD8' }} />
        </div>
      </div>
    </div>
  )
}
