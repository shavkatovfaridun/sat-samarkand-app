import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  graduated: 'bg-blue-100 text-blue-700',
  dropped: 'bg-gray-100 text-gray-500',
}

export default async function StudentsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient()

  let query = supabase
    .from('students')
    .select('id, name, subject, type, phase, exam_date, target_score, current_score, status, enrollment_date')
    .order('name')

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: students } = await query

  const statusFilters = ['', 'active', 'paused', 'graduated', 'dropped']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Students</h1>
        <Link href="/admin/students/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          + Add Student
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {statusFilters.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/students?status=${s}` : '/admin/students'}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${
              (searchParams.status ?? '') === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {!students?.length ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">
            No students found.
          </div>
        ) : (
          students.map((s) => (
            <Link
              key={s.id}
              href={`/admin/students/${s.id}`}
              className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{s.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {s.subject} · {s.type} · {s.phase}
                  </p>
                  {s.current_score && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Score: {s.current_score} → Target: {s.target_score}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? ''}`}>
                  {s.status}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
