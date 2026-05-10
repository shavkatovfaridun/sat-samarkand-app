import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ClassViewPage({ params }: { params: { groupId: string } }) {
  const supabase = createClient()

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, subject, schedule, student_ids')
    .eq('id', params.groupId)
    .single()

  if (!group) notFound()

  const today = new Date().toISOString().slice(0, 10)

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, name, telegram_id, current_score, target_score')
    .eq('group_id', params.groupId)
    .order('name')

  // Get today's assignments for this group
  const { data: todayAssignments } = await supabase
    .from('assignments')
    .select('id, problem_ids')
    .eq('group_id', params.groupId)
    .lte('due_date', today)
    .gte('due_date', today)
    .limit(1)

  const todayAssignment = todayAssignments?.[0]

  // Get submissions for today's assignment
  const { data: submissions } = todayAssignment ? await supabase
    .from('submissions')
    .select('student_id, score, total')
    .eq('assignment_id', todayAssignment.id) : { data: null }

  const submissionMap = Object.fromEntries(submissions?.map((s) => [s.student_id, s]) ?? [])

  // Get today's attendance
  const { data: attendance } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('group_id', params.groupId)
    .eq('class_date', today)

  const attendanceMap = Object.fromEntries(attendance?.map((a) => [a.student_id, a.status]) ?? [])

  async function markAttendance(formData: FormData) {
    'use server'
    const admin = createAdminClient()
    const studentId = formData.get('student_id') as string
    const status = formData.get('status') as string
    const teacherId = formData.get('teacher_id') ? parseInt(formData.get('teacher_id') as string) : null

    await admin.from('attendance').upsert(
      { group_id: params.groupId, student_id: studentId, class_date: today, status, marked_by: teacherId },
      { onConflict: 'group_id,student_id,class_date' }
    )
    redirect(`/teacher/class/${params.groupId}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const teacherIdMatch = email.match(/^tg_(\d+)@/)
  const teacherTgId = teacherIdMatch ? parseInt(teacherIdMatch[1]) : null

  return (
    <div>
      <Link href="/teacher/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← My Classes</Link>
      <h1 className="text-xl font-bold mt-2 mb-1">{group.name}</h1>
      <p className="text-sm text-gray-500 capitalize mb-6">{group.subject} · {today}</p>

      {/* Homework status */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">
          Homework Submissions {todayAssignment ? `(${submissions?.length ?? 0}/${students?.length ?? 0})` : '(No HW today)'}
        </h2>
        <div className="space-y-2">
          {students?.map((s) => {
            const sub = submissionMap[s.id]
            return (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.current_score ?? '—'} → {s.target_score ?? '—'}</p>
                </div>
                {todayAssignment && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    sub ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {sub ? `✓ ${sub.score}/${sub.total}` : '✗ Not submitted'}
                  </span>
                )}
              </div>
            )
          })}
          {!students?.length && <p className="text-sm text-gray-400">No students in this group.</p>}
        </div>
      </div>

      {/* Attendance marking */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Mark Attendance</h2>
        <div className="space-y-2">
          {students?.map((s) => {
            const currentStatus = attendanceMap[s.id]
            return (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium shrink-0">{s.name}</p>
                <div className="flex gap-1.5">
                  {['present', 'late', 'absent'].map((status) => (
                    <form key={status} action={markAttendance}>
                      <input type="hidden" name="student_id" value={s.id} />
                      <input type="hidden" name="status" value={status} />
                      <input type="hidden" name="teacher_id" value={teacherTgId ?? ''} />
                      <button
                        type="submit"
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          currentStatus === status
                            ? status === 'present' ? 'bg-green-500 text-white border-green-500'
                              : status === 'late' ? 'bg-yellow-400 text-white border-yellow-400'
                              : 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {status === 'present' ? '✓' : status === 'late' ? '~' : '✗'}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        <Link href="/teacher/assign" className="block w-full bg-gray-900 text-white rounded-xl py-3 text-center text-sm font-medium">
          Assign Today's Homework →
        </Link>
      </div>
    </div>
  )
}
