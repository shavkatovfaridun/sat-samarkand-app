import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

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

    const schedule = DAYS.flatMap((day) => {
      const startTime = formData.get(`start_${day}`) as string
      const endTime = formData.get(`end_${day}`) as string
      if (!startTime || !endTime) return []
      return [{ day, startTime, endTime }]
    })

    await admin.from('groups').insert({
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      teacher_id: formData.get('teacher_id') ? parseInt(formData.get('teacher_id') as string) : null,
      max_capacity: parseInt(formData.get('max_capacity') as string || '12'),
      room: formData.get('room') as string || null,
      status: 'upcoming',
      schedule,
      student_ids: [],
    })

    redirect('/admin/groups')
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">New Group</h1>

      <form action={createGroup} className="space-y-4 bg-white rounded-xl p-6 border border-gray-100">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
          <input name="name" required placeholder="e.g. Math Group A Morning" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <select name="subject" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="math">Math</option>
            <option value="english">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
          <select name="teacher_id" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="">— Assign later —</option>
            {teachers?.map((t) => (
              <option key={t.telegram_id} value={t.telegram_id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
          <input name="max_capacity" type="number" defaultValue="12" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
          <input name="room" placeholder="e.g. Room 1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Schedule (add days with class times)</p>
          <div className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-24 shrink-0">{day}</span>
                <input type="time" name={`start_${day}`} className="border border-gray-200 rounded px-2 py-1 text-sm" />
                <span className="text-gray-400 text-sm">–</span>
                <input type="time" name={`end_${day}`} className="border border-gray-200 rounded px-2 py-1 text-sm" />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium">
          Create Group
        </button>
      </form>
    </div>
  )
}
