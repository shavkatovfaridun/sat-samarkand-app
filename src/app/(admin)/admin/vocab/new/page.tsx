import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const INPUT       = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL       = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

async function createWord(formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('vocab_words').insert({
    word:           (formData.get('word')           as string).trim(),
    definition:     (formData.get('definition')     as string).trim(),
    example:        (formData.get('example')        as string).trim() || null,
    part_of_speech: (formData.get('part_of_speech') as string) || null,
    difficulty:     (formData.get('difficulty')     as string) || 'medium',
    subject:        'english',
  })
  redirect('/admin/vocab')
}

export default function NewVocabWordPage() {
  return (
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href="/admin/vocab"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Vocab Bank
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Add Vocab Word</h1>
      </div>

      <form action={createWord} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Word Details</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={LABEL} style={LABEL_STYLE}>Word *</label>
              <input name="word" required placeholder="e.g. Tenacious" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Part of Speech</label>
              <select name="part_of_speech" className={INPUT} style={INPUT_STYLE}>
                <option value="">—</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Difficulty *</label>
              <select name="difficulty" className={INPUT} style={INPUT_STYLE}>
                <option value="easy">Easy</option>
                <option value="medium" selected>Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Definition *</label>
            <textarea name="definition" required rows={2}
              placeholder="Clear, concise definition suitable for SAT students"
              className="w-full rounded-xl px-3 py-2.5 text-[14px] bg-white resize-none"
              style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Example Sentence</label>
            <textarea name="example" rows={2}
              placeholder="e.g. Her tenacious study habits led to a 200-point improvement."
              className="w-full rounded-xl px-3 py-2.5 text-[14px] bg-white resize-none"
              style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href="/admin/vocab"
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Add Word
          </button>
        </div>
      </form>
    </div>
  )
}
