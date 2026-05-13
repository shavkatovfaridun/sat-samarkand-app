import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const INPUT       = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL       = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default async function EditGroupPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: group }, { data: teachers }] = await Promise.all([
    supabase.from('groups').select('*').eq('id', params.id).single(),
    supabase.from('users').select('telegram_id, name').eq('role', 'teacher').order('name'),
  ])

  if (!group) notFound()

  const scheduleMap = Object.fromEntries(
    (group.schedule as Array<{ day: string; startTime: string; endTime: string }> ?? [])
      .map(s => [s.day, s])
  )

  async function updateGroup(formData: FormData) {
    'use server'
    const admin = createAdminClient()

    const schedule = DAYS.flatMap(day => {
      const startTime = formData.get(`start_${day}`) as string
      const endTime   = formData.get(`end_${day}`)   as string
      if (!startTime || !endTime) return []
      return [{ day, startTime, endTime }]
    })

    await admin.from('groups').update({
      name:         formData.get('name')         as string,
      subject:      formData.get('subject')      as string,
      teacher_id:   formData.get('teacher_id') ? parseInt(formData.get('teacher_id') as string) : null,
      max_capacity: parseInt(formData.get('max_capacity') as string || '12'),
      room:         (formData.get('room') as string) || null,
      schedule,
    }).eq('id', params.id)

    redirect(`/admin/groups/${params.id}`)
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 pt-1">
        <Link href={`/admin/groups/${params.id}`}
          className="text-[13px] font-medium" style={{ color: '#1B4FD8' }}>
          {group.name}
        </Link>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" style={{ color: 'rgba(60,60,67,0.30)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>Edit</span>
      </div>

      <div>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Edit Group</h1>
      </div>

      <form action={updateGroup} className="space-y-4">
        {/* Group Info */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Group Info</p>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Group Name *</label>
            <input name="name" required defaultValue={group.name} className={INPUT} style={INPUT_STYLE} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Subject</label>
              <select name="subject" defaultValue={group.subject} className={INPUT} style={INPUT_STYLE}>
                <option value="math">Math</option>
                <option value="english">English</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Max Capacity</label>
              <input name="max_capacity" type="number" defaultValue={group.max_capacity}
                className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Teacher</label>
            <select name="teacher_id" defaultValue={group.teacher_id ?? ''} className={INPUT} style={INPUT_STYLE}>
              <option value="">— No teacher —</option>
              {teachers?.map(t => (
                <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Room</label>
            <input name="room" defaultValue={group.room ?? ''} placeholder="e.g. Room 1"
              className={INPUT} style={INPUT_STYLE} />
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'rgba(60,60,67,0.45)' }}>Schedule</p>
          <div className="space-y-3">
            {DAYS.map((day, i) => {
              const s = scheduleMap[day]
              return (
                <div key={day} className="flex items-center gap-3 py-2"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : undefined }}>
                  <span className="text-[13px] font-semibold w-10 shrink-0" style={{ color: '#1C1C1E' }}>
                    {day.slice(0, 3)}
                  </span>
                  <input type="time" name={`start_${day}`} defaultValue={s?.startTime ?? ''}
                    className="flex-1 rounded-xl px-3 py-2 text-[14px] bg-white"
                    style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
                  <span className="text-[13px]" style={{ color: 'rgba(60,60,67,0.40)' }}>–</span>
                  <input type="time" name={`end_${day}`} defaultValue={s?.endTime ?? ''}
                    className="flex-1 rounded-xl px-3 py-2 text-[14px] bg-white"
                    style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href={`/admin/groups/${params.id}`}
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
