import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export default async function AssignHomeworkPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const teacherTgId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, subject')
    .eq('teacher_id', teacherTgId)
    .eq('status', 'active')

  const { data: problems } = await supabase
    .from('problems')
    .select('id, topic, difficulty, subject, content')
    .order('subject')

  async function createAssignment(formData: FormData) {
    'use server'
    const admin = createAdminClient()

    const group_id   = formData.get('group_id')   as string
    const due_date   = formData.get('due_date')   as string
    const problem_ids = formData.getAll('problem_ids') as string[]

    if (!group_id || !due_date || problem_ids.length === 0) return

    await admin.from('assignments').insert({
      group_id,
      problem_ids,
      due_date,
      assigned_by: teacherTgId,
    })

    redirect(`/teacher/class/${group_id}`)
  }

  const DIFF_COLORS: Record<string, { bg: string; color: string }> = {
    easy:   { bg: 'rgba(52,199,89,0.10)',  color: '#1E8A3C' },
    medium: { bg: 'rgba(255,149,0,0.10)',  color: '#B86800' },
    hard:   { bg: 'rgba(255,59,48,0.10)', color: '#C0281F' },
  }
  const SUBJ_COLORS: Record<string, { bg: string; color: string }> = {
    math:    { bg: 'rgba(27,79,216,0.08)',  color: '#1B4FD8' },
    english: { bg: 'rgba(175,82,222,0.10)', color: '#AF52DE' },
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>Teacher</p>
        <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Assign Homework</h1>
      </div>

      <form action={createAssignment} className="space-y-4">
        {/* Group */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label className="block text-[12px] font-semibold mb-2" style={{ color: 'rgba(60,60,67,0.55)' }}>Group *</label>
          <select name="group_id" required
            className="w-full rounded-xl px-3 py-2.5 text-[14px] bg-white"
            style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }}>
            <option value="">Select group…</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label className="block text-[12px] font-semibold mb-2" style={{ color: 'rgba(60,60,67,0.55)' }}>Due Date *</label>
          <input
            type="date"
            name="due_date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-xl px-3 py-2.5 text-[14px]"
            style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }}
          />
        </div>

        {/* Problems */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <div className="px-5 pt-5 pb-3">
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(60,60,67,0.55)' }}>Select Problems *</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(60,60,67,0.40)' }}>{problems?.length ?? 0} problems available</p>
          </div>
          {!problems?.length ? (
            <div className="px-5 pb-5">
              <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(120,120,128,0.06)' }}>
                <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>No problems in bank yet. Ask admin to add some.</p>
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {problems.map((p, i) => {
                const diff = DIFF_COLORS[p.difficulty] ?? DIFF_COLORS.medium
                const subj = SUBJ_COLORS[p.subject]   ?? SUBJ_COLORS.math
                return (
                  <label key={p.id}
                    className="flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.02)]"
                    style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                    <input type="checkbox" name="problem_ids" value={p.id}
                      className="mt-0.5 w-4 h-4 rounded accent-[#1B4FD8]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: subj.bg, color: subj.color }}>{p.subject}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: diff.bg, color: diff.color }}>{p.difficulty}</span>
                        {p.topic && (
                          <span className="text-[11px]" style={{ color: 'rgba(60,60,67,0.45)' }}>{p.topic}</span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#1C1C1E] line-clamp-2">{p.content}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <button type="submit"
          className="w-full rounded-2xl py-4 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: '#1B4FD8', boxShadow: '0 4px 16px rgba(27,79,216,0.30)' }}>
          Assign Homework
        </button>
      </form>
    </div>
  )
}
