import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS: Record<string, { bg: string; color: string }> = {
  active:   { bg: 'rgba(52,199,89,0.12)',   color: '#1E8A3C' },
  full:     { bg: 'rgba(255,59,48,0.10)',   color: '#C0281F' },
  upcoming: { bg: 'rgba(27,79,216,0.10)',   color: '#1B4FD8' },
  inactive: { bg: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.55)' },
}

export default async function GroupsPage() {
  const supabase = createClient()

  const [{ data: groups }, { data: teachers }] = await Promise.all([
    supabase.from('groups').select('id, name, subject, teacher_id, student_ids, max_capacity, status, schedule').order('name'),
    supabase.from('users').select('telegram_id, name').eq('role', 'teacher'),
  ])

  const teacherMap = Object.fromEntries(teachers?.map(t => [t.telegram_id, t.name]) ?? [])

  const active   = groups?.filter(g => g.status === 'active').length ?? 0
  const upcoming = groups?.filter(g => g.status === 'upcoming').length ?? 0
  const totalStudents = groups?.reduce((s, g) => s + (g.student_ids?.length ?? 0), 0) ?? 0

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Classes</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Groups</h1>
        </div>
        <Link href="/admin/groups/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          New Group
        </Link>
      </div>

      {/* Stats */}
      {(groups?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: 'Total',    value: groups?.length ?? 0, color: '#1C1C1E' },
            { label: 'Active',   value: active,              color: '#1E8A3C' },
            { label: 'Students', value: totalStudents,        color: '#1B4FD8' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[26px] font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {!groups?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
              <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No groups yet</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Create your first group to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {groups.map((g, i) => {
            const enrolled = g.student_ids?.length ?? 0
            const isFull = enrolled >= g.max_capacity
            const statusKey = isFull && g.status === 'active' ? 'full' : g.status
            const st = STATUS[statusKey] ?? STATUS.inactive
            const teacher = teacherMap[g.teacher_id]
            const capacityPct = g.max_capacity > 0 ? Math.min(100, Math.round((enrolled / g.max_capacity) * 100)) : 0

            return (
              <Link key={g.id} href={`/admin/groups/${g.id}`}
                className="flex items-center gap-4 px-4 py-4 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-[15px] font-bold"
                  style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
                  {g.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E]">{g.name}</p>
                  <p className="text-[12px] mt-0.5 capitalize" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {g.subject} · {teacher ?? 'No teacher'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(120,120,128,0.12)', maxWidth: 80 }}>
                      <div className="h-1 rounded-full"
                        style={{ width: `${capacityPct}%`, background: isFull ? '#FF3B30' : '#34C759' }} />
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgba(60,60,67,0.45)' }}>{enrolled}/{g.max_capacity}</p>
                  </div>
                </div>
                {/* Status + chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{ background: st.bg, color: st.color }}>
                    {statusKey}
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
