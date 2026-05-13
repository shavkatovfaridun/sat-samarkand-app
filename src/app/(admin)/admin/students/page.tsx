import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS: Record<string, { color: string; bg: string }> = {
  active:    { color: '#1E8A3C', bg: 'rgba(52,199,89,0.12)'   },
  paused:    { color: '#B86800', bg: 'rgba(255,149,0,0.12)'   },
  graduated: { color: '#1B4FD8', bg: 'rgba(27,79,216,0.12)'   },
  dropped:   { color: 'rgba(60,60,67,0.50)', bg: 'rgba(120,120,128,0.12)' },
}

const FILTERS = [
  { value: '',          label: 'All'       },
  { value: 'active',    label: 'Active'    },
  { value: 'paused',    label: 'Paused'    },
  { value: 'graduated', label: 'Graduated' },
  { value: 'dropped',   label: 'Dropped'   },
]

export default async function StudentsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient()

  let query = supabase
    .from('students')
    .select('id, name, subject, type, phase, target_score, current_score, status')
    .order('name')

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: students } = await query

  const { data: counts } = await supabase.from('students').select('status')
  const total   = counts?.length ?? 0
  const active  = counts?.filter(s => s.status === 'active').length ?? 0
  const paused  = counts?.filter(s => s.status === 'paused').length ?? 0

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Roster</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Students</h1>
        </div>
        <Link href="/admin/students/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          Add Student
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Total',  value: total,  color: '#1C1C1E', bg: 'rgba(120,120,128,0.08)' },
          { label: 'Active', value: active, color: '#1E8A3C', bg: 'rgba(52,199,89,0.10)'  },
          { label: 'Paused', value: paused, color: '#B86800', bg: 'rgba(255,149,0,0.10)'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[26px] font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const active = (searchParams.status ?? '') === f.value
          return (
            <Link key={f.value}
              href={f.value ? `/admin/students?status=${f.value}` : '/admin/students'}
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

      {/* List */}
      {!students?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No students found</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>
            {searchParams.status ? `No ${searchParams.status} students` : 'Add your first student to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {students.map((s, i) => {
            const st = STATUS[s.status] ?? STATUS.dropped
            return (
              <Link key={s.id} href={`/admin/students/${s.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-[15px] font-bold"
                  style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[12px] capitalize" style={{ color: 'rgba(60,60,67,0.50)' }}>
                      {s.subject} · {s.type}
                    </p>
                    {s.current_score && (
                      <span className="text-[12px] font-semibold" style={{ color: 'rgba(60,60,67,0.40)' }}>
                        {s.current_score} → {s.target_score ?? '?'}
                      </span>
                    )}
                  </div>
                </div>
                {/* Status + chevron */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{ background: st.bg, color: st.color }}>
                    {s.status}
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"
                    style={{ color: 'rgba(60,60,67,0.22)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
