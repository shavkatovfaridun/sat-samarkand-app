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

  return (
    <div>
      <div className="mb-6">
        <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">{dateLabel}</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">My Classes</h1>
      </div>

      {todayGroups.length > 0 && (
        <div className="bg-[#1B4FD8] rounded-2xl p-4 mb-5">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-2">Today</p>
          <div className="space-y-2">
            {todayGroups.map((group) => {
              const sched = (group.schedule as Array<{ day: string; startTime: string; endTime: string }>)
                ?.find((s) => s.day === today)
              return (
                <Link
                  key={group.id}
                  href={`/teacher/class/${group.id}`}
                  className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2.5"
                >
                  <div>
                    <p className="font-semibold text-white text-sm">{group.name}</p>
                    <p className="text-white/60 text-xs">{group.subject.toUpperCase()} · {group.student_ids?.length ?? 0} students</p>
                  </div>
                  {sched && (
                    <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">
                      {sched.startTime}–{sched.endTime}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {!groups?.length ? (
        <div className="bg-white rounded-2xl p-6 text-center border border-[#E2E8F5]">
          <p className="text-3xl mb-2">🏫</p>
          <p className="text-[#6B7B9C] text-sm">No groups assigned yet. Contact admin.</p>
        </div>
      ) : (
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-3">All Groups</p>
          <div className="space-y-2">
            {groups.map((group) => {
              const todaySched = (group.schedule as Array<{ day: string; startTime: string; endTime: string }>)
                ?.find((s) => s.day === today)
              return (
                <Link
                  key={group.id}
                  href={`/teacher/class/${group.id}`}
                  className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 border border-[#E2E8F5] hover:border-[#C7D7FA] active:scale-[0.99] transition-all"
                >
                  <div>
                    <p className="font-semibold text-[#1A2340]">{group.name}</p>
                    <p className="text-xs text-[#6B7B9C] mt-0.5">
                      {group.subject.toUpperCase()} · {group.student_ids?.length ?? 0} students
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {todaySched && (
                      <span className="text-xs bg-[#ECFDF5] text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                        Today
                      </span>
                    )}
                    <span className="text-[#6B7B9C]">›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/teacher/assign"
          className="block w-full bg-[#1B4FD8] text-white rounded-2xl py-4 text-center text-sm font-bold active:scale-95 transition-transform"
        >
          📋 Assign Homework
        </Link>
      </div>
    </div>
  )
}
