import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

const DIFF_STYLE: Record<string, { bg: string; color: string }> = {
  easy:   { bg: 'rgba(52,199,89,0.12)',  color: '#1E8A3C' },
  medium: { bg: 'rgba(255,149,0,0.12)',  color: '#B86800' },
  hard:   { bg: 'rgba(255,59,48,0.12)',  color: '#C0281F' },
}

const POS_ABBR: Record<string, string> = {
  noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.', other: ''
}

export default async function VocabAdminPage({ searchParams }: { searchParams: { difficulty?: string } }) {
  const admin = createAdminClient()

  let query = admin
    .from('vocab_words')
    .select('id, word, definition, part_of_speech, difficulty, example, created_at')
    .order('word')

  if (searchParams.difficulty) query = query.eq('difficulty', searchParams.difficulty)

  const { data: words } = await query

  const { data: all } = await admin.from('vocab_words').select('difficulty')
  const total  = all?.length ?? 0
  const easy   = all?.filter(w => w.difficulty === 'easy').length ?? 0
  const medium = all?.filter(w => w.difficulty === 'medium').length ?? 0
  const hard   = all?.filter(w => w.difficulty === 'hard').length ?? 0

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="pt-1">
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Content</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Vocab Bank</h1>
        </div>
        <Link href="/admin/vocab/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          Add Word
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total',  value: total,  color: '#1C1C1E',  bg: 'rgba(120,120,128,0.08)' },
          { label: 'Easy',   value: easy,   color: '#1E8A3C',  bg: 'rgba(52,199,89,0.10)' },
          { label: 'Medium', value: medium, color: '#B86800',  bg: 'rgba(255,149,0,0.10)' },
          { label: 'Hard',   value: hard,   color: '#C0281F',  bg: 'rgba(255,59,48,0.10)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[22px] font-bold tracking-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All',    href: '/admin/vocab' },
          { label: 'Easy',   href: '/admin/vocab?difficulty=easy' },
          { label: 'Medium', href: '/admin/vocab?difficulty=medium' },
          { label: 'Hard',   href: '/admin/vocab?difficulty=hard' },
        ].map(f => {
          const active = f.href === '/admin/vocab'
            ? !searchParams.difficulty
            : f.href.includes(searchParams.difficulty ?? '__')
          return (
            <Link key={f.href} href={f.href}
              className="shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full transition-all"
              style={{
                background: active ? '#1B4FD8' : 'white',
                color: active ? 'white' : 'rgba(60,60,67,0.55)',
                boxShadow: active ? '0 2px 8px rgba(27,79,216,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
              }}>
              {f.label}
            </Link>
          )
        })}
      </div>

      {/* Word list */}
      {!words?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No words yet</p>
          <p className="text-[13px] mb-5" style={{ color: 'rgba(60,60,67,0.50)' }}>Add your first vocab word</p>
          <Link href="/admin/vocab/new"
            className="inline-flex items-center gap-2 text-[14px] font-semibold px-5 py-3 rounded-xl text-white"
            style={{ background: '#1B4FD8' }}>
            Add Word
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {words.map((w, i) => {
            const diff = DIFF_STYLE[w.difficulty] ?? DIFF_STYLE.medium
            const pos  = POS_ABBR[w.part_of_speech ?? ''] ?? w.part_of_speech ?? ''
            return (
              <div key={w.id} className="px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[15px] font-bold" style={{ color: '#1C1C1E' }}>{w.word}</span>
                      {pos && <span className="text-[11px] italic" style={{ color: 'rgba(60,60,67,0.45)' }}>{pos}</span>}
                    </div>
                    <p className="text-[13px] mt-0.5 leading-snug" style={{ color: 'rgba(60,60,67,0.65)' }}>{w.definition}</p>
                    {w.example && (
                      <p className="text-[11px] mt-1 italic" style={{ color: 'rgba(60,60,67,0.40)' }}>"{w.example}"</p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 mt-0.5"
                    style={{ background: diff.bg, color: diff.color }}>
                    {w.difficulty}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
