import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import { sendTelegramMessage } from '@/lib/bot'

async function markAttendance(groupId: string, teacherTgId: number | null, formData: FormData) {
  'use server'
  const admin     = createAdminClient()
  const today     = new Date().toISOString().slice(0, 10)
  const studentId = formData.get('student_id') as string
  const status    = formData.get('status')    as string

  await admin.from('attendance').upsert(
    { group_id: groupId, student_id: studentId, class_date: today, status, marked_by: teacherTgId },
    { onConflict: 'group_id,student_id,class_date' }
  )

  // Notify parent when student is absent
  if (status === 'absent') {
    const { data: student } = await admin
      .from('students')
      .select('name, parent_telegram_id')
      .eq('id', studentId)
      .single()

    if (student?.parent_telegram_id) {
      const msg = `⚠️ <b>Attendance Alert</b>\n\n<b>${student.name}</b> was marked <b>absent</b> from today's class (${today}).\n\nIf you have any questions, please contact SAT Samarkand.\n\n📚 SAT Samarkand`
      await sendTelegramMessage(student.parent_telegram_id, msg)
    }
  }

  redirect(`/teacher/class/${groupId}`)
}

async function addScore(formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const math    = formData.get('math_score')    ? parseInt(formData.get('math_score')    as string) : null
  const reading = formData.get('reading_score') ? parseInt(formData.get('reading_score') as string) : null
  const total   = parseInt(formData.get('total_score') as string)
  const addedBy   = formData.get('added_by')   ? parseInt(formData.get('added_by')   as string) : null
  const studentId = formData.get('student_id') as string

  await admin.from('score_history').insert({
    student_id:    studentId,
    test_date:     formData.get('test_date')  as string,
    math_score:    math,
    reading_score: reading,
    total_score:   total,
    test_type:     formData.get('test_type')  as string,
    notes:         (formData.get('notes') as string) || null,
    added_by:      addedBy,
  })
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
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

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

  const submissionMap  = Object.fromEntries(submissions?.map(s => [s.student_id, s]) ?? [])
  const attendanceMap  = Object.fromEntries(attendance?.map(a => [a.student_id, a.status]) ?? [])

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const teacherTgId = match ? parseInt(match[1]) : null

  const markAttendanceWithCtx = markAttendance.bind(null, params.groupId, teacherTgId)

  const presentCount   = Object.values(attendanceMap).filter(s => s === 'present').length
  const submittedCount = submissions?.length ?? 0
  const totalStudents  = students?.length ?? 0

  const ATTENDANCE_BTN: Record<string, { label: string; active: { bg: string; color: string }; icon: string }> = {
    present: { label: 'Present', icon: '✓', active: { bg: '#34C759', color: '#fff' } },
    late:    { label: 'Late',    icon: '~', active: { bg: '#FF9500', color: '#fff' } },
    absent:  { label: 'Absent', icon: '✗', active: { bg: '#FF3B30', color: '#fff' } },
  }

  return (
    <div className="space-y-4">
      {/* Back + title */}
      <div>
        <Link href="/teacher/dashboard"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Classes
        </Link>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>{group.name}</h1>
        <p className="text-[13px] mt-0.5 capitalize" style={{ color: 'rgba(60,60,67,0.55)' }}>
          {group.subject} · {todayLabel}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Students', value: totalStudents, color: '#1C1C1E' },
          { label: 'Present',  value: presentCount,  color: '#34C759' },
          { label: 'HW Done',  value: submittedCount, color: '#1B4FD8' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[24px] font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
          Attendance — {today}
        </p>
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {!students?.length ? (
            <div className="p-8 text-center">
              <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>No students in this group</p>
            </div>
          ) : (
            students.map((s, i) => {
              const current = attendanceMap[s.id]
              const sub = submissionMap[s.id]
              return (
                <div key={s.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-[13px] font-bold"
                    style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: '#1C1C1E' }}>{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px]" style={{ color: 'rgba(60,60,67,0.45)' }}>
                        {s.current_score ?? '—'} → {s.target_score ?? '—'}
                      </p>
                      {todayAssignment && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: sub ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.10)',
                            color: sub ? '#1E8A3C' : '#C0281F',
                          }}>
                          {sub ? `✓ ${sub.score}/${sub.total}` : '✗ No HW'}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Attendance buttons */}
                  <div className="flex gap-1 shrink-0">
                    {(['present', 'late', 'absent'] as const).map(status => {
                      const btn = ATTENDANCE_BTN[status]
                      const isActive = current === status
                      return (
                        <form key={status} action={markAttendanceWithCtx}>
                          <input type="hidden" name="student_id" value={s.id} />
                          <input type="hidden" name="status" value={status} />
                          <button type="submit"
                            className="w-8 h-8 rounded-xl text-[13px] font-bold transition-all active:scale-90"
                            style={isActive
                              ? { background: btn.active.bg, color: btn.active.color }
                              : { background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.40)' }
                            }>
                            {btn.icon}
                          </button>
                        </form>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Log SAT Score */}
      {students && students.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
            Log SAT Score
          </p>
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <form action={addScore} className="space-y-4">
              <input type="hidden" name="group_id"  value={params.groupId} />
              <input type="hidden" name="added_by"  value={teacherTgId ?? ''} />

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Student</label>
                <select name="student_id" required
                  className="w-full rounded-xl px-3 py-2.5 text-[14px] bg-white"
                  style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Test Date</label>
                  <input name="test_date" type="date" required defaultValue={today}
                    className="w-full rounded-xl px-3 py-2.5 text-[14px]"
                    style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Type</label>
                  <select name="test_type"
                    className="w-full rounded-xl px-3 py-2.5 text-[14px] bg-white"
                    style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }}>
                    <option value="practice">Practice</option>
                    <option value="diagnostic">Diagnostic</option>
                    <option value="official">Official</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Math Score</label>
                  <input name="math_score" type="number" min="200" max="800" placeholder="200–800"
                    className="w-full rounded-xl px-3 py-2.5 text-[14px]"
                    style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Reading/Writing</label>
                  <input name="reading_score" type="number" min="200" max="800" placeholder="200–800"
                    className="w-full rounded-xl px-3 py-2.5 text-[14px]"
                    style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Total Score *</label>
                <input name="total_score" type="number" required min="400" max="1600" placeholder="400–1600"
                  className="w-full rounded-xl px-3 py-2.5 text-[14px]"
                  style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Notes</label>
                <input name="notes" placeholder="Optional…"
                  className="w-full rounded-xl px-3 py-2.5 text-[14px]"
                  style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
              </div>

              <button type="submit"
                className="w-full rounded-xl py-3 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: '#1B4FD8' }}>
                Save Score
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign HW link */}
      <Link href="/teacher/assign"
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-[14px] font-bold transition-all active:scale-[0.98]"
        style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75-6.75a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
          <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
        </svg>
        Assign Homework
      </Link>
    </div>
  )
}
