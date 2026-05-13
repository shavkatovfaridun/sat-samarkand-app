import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

async function markAttendance(groupId: string, teacherTgId: number | null, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  await admin.from('attendance').upsert(
    {
      group_id: groupId,
      student_id: formData.get('student_id') as string,
      class_date: today,
      status: formData.get('status') as string,
      marked_by: teacherTgId,
    },
    { onConflict: 'group_id,student_id,class_date' }
  )
  redirect(`/teacher/class/${groupId}`)
}

async function addScore(formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const math = formData.get('math_score') ? parseInt(formData.get('math_score') as string) : null
  const reading = formData.get('reading_score') ? parseInt(formData.get('reading_score') as string) : null
  const total = parseInt(formData.get('total_score') as string)
  const addedBy = formData.get('added_by') ? parseInt(formData.get('added_by') as string) : null
  const studentId = formData.get('student_id') as string

  await admin.from('score_history').insert({
    student_id: studentId,
    test_date: formData.get('test_date') as string,
    math_score: math,
    reading_score: reading,
    total_score: total,
    test_type: formData.get('test_type') as string,
    notes: formData.get('notes') as string || null,
    added_by: addedBy,
  })

  // Update current_score on the student record
  await admin.from('students').update({ current_score: total }).eq('id', studentId)

  const groupId = formData.get('group_id') as string
  redirect(`/teacher/class/${groupId}`)
}

export default async function ClassViewPage({ params }: { params: { groupId: string } }) {
  const supabase = createClient()

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, subject, schedule, student_ids')
    .eq('id', params.groupId)
    .single()

  if (!group) notFound()

  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: students },
    { data: todayAssignments },
    { data: attendance },
  ] = await Promise.all([
    supabase.from('students').select('id, name, telegram_id, current_score, target_score').eq('group_id', params.groupId).order('name'),
    supabase.from('assignments').select('id, problem_ids').eq('group_id', params.groupId).eq('due_date', today).limit(1),
    supabase.from('attendance').select('student_id, status').eq('group_id', params.groupId).eq('class_date', today),
  ])

  const todayAssignment = todayAssignments?.[0]
  const { data: submissions } = todayAssignment
    ? await supabase.from('submissions').select('student_id, score, total').eq('assignment_id', todayAssignment.id)
    : { data: null }

  const submissionMap = Object.fromEntries(submissions?.map(s => [s.student_id, s]) ?? [])
  const attendanceMap = Object.fromEntries(attendance?.map(a => [a.student_id, a.status]) ?? [])

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const teacherTgId = match ? parseInt(match[1]) : null

  const markAttendanceWithCtx = markAttendance.bind(null, params.groupId, teacherTgId)

  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
  const submittedCount = submissions?.length ?? 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/teacher/dashboard" className="text-[#6B7B9C] text-sm">← Classes</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340]">{group.name}</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1A2340]">{group.name}</h1>
          <p className="text-[#6B7B9C] text-sm capitalize">{group.subject} · {today}</p>
        </div>
        <div className="flex gap-2">
          <div className="text-center bg-[#ECFDF5] rounded-xl px-3 py-2">
            <p className="text-lg font-bold text-emerald-700">{presentCount}</p>
            <p className="text-[10px] text-emerald-600">Present</p>
          </div>
          <div className="text-center bg-[#EEF3FF] rounded-xl px-3 py-2">
            <p className="text-lg font-bold text-[#1B4FD8]">{submittedCount}</p>
            <p className="text-[10px] text-[#1B4FD8]">Submitted</p>
          </div>
        </div>
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-4">Attendance — {today}</p>
        <div className="space-y-3">
          {!students?.length ? (
            <p className="text-[#6B7B9C] text-sm">No students in this group.</p>
          ) : (
            students.map(s => {
              const current = attendanceMap[s.id]
              const sub = submissionMap[s.id]
              return (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2340] truncate">{s.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#6B7B9C]">{s.current_score ?? '—'} → {s.target_score ?? '—'}</p>
                      {todayAssignment && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          sub ? 'bg-[#ECFDF5] text-emerald-700' : 'bg-[#FEF2F2] text-red-600'
                        }`}>
                          {sub ? `✓ ${sub.score}/${sub.total}` : '✗ No HW'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {(['present', 'late', 'absent'] as const).map(status => (
                      <form key={status} action={markAttendanceWithCtx}>
                        <input type="hidden" name="student_id" value={s.id} />
                        <input type="hidden" name="status" value={status} />
                        <button type="submit" className={`w-9 h-9 rounded-xl text-sm font-bold border transition-colors ${
                          current === status
                            ? status === 'present' ? 'bg-emerald-500 text-white border-emerald-500'
                              : status === 'late' ? 'bg-amber-400 text-white border-amber-400'
                              : 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-[#6B7B9C] border-[#E2E8F5] hover:border-[#6B7B9C]'
                        }`}>
                          {status === 'present' ? '✓' : status === 'late' ? '~' : '✗'}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add SAT score */}
      {students && students.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-4">Log SAT Score</p>
          <form action={addScore} className="space-y-3">
            <input type="hidden" name="group_id" value={params.groupId} />
            <input type="hidden" name="added_by" value={teacherTgId ?? ''} />
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Student</label>
              <select name="student_id" required className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                <option value="">— Select student —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Test Date</label>
                <input name="test_date" type="date" required defaultValue={today}
                  className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Type</label>
                <select name="test_type" className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                  <option value="practice">Practice</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="official">Official</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Math</label>
                <input name="math_score" type="number" min="200" max="800" placeholder="200–800"
                  className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Reading/Writing</label>
                <input name="reading_score" type="number" min="200" max="800" placeholder="200–800"
                  className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Total Score *</label>
              <input name="total_score" type="number" required min="400" max="1600" placeholder="400–1600"
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Notes</label>
              <input name="notes" placeholder="Optional notes"
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <button type="submit"
              className="w-full bg-[#1B4FD8] text-white rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform">
              Save Score
            </button>
          </form>
        </div>
      )}

      <Link href="/teacher/assign"
        className="block w-full bg-[#1B4FD8] text-white rounded-2xl py-4 text-center text-sm font-bold active:scale-95 transition-transform">
        📋 Assign Homework
      </Link>
    </div>
  )
}
