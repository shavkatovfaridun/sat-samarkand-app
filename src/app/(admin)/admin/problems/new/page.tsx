import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function createProblem(formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('problems').insert({
    content:        formData.get('content') as string,
    subject:        formData.get('subject') as string,
    topic:          formData.get('topic') as string || null,
    difficulty:     formData.get('difficulty') as string,
    option_a:       formData.get('option_a') as string,
    option_b:       formData.get('option_b') as string,
    option_c:       formData.get('option_c') as string,
    option_d:       formData.get('option_d') as string,
    correct_answer: (formData.get('correct_answer') as string).toLowerCase(),
    explanation:    formData.get('explanation') as string || null,
  })
  redirect('/admin/problems')
}

const inputCls = "w-full rounded-xl px-4 py-3 text-[15px] text-[#1C1C1E] focus:outline-none transition-all"
const inputStyle = { background: 'rgba(120,120,128,0.10)', border: 'none' }

export default function NewProblemPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/problems" className="text-[13px] font-medium" style={{ color: 'rgba(60,60,67,0.50)' }}>← Problems</Link>
        <span style={{ color: 'rgba(60,60,67,0.25)' }}>/</span>
        <span className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>New Problem</span>
      </div>

      <form action={createProblem} className="space-y-4">
        {/* Question */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'rgba(60,60,67,0.45)' }}>Question</p>

          <div className="mb-3">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Problem text *</label>
            <textarea name="content" required rows={3} placeholder="Write the full question here…"
              className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Subject *</label>
              <select name="subject" required className={inputCls} style={{ ...inputStyle, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(60,60,67,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}>
                <option value="math">Math</option>
                <option value="english">English / R&W</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Difficulty *</label>
              <select name="difficulty" required className={inputCls} style={{ ...inputStyle, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(60,60,67,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Topic</label>
            <input name="topic" placeholder="e.g. Algebra, Reading Comprehension, Grammar…"
              className={inputCls} style={inputStyle} />
          </div>
        </div>

        {/* Options */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'rgba(60,60,67,0.45)' }}>Answer Choices</p>
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map(opt => (
              <div key={opt} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
                  style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
                  {opt}
                </span>
                <input name={`option_${opt.toLowerCase()}`} required placeholder={`Option ${opt}`}
                  className={`${inputCls} flex-1`} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* Correct answer + explanation */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'rgba(60,60,67,0.45)' }}>Answer Key</p>

          <div className="mb-3">
            <label className="block text-[12px] font-semibold mb-2" style={{ color: 'rgba(60,60,67,0.55)' }}>Correct answer *</label>
            <div className="flex gap-2">
              {['A', 'B', 'C', 'D'].map(opt => (
                <label key={opt} className="flex-1">
                  <input type="radio" name="correct_answer" value={opt} required className="sr-only peer" />
                  <div className="peer-checked:bg-[#1B4FD8] peer-checked:text-white peer-checked:shadow-[0_0_0_3px_rgba(27,79,216,0.20)] text-center py-3 rounded-xl cursor-pointer font-bold text-[15px] transition-all"
                    style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.55)' }}>
                    {opt}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Explanation (shown after submission)</label>
            <textarea name="explanation" rows={2} placeholder="Why is this the correct answer?"
              className={inputCls} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        <button type="submit"
          className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8', boxShadow: '0 4px 16px rgba(27,79,216,0.30)' }}>
          Save Problem
        </button>
      </form>
    </div>
  )
}
