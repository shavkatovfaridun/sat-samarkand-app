import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, subject, schedule, student_ids')
    .eq('teacher_id', telegramId)
    .order('name')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const todayGroups = groups?.filter((g) =>
    (g.schedule as Array<{ day: string }>)?.some((s) => s.day === today)
  ) ?? []

  const allGroups = groups ?? []
  const totalStudents = allGroups.reduce((sum, g) => sum + (g.student_ids?.length ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>{dateLabel}</p>
        <h1 className="text-[26px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>My Classes</h1>
      </div>

      {/* Stats row */}
      {allGroups.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Groups', value: allGroups.length },
            { label: 'Students', value: totalStudents },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[28px] font-bold tracking-tight leading-none mb-1" style={{ color: '#1C1C1E' }}>{s.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's classes */}
      {todayGroups.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
            Today
          </p>
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#1340B0 0%,#1B4FD8 60%,#2563EB 100%)', boxShadow: '0 8px 32px rgba(27,79,216,0.25)' }}>
            <div className="relative overflow-hidden p-5">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="space-y-2.5">
                {todayGroups.map((group) => {
                  const sched = (group.schedule as Array<{ day: string; startTime: string; endTime: string }>)
                    ?.find((s) => s.day === today)
                  return (
                    <Link
                      key={group.id}
                      href={`/teacher/class/${group.id}`}
                      className="flex items-center justify-between rounded-2xl px-4 py-3 transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                    >
                      <div>
                        <p className="font-semibold text-white text-[14px]">{group.name}</p>
                        <p className="text-[12px] mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.55)' }}>
                          {group.subject} · {group.student_ids?.length ?? 0} students
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sched && (
                          <span className="text-[12px] font-semibold px-3 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.90)' }}>
                            {sched.startTime}–{sched.endTime}
                          </span>
                        )}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"
                          style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All groups */}
      {!allGroups.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(27,79,216,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#1B4FD8' }}>
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No groups assigned</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>Contact admin to be assigned to a group</p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
            All Groups
          </p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {allGroups.map((group, i) => {
              const todaySched = (group.schedule as Array<{ day: string; startTime: string; endTime: string }>)
                ?.find((s) => s.day === today)
              const isToday = !!todaySched
              return (
                <Link key={group.id} href={`/teacher/class/${group.id}`}
                  className="flex items-center gap-4 px-4 py-4 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-[15px] font-bold"
                    style={{ background: isToday ? 'rgba(27,79,216,0.10)' : 'rgba(120,120,128,0.08)', color: isToday ? '#1B4FD8' : 'rgba(60,60,67,0.55)' }}>
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#1C1C1E]">{group.name}</p>
                    <p className="text-[12px] mt-0.5 capitalize" style={{ color: 'rgba(60,60,67,0.50)' }}>
                      {group.subject} · {group.student_ids?.length ?? 0} students
                    </p>
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isToday && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(52,199,89,0.12)', color: '#1E8A3C' }}>
                        Today
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
        </div>
      )}

      {/* Quick action */}
      <Link href="/teacher/assign"
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
        style={{ background: '#1B4FD8', boxShadow: '0 4px 16px rgba(27,79,216,0.30)' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75-6.75a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
          <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
        </svg>
        Assign Homework
      </Link>
    </div>
  )
}
