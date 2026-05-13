import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#ECFDF5] text-emerald-700',
  upcoming: 'bg-[#EEF3FF] text-[#1B4FD8]',
  full: 'bg-[#FFFBEB] text-amber-700',
}

const STUDENT_STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#ECFDF5] text-emerald-700',
  paused: 'bg-[#FFFBEB] text-amber-700',
  graduated: 'bg-[#EEF3FF] text-[#1B4FD8]',
  dropped: 'bg-[#F1F5F9] text-slate-500',
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!group) notFound()

  const [
    { data: students },
    { data: availableStudents },
    { data: teachers },
    { data: todayAttendance },
  ] = await Promise.all([
    supabase.from('students')
      .select('id, name, subject, status, current_score, target_score, telegram_id')
      .eq('group_id', params.id)
      .order('name'),
    supabase.from('students')
      .select('id, name, subject')
      .is('group_id', null)
      .eq('status', 'active')
      .order('name'),
    supabase.from('users').select('telegram_id, name').eq('role', 'teacher'),
    supabase.from('attendance')
      .select('student_id, status')
      .eq('group_id', params.id)
      .eq('class_date', new Date().toISOString().slice(0, 10)),
  ])

  const teacherMap = Object.fromEntries(teachers?.map((t) => [t.telegram_id, t.name]) ?? [])
  const attendanceMap = Object.fromEntries(todayAttendance?.map(a => [a.student_id, a.status]) ?? [])
  const today = new Date().toISOString().slice(0, 10)

  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
  const teacherName = teacherMap[group.teacher_id] ?? 'No teacher'

  async function addStudentToGroup(formData: FormData) {
    'use server'
    const a = createAdminClient()
    const studentId = formData.get('student_id') as string
    if (!studentId) return
    await a.from('students').update({ group_id: params.id }).eq('id', studentId)
    const currentIds: string[] = group.student_ids ?? []
    if (!currentIds.includes(studentId)) {
      await a.from('groups').update({ student_ids: [...currentIds, studentId] }).eq('id', params.id)
    }
    redirect(`/admin/groups/${params.id}`)
  }

  async function removeStudentFromGroup(formData: FormData) {
    'use server'
    const a = createAdminClient()
    const studentId = formData.get('student_id') as string
    if (!studentId) return
    await a.from('students').update({ group_id: null }).eq('id', studentId)
    const updatedIds = (group.student_ids ?? []).filter((id: string) => id !== studentId)
    await a.from('groups').update({ student_ids: updatedIds }).eq('id', params.id)
    redirect(`/admin/groups/${params.id}`)
  }

  async function updateGroupStatus(formData: FormData) {
    'use server'
    const a = createAdminClient()
    await a.from('groups').update({ status: formData.get('status') }).eq('id', params.id)
    redirect(`/admin/groups/${params.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/groups" className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← Groups</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340] truncate">{group.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A2340]">{group.name}</h1>
            <p className="text-[#6B7B9C] text-sm capitalize mt-0.5">{group.subject} · {teacherName}</p>
            <p className="text-[#6B7B9C] text-xs mt-0.5">{students?.length ?? 0} / {group.max_capacity} students{group.room ? ` · ${group.room}` : ''}</p>
          </div>
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[group.status] ?? 'bg-[#F5F7FF] text-[#6B7B9C]'}`}>
            {group.status}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#F5F7FF] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#1A2340]">{students?.length ?? 0}</p>
            <p className="text-[10px] text-[#6B7B9C] mt-0.5">Students</p>
          </div>
          <div className="bg-[#ECFDF5] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-700">{presentCount}</p>
            <p className="text-[10px] text-[#6B7B9C] mt-0.5">Present today</p>
          </div>
          <div className="bg-[#EEF3FF] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#1B4FD8]">{group.max_capacity}</p>
            <p className="text-[10px] text-[#6B7B9C] mt-0.5">Capacity</p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      {(group.schedule as Array<{ day: string; startTime: string; endTime: string }>)?.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Schedule</p>
          <div className="space-y-2">
            {(group.schedule as Array<{ day: string; startTime: string; endTime: string }>).map((s) => (
              <div key={s.day} className="flex items-center justify-between py-1.5 border-b border-[#F5F7FF] last:border-0">
                <span className="text-sm font-medium text-[#1A2340]">{s.day}</span>
                <span className="text-sm text-[#6B7B9C]">{s.startTime} – {s.endTime}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Students</p>
          <Link href={`/teacher/class/${params.id}`} className="text-xs font-semibold text-[#1B4FD8]">Class view →</Link>
        </div>

        {!students?.length ? (
          <p className="text-[#6B7B9C] text-sm">No students in this group yet.</p>
        ) : (
          <div className="space-y-2">
            {students.map((s) => {
              const att = attendanceMap[s.id]
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-[#F5F7FF] last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/students/${s.id}`} className="text-sm font-semibold text-[#1A2340] hover:text-[#1B4FD8] truncate">
                        {s.name}
                      </Link>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STUDENT_STATUS_STYLES[s.status] ?? ''}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-[#6B7B9C] capitalize">{s.subject}</p>
                      <p className="text-xs text-[#6B7B9C]">{s.current_score ?? '—'} → {s.target_score ?? '—'}</p>
                      {att && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          att === 'present' ? 'bg-[#ECFDF5] text-emerald-700' :
                          att === 'late' ? 'bg-[#FFFBEB] text-amber-700' :
                          'bg-[#FEF2F2] text-red-700'
                        }`}>
                          {att === 'present' ? '✓' : att === 'late' ? '~' : '✗'} {att}
                        </span>
                      )}
                    </div>
                  </div>
                  <form action={removeStudentFromGroup}>
                    <input type="hidden" name="student_id" value={s.id} />
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 shrink-0 px-2 py-1">Remove</button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add student */}
      {availableStudents && availableStudents.length > 0 && (
        <form action={addStudentToGroup} className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Add Student</p>
          <div className="flex gap-2">
            <select name="student_id" className="flex-1 border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
              <option value="">— Select student —</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>
              ))}
            </select>
            <button type="submit" className="px-5 py-2.5 bg-[#1B4FD8] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">
              Add
            </button>
          </div>
        </form>
      )}

      {/* Change status */}
      <form action={updateGroupStatus} className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Group Status</p>
        <div className="flex gap-2">
          <select name="status" defaultValue={group.status}
            className="flex-1 border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="full">Full</option>
          </select>
          <button type="submit" className="px-5 py-2.5 bg-[#1B4FD8] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">
            Save
          </button>
        </div>
      </form>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/teacher/class/${params.id}`}
          className="bg-[#EEF3FF] rounded-2xl p-4 text-center hover:bg-[#D4E0FC] transition-colors">
          <p className="text-xl mb-1">📋</p>
          <p className="text-sm font-semibold text-[#1B4FD8]">Take Attendance</p>
        </Link>
        <Link href={`/admin/groups/${params.id}/edit`}
          className="bg-white rounded-2xl p-4 text-center border border-[#E2E8F5] hover:border-[#C7D7FA] transition-colors">
          <p className="text-xl mb-1">✏️</p>
          <p className="text-sm font-semibold text-[#1A2340]">Edit Group</p>
        </Link>
      </div>
    </div>
  )
}
