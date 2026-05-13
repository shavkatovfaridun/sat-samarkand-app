import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default async function NewGroupPage() {
  const supabase = createClient()

  const { data: teachers } = await supabase
    .from('users')
    .select('telegram_id, name')
    .eq('role', 'teacher')
    .order('name')

  async function createGroup(formData: FormData) {
    'use server'
    const admin = createAdminClient()

    const schedule = DAYS.flatMap(day => {
      const startTime = formData.get(`start_${day}`) as string
      const endTime   = formData.get(`end_${day}`)   as string
      if (!startTime || !endTime) return []
      return [{ day, startTime, endTime }]
    })

    await admin.from('groups').insert({
      name:         formData.get('name')         as string,
      subject:      formData.get('subject')      as string,
      teacher_id:   formData.get('teacher_id')   ? parseInt(formData.get('teacher_id') as string) : null,
      max_capacity: parseInt((formData.get('max_capacity') as string) || '12'),
      room:         (formData.get('room') as string) || null,
      status:       'upcoming',
      schedule,
      student_ids:  [],
    })

    redirect('/admin/groups')
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href="/admin/groups"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Groups
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>New Group</h1>
      </div>

      <form action={createGroup} className="space-y-4">
        {/* Details */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Details</p>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Group Name *</label>
            <input name="name" required placeholder="e.g. Math Group A — Morning" className={INPUT} style={INPUT_STYLE} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Subject *</label>
              <select name="subject" required className={INPUT} style={INPUT_STYLE}>
                <option value="math">Math</option>
                <option value="english">English</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Max Capacity</label>
              <input name="max_capacity" type="number" defaultValue="12" min="1" max="30" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Teacher</label>
              <select name="teacher_id" className={INPUT} style={INPUT_STYLE}>
                <option value="">— Assign later —</option>
                {teachers?.map(t => <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Room</label>
              <input name="room" placeholder="e.g. Room 1" className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1" style={{ color: 'rgba(60,60,67,0.45)' }}>Schedule</p>
          <p className="text-[12px] mb-4" style={{ color: 'rgba(60,60,67,0.40)' }}>Leave blank to skip a day</p>
          <div className="space-y-3">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3">
                <p className="text-[13px] font-medium w-24 shrink-0" style={{ color: '#1C1C1E' }}>{day}</p>
                <input type="time" name={`start_${day}`}
                  className="flex-1 rounded-xl px-3 py-2 text-[13px]"
                  style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
                <span className="text-[13px]" style={{ color: 'rgba(60,60,67,0.35)' }}>–</span>
                <input type="time" name={`end_${day}`}
                  className="flex-1 rounded-xl px-3 py-2 text-[13px]"
                  style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href="/admin/groups"
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Create Group
          </button>
        </div>
      </form>
    </div>
  )
}
