import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#ECFDF5] text-emerald-700',
  paused: 'bg-[#FFFBEB] text-amber-700',
  graduated: 'bg-[#EEF3FF] text-[#1B4FD8]',
  dropped: 'bg-[#F1F5F9] text-slate-500',
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

  const statusFilters = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'graduated', label: 'Graduated' },
    { value: 'dropped', label: 'Dropped' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">All Students</p>
          <h1 className="text-2xl font-bold text-[#1A2340]">Students</h1>
        </div>
        <Link
          href="/admin/students/new"
          className="bg-[#1B4FD8] text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          + Add
        </Link>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {statusFilters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/students?status=${f.value}` : '/admin/students'}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              (searchParams.status ?? '') === f.value
                ? 'bg-[#1B4FD8] text-white border-[#1B4FD8]'
                : 'bg-white text-[#6B7B9C] border-[#E2E8F5] hover:border-[#1B4FD8] hover:text-[#1B4FD8]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {!students?.length ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F5]">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-[#6B7B9C] text-sm">No students found</p>
          </div>
        ) : (
          students.map((s) => (
            <Link
              key={s.id}
              href={`/admin/students/${s.id}`}
              className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 border border-[#E2E8F5] hover:border-[#C7D7FA] active:scale-[0.99] transition-all"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#1A2340] truncate">{s.name}</p>
                <p className="text-xs text-[#6B7B9C] mt-0.5 capitalize">
                  {s.subject} · {s.type} · {s.phase}
                  {s.current_score ? ` · ${s.current_score}→${s.target_score}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[s.status] ?? ''}`}>
                  {s.status}
                </span>
                <span className="text-[#6B7B9C] text-sm">›</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
