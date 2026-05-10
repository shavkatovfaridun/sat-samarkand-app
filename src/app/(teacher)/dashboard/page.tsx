import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherDashboard() {
  const supabase = createClient()

  // Get current user's telegram_id from session
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const telegramIdMatch = email.match(/^tg_(\d+)@/)
  const telegramId = telegramIdMatch ? parseInt(telegramIdMatch[1]) : null

  // Get groups this teacher owns
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, subject, schedule, student_ids')
    .eq('teacher_id', telegramId)
    .order('name')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">My Classes</h1>
      <p className="text-gray-500 text-sm mb-6">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

      {!groups?.length ? (
        <div className="bg-white rounded-xl p-6 text-center text-gray-400 text-sm">
          No groups assigned yet. Contact admin.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const todaySchedule = (group.schedule as Array<{ day: string; startTime: string; endTime: string }>)
              ?.find((s) => s.day === today)

            return (
              <Link
                key={group.id}
                href={`/teacher/class/${group.id}`}
                className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {group.subject.toUpperCase()} · {group.student_ids?.length ?? 0} students
                    </p>
                  </div>
                  {todaySchedule && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {todaySchedule.startTime}–{todaySchedule.endTime}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Link href="/teacher/assign" className="block w-full bg-gray-900 text-white rounded-xl py-3 text-center text-sm font-medium">
          Assign Homework
        </Link>
      </div>
    </div>
  )
}
