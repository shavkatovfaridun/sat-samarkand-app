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
    .order('topic')

  async function createAssignment(formData: FormData) {
    'use server'
    const admin = createAdminClient()

    const group_id = formData.get('group_id') as string
    const due_date = formData.get('due_date') as string
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

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Assign Homework</h1>

      <form action={createAssignment} className="space-y-4 bg-white rounded-xl p-6 border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group *</label>
          <select name="group_id" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">Select group…</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
          <input
            type="date"
            name="due_date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Problems *</label>
          {!problems?.length ? (
            <p className="text-sm text-gray-400">No problems in bank. Admin needs to add them.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-100 rounded-lg p-3">
              {problems.map((p) => (
                <label key={p.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                  <input type="checkbox" name="problem_ids" value={p.id} className="mt-0.5" />
                  <div>
                    <p className="text-xs font-medium capitalize">{p.subject} · {p.topic} · {p.difficulty}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{p.content}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <button type="submit" className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium">
          Assign Homework
        </button>
      </form>
    </div>
  )
}
