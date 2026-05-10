import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!group) notFound()

  // Get students in this group
  const { data: students } = await supabase
    .from('students')
    .select('id, name, subject, status, current_score, target_score')
    .eq('group_id', params.id)
    .order('name')

  // Get students not in any group (to add)
  const { data: availableStudents } = await supabase
    .from('students')
    .select('id, name, subject')
    .is('group_id', null)
    .eq('status', 'active')
    .order('name')

  const { data: teachers } = await supabase
    .from('users')
    .select('telegram_id, name')
    .eq('role', 'teacher')

  const teacherMap = Object.fromEntries(teachers?.map((t) => [t.telegram_id, t.name]) ?? [])

  async function addStudentToGroup(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const studentId = formData.get('student_id') as string
    if (!studentId) return

    await admin.from('students').update({ group_id: params.id }).eq('id', studentId)

    // Also update student_ids array in groups table
    const currentIds = group.student_ids ?? []
    if (!currentIds.includes(studentId)) {
      await admin.from('groups').update({ student_ids: [...currentIds, studentId] }).eq('id', params.id)
    }
    redirect(`/admin/groups/${params.id}`)
  }

  async function removeStudentFromGroup(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const studentId = formData.get('student_id') as string
    if (!studentId) return

    await admin.from('students').update({ group_id: null }).eq('id', studentId)

    const updatedIds = (group.student_ids ?? []).filter((id: string) => id !== studentId)
    await admin.from('groups').update({ student_ids: updatedIds }).eq('id', params.id)

    redirect(`/admin/groups/${params.id}`)
  }

  async function updateGroupStatus(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    await admin.from('groups').update({ status: formData.get('status') }).eq('id', params.id)
    redirect(`/admin/groups/${params.id}`)
  }

  return (
    <div>
      <Link href="/admin/groups" className="text-xs text-gray-400 hover:text-gray-600">← Groups</Link>

      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <h1 className="text-xl font-bold">{group.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{group.subject} · {teacherMap[group.teacher_id] ?? 'No teacher'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{students?.length ?? 0}/{group.max_capacity} students · {group.room ?? 'No room'}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          group.status === 'active' ? 'bg-green-100 text-green-700' :
          group.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-500'
        }`}>{group.status}</span>
      </div>

      {/* Schedule */}
      {(group.schedule as Array<{ day: string; startTime: string; endTime: string }>)?.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <h2 className="text-sm font-semibold mb-2 text-gray-700">Schedule</h2>
          <div className="space-y-1">
            {(group.schedule as Array<{ day: string; startTime: string; endTime: string }>).map((s) => (
              <p key={s.day} className="text-sm text-gray-600">{s.day}: {s.startTime}–{s.endTime}</p>
            ))}
          </div>
        </div>
      )}

      {/* Students in group */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Students ({students?.length ?? 0})</h2>
        <div className="space-y-2">
          {students?.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <div>
                <Link href={`/admin/students/${s.id}`} className="text-sm font-medium hover:underline">{s.name}</Link>
                <p className="text-xs text-gray-400 capitalize">{s.subject} · {s.current_score ?? '—'} → {s.target_score ?? '—'}</p>
              </div>
              <form action={removeStudentFromGroup}>
                <input type="hidden" name="student_id" value={s.id} />
                <button type="submit" className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </form>
            </div>
          ))}
          {!students?.length && <p className="text-sm text-gray-400">No students yet.</p>}
        </div>
      </div>

      {/* Add student */}
      {availableStudents && availableStudents.length > 0 && (
        <form action={addStudentToGroup} className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <h2 className="text-sm font-semibold mb-2 text-gray-700">Add Student</h2>
          <div className="flex gap-2">
            <select name="student_id" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select student…</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">Add</button>
          </div>
        </form>
      )}

      {/* Status */}
      <form action={updateGroupStatus} className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-semibold mb-2 text-gray-700">Group Status</h2>
        <div className="flex gap-2">
          <select name="status" defaultValue={group.status} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="full">Full</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">Save</button>
        </div>
      </form>
    </div>
  )
}
