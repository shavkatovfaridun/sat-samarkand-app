import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatUZS } from '@/lib/format'

export default async function TeachersPage() {
  const admin = createAdminClient()
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [{ data: teachers }, { data: salaries }, { data: groups }] = await Promise.all([
    admin.from('users').select('telegram_id, name, telegram_username').eq('role', 'teacher').order('name'),
    admin.from('salaries').select('teacher_id, net_amount, status').eq('month', currentMonth),
    admin.from('groups').select('teacher_id, name').eq('status', 'active'),
  ])

  const salaryMap = Object.fromEntries(salaries?.map(s => [s.teacher_id, s]) ?? [])
  const groupsByTeacher = groups?.reduce((acc, g) => {
    if (!acc[g.teacher_id]) acc[g.teacher_id] = []
    acc[g.teacher_id].push(g.name)
    return acc
  }, {} as Record<number, string[]>) ?? {}

  const paidCount   = salaries?.filter(s => s.status === 'paid').length ?? 0
  const unpaidCount = (teachers?.length ?? 0) - paidCount

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Team</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Teachers</h1>
        </div>
        <Link href="/admin/teachers/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          Add Teacher
        </Link>
      </div>

      {/* Salary summary */}
      {teachers && teachers.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: 'Teachers',      value: teachers.length, color: '#1C1C1E', bg: 'rgba(120,120,128,0.08)' },
            { label: 'Salary paid',   value: paidCount,       color: '#1E8A3C', bg: 'rgba(52,199,89,0.10)'  },
            { label: 'Salary unpaid', value: unpaidCount,     color: unpaidCount > 0 ? '#B86800' : '#1C1C1E', bg: unpaidCount > 0 ? 'rgba(255,149,0,0.10)' : 'rgba(120,120,128,0.08)' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[26px] font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {!teachers?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No teachers yet</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Add your first teacher to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {teachers.map((t, i) => {
            const salary  = salaryMap[t.telegram_id]
            const myGroups = groupsByTeacher[t.telegram_id] ?? []
            return (
              <Link key={t.telegram_id} href={`/admin/teachers/${t.telegram_id}`}
                className="flex items-center gap-4 px-4 py-4 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-[17px] font-bold"
                  style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
                  {t.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E]">{t.name}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {t.telegram_username ? `@${t.telegram_username}` : `ID: ${t.telegram_id}`}
                  </p>
                  {myGroups.length > 0 && (
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(60,60,67,0.40)' }}>
                      {myGroups.join(' · ')}
                    </p>
                  )}
                </div>
                {/* Salary badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {salary ? (
                    <div className="text-right">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full block"
                        style={{
                          background: salary.status === 'paid' ? 'rgba(52,199,89,0.12)' : 'rgba(255,149,0,0.12)',
                          color: salary.status === 'paid' ? '#1E8A3C' : '#B86800',
                        }}>
                        {salary.status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                      </span>
                      <p className="text-[11px] mt-1 text-right" style={{ color: 'rgba(60,60,67,0.40)' }}>
                        {formatUZS(salary.net_amount)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.45)' }}>
                      No salary
                    </span>
                  )}
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
