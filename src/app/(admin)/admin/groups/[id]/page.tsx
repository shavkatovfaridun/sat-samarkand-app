import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_PILL: Record<string, { bg: string; color: string }> = {
  active:   { bg: 'rgba(52,199,89,0.12)',  color: '#1E8A3C' },
  upcoming: { bg: 'rgba(27,79,216,0.10)',  color: '#1B4FD8' },
  full:     { bg: 'rgba(255,149,0,0.12)',  color: '#B86800' },
}

const ATT_PILL: Record<string, { bg: string; color: string; label: string }> = {
  present: { bg: 'rgba(52,199,89,0.12)',  color: '#1E8A3C', label: 'Present' },
  late:    { bg: 'rgba(255,149,0,0.12)',  color: '#B86800', label: 'Late' },
  absent:  { bg: 'rgba(255,59,48,0.10)', color: '#C0281F', label: 'Absent' },
}

const INPUT       = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const admin    = createAdminClient()

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
      .select('id, name, subject, status, current_score, target_score')
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

  const teacherMap   = Object.fromEntries(teachers?.map(t => [t.telegram_id, t.name]) ?? [])
  const attendanceMap = Object.fromEntries(todayAttendance?.map(a => [a.student_id, a.status]) ?? [])
  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length
  const teacherName  = teacherMap[group.teacher_id] ?? 'No teacher'

  const statusPill = STATUS_PILL[group.status] ?? { bg: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.55)' }

  async function addStudentToGroup(formData: FormData) {
    'use server'
    const a         = createAdminClient()
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
    const a         = createAdminClient()
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
    <div className="max-w-2xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-1">
        <Link href="/admin/groups"
          className="text-[13px] font-medium" style={{ color: '#1B4FD8' }}>
          Groups
        </Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" style={{ color: 'rgba(60,60,67,0.30)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-[13px] font-semibold truncate" style={{ color: '#1C1C1E' }}>{group.name}</span>
      </div>

      {/* Hero card */}
      <div className="rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1340B0,#1B4FD8,#2563EB)', boxShadow: '0 8px 32px rgba(27,79,216,0.28)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Group</p>
            <h1 className="text-[24px] font-bold text-white leading-tight">{group.name}</h1>
            <p className="text-[13px] mt-1 capitalize" style={{ color: 'rgba(255,255,255,0.70)' }}>
              {group.subject} · {teacherName}{group.room ? ` · ${group.room}` : ''}
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize shrink-0"
            style={{ background: 'rgba(255,255,255,0.20)', color: 'white' }}>
            {group.status}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Students', value: students?.length ?? 0 },
            { label: 'Present today', value: presentCount },
            { label: 'Capacity', value: group.max_capacity },
          ].map(s => (
            <div key={s.label} className="rounded-2xl py-3 px-3 text-center"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <p className="text-[22px] font-bold text-white">{s.value}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule */}
      {(group.schedule as Array<{ day: string; startTime: string; endTime: string }>)?.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Schedule</p>
          </div>
          {(group.schedule as Array<{ day: string; startTime: string; endTime: string }>).map((s, i) => (
            <div key={s.day} className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid rgba(60,60,67,0.07)' }}>
              <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>{s.day}</p>
              <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.55)' }}>{s.startTime} – {s.endTime}</p>
            </div>
          ))}
        </div>
      )}

      {/* Students list */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Students</p>
          <Link href={`/teacher/class/${params.id}`}
            className="text-[12px] font-semibold" style={{ color: '#1B4FD8' }}>
            Class view →
          </Link>
        </div>

        {!students?.length ? (
          <div className="px-4 pb-4 pt-2">
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>No students in this group yet.</p>
          </div>
        ) : (
          students.map((s, i) => {
            const att = attendanceMap[s.id]
            const attPill = att ? ATT_PILL[att] : null
            const initials = s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3"
                style={{ borderTop: '1px solid rgba(60,60,67,0.07)' }}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#1340B0,#1B4FD8)' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/students/${s.id}`}
                      className="text-[13px] font-semibold truncate hover:underline"
                      style={{ color: '#1C1C1E' }}>
                      {s.name}
                    </Link>
                    {attPill && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: attPill.bg, color: attPill.color }}>
                        {attPill.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 capitalize" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {s.subject} · {s.current_score ?? '—'} → {s.target_score ?? '—'}
                  </p>
                </div>
                <form action={removeStudentFromGroup}>
                  <input type="hidden" name="student_id" value={s.id} />
                  <button type="submit"
                    className="text-[12px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 shrink-0"
                    style={{ background: 'rgba(255,59,48,0.08)', color: '#C0281F' }}>
                    Remove
                  </button>
                </form>
              </div>
            )
          })
        )}
      </div>

      {/* Add student */}
      {availableStudents && availableStudents.length > 0 && (
        <form action={addStudentToGroup} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Add Student</p>
          <div className="flex gap-2">
            <select name="student_id" className={`flex-1 ${INPUT.replace('w-full ', '')}`} style={INPUT_STYLE}>
              <option value="">— Select student —</option>
              {availableStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>
              ))}
            </select>
            <button type="submit"
              className="px-5 rounded-xl text-[14px] font-bold text-white transition-all active:scale-95"
              style={{ background: '#1B4FD8' }}>
              Add
            </button>
          </div>
        </form>
      )}

      {/* Change status */}
      <form action={updateGroupStatus} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Group Status</p>
        <div className="flex gap-2">
          <select name="status" defaultValue={group.status} className={`flex-1 ${INPUT.replace('w-full ', '')}`} style={INPUT_STYLE}>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="full">Full</option>
          </select>
          <button type="submit"
            className="px-5 rounded-xl text-[14px] font-bold text-white transition-all active:scale-95"
            style={{ background: '#1B4FD8' }}>
            Save
          </button>
        </div>
      </form>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2.5 pb-4">
        <Link href={`/teacher/class/${params.id}`}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 transition-all hover:bg-[rgba(0,0,0,0.01)] active:scale-[0.98]"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(27,79,216,0.10)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: '#1B4FD8' }}>
              <path fillRule="evenodd" d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 18.375V5.625zm1.5 0v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5A.375.375 0 003 5.625zm16.125-.375a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 7.125v-1.5a.375.375 0 00-.375-.375h-1.5zM21 9.375A.375.375 0 0020.625 9h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5A.375.375 0 0021 10.875v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zm0 3.75a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5a.375.375 0 00.375-.375v-1.5zM4.875 18.75a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375h1.5zM3.375 15h1.5a.375.375 0 00.375-.375v-1.5a.375.375 0 00-.375-.375h-1.5a.375.375 0 00-.375.375v1.5c0 .207.168.375.375.375zm0-3.75h1.5a.375.375 0 00.375-.375v-1.5A.375.375 0 004.875 9h-1.5A.375.375 0 003 9.375v1.5c0 .207.168.375.375.375zm4.125 0a.75.75 0 000 1.5h9a.75.75 0 000-1.5H7.5zm0 3.75a.75.75 0 000 1.5h9a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>Take Attendance</p>
        </Link>
        <Link href={`/admin/groups/${params.id}/edit`}
          className="bg-white rounded-2xl p-4 flex items-center gap-3 transition-all hover:bg-[rgba(0,0,0,0.01)] active:scale-[0.98]"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(120,120,128,0.08)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: 'rgba(60,60,67,0.60)' }}>
              <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
              <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>Edit Group</p>
        </Link>
      </div>
    </div>
  )
}
