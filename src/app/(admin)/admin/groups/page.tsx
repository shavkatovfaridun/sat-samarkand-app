import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function GroupsPage() {
  const supabase = createClient()

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, subject, teacher_id, student_ids, max_capacity, status, schedule')
    .order('name')

  const { data: teachers } = await supabase
    .from('users')
    .select('telegram_id, name')
    .eq('role', 'teacher')

  const teacherMap = Object.fromEntries(teachers?.map((t) => [t.telegram_id, t.name]) ?? [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Groups</h1>
        <Link href="/admin/groups/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          + New Group
        </Link>
      </div>

      <div className="space-y-3">
        {!groups?.length ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
            No groups yet. Create your first group.
          </div>
        ) : (
          groups.map((g) => {
            const enrolled = g.student_ids?.length ?? 0
            const full = enrolled >= g.max_capacity
            return (
              <Link
                key={g.id}
                href={`/admin/groups/${g.id}`}
                className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">
                      {g.subject} · {teacherMap[g.teacher_id] ?? 'No teacher'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {enrolled}/{g.max_capacity} students
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    g.status === 'active' ? (full ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') :
                    g.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {full && g.status === 'active' ? 'full' : g.status}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
