import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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

    const schedule = DAYS.flatMap((day) => {
      const startTime = formData.get(`start_${day}`) as string
      const endTime = formData.get(`end_${day}`) as string
      if (!startTime || !endTime) return []
      return [{ day, startTime, endTime }]
    })

    await admin.from('groups').update({
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      teacher_id: formData.get('teacher_id') ? parseInt(formData.get('teacher_id') as string) : null,
      max_capacity: parseInt(formData.get('max_capacity') as string || '12'),
      room: formData.get('room') as string || null,
      schedule,
    }).eq('id', params.id)

    redirect(`/admin/groups/${params.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/groups/${params.id}`} className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← {group.name}</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340]">Edit</span>
      </div>

      <form action={updateGroup} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] space-y-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Group Info</p>

          <div>
            <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Group Name *</label>
            <input name="name" required defaultValue={group.name}
              className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Subject</label>
              <select name="subject" defaultValue={group.subject}
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
                <option value="math">Math</option>
                <option value="english">English</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Max Capacity</label>
              <input name="max_capacity" type="number" defaultValue={group.max_capacity}
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Teacher</label>
            <select name="teacher_id" defaultValue={group.teacher_id ?? ''}
              className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
              <option value="">— No teacher —</option>
              {teachers?.map((t) => (
                <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Room</label>
            <input name="room" defaultValue={group.room ?? ''}
              placeholder="e.g. Room 1"
              className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Schedule</p>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const s = scheduleMap[day]
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-sm text-[#1A2340] w-24 shrink-0 font-medium">{day.slice(0, 3)}</span>
                  <input type="time" name={`start_${day}`} defaultValue={s?.startTime ?? ''}
                    className="flex-1 border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
                  <span className="text-[#6B7B9C] text-sm">–</span>
                  <input type="time" name={`end_${day}`} defaultValue={s?.endTime ?? ''}
                    className="flex-1 border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
                </div>
              )
            })}
          </div>
        </div>

        <button type="submit"
          className="w-full bg-[#1B4FD8] text-white rounded-2xl py-3.5 text-sm font-bold active:scale-95 transition-transform">
          Save Changes
        </button>
      </form>
    </div>
  )
}
