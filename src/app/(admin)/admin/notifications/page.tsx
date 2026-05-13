import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/bot'
import { redirect } from 'next/navigation'

async function sendNotification(formData: FormData) {
  'use server'
  const admin = createAdminClient()

  const target = formData.get('target') as string
  const groupId = formData.get('group_id') as string
  const studentId = formData.get('student_id') as string
  const message = formData.get('message') as string

  if (!message?.trim()) return

  const telegramIds: number[] = []

  if (target === 'everyone') {
    // All users with a telegram_id
    const { data } = await admin.from('users').select('telegram_id').not('telegram_id', 'is', null)
    data?.forEach(u => u.telegram_id && telegramIds.push(u.telegram_id))

  } else if (target === 'all_students') {
    const { data } = await admin.from('students').select('telegram_id').eq('status', 'active').not('telegram_id', 'is', null)
    data?.forEach(s => s.telegram_id && telegramIds.push(s.telegram_id))

  } else if (target === 'all_parents') {
    const { data } = await admin.from('students').select('parent_telegram_id').eq('status', 'active').not('parent_telegram_id', 'is', null)
    data?.forEach(s => s.parent_telegram_id && telegramIds.push(s.parent_telegram_id))

  } else if (target === 'all_teachers') {
    const { data } = await admin.from('users').select('telegram_id').eq('role', 'teacher').not('telegram_id', 'is', null)
    data?.forEach(u => u.telegram_id && telegramIds.push(u.telegram_id))

  } else if (target === 'group' && groupId) {
    const { data: group } = await admin.from('groups').select('student_ids').eq('id', groupId).single()
    if (group?.student_ids?.length) {
      const { data: students } = await admin
        .from('students')
        .select('telegram_id')
        .in('id', group.student_ids)
        .not('telegram_id', 'is', null)
      students?.forEach(s => s.telegram_id && telegramIds.push(s.telegram_id))
    }

  } else if (target === 'group_parents' && groupId) {
    const { data: group } = await admin.from('groups').select('student_ids').eq('id', groupId).single()
    if (group?.student_ids?.length) {
      const { data: students } = await admin
        .from('students')
        .select('parent_telegram_id')
        .in('id', group.student_ids)
        .not('parent_telegram_id', 'is', null)
      students?.forEach(s => s.parent_telegram_id && telegramIds.push(s.parent_telegram_id))
    }

  } else if (target === 'student' && studentId) {
    const { data: student } = await admin.from('students').select('telegram_id').eq('id', studentId).single()
    if (student?.telegram_id) telegramIds.push(student.telegram_id)

  } else if (target === 'student_parent' && studentId) {
    const { data: student } = await admin.from('students').select('parent_telegram_id').eq('id', studentId).single()
    if (student?.parent_telegram_id) telegramIds.push(student.parent_telegram_id)
  }

  // Deduplicate
  const unique = [...new Set(telegramIds)]

  // Send all messages
  const prefix = `📢 <b>SAT Samarkand</b>\n\n`
  await Promise.all(unique.map(id => sendTelegramMessage(id, prefix + message)))

  redirect(`/admin/notifications?sent=${unique.length}`)
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: { sent?: string }
}) {
  const admin = createAdminClient()

  const [{ data: groups }, { data: students }] = await Promise.all([
    admin.from('groups').select('id, name, subject').eq('status', 'active').order('name'),
    admin.from('students').select('id, name').eq('status', 'active').order('name'),
  ])

  const sentCount = searchParams.sent ? parseInt(searchParams.sent) : null

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">Send Notification</h1>
      </div>

      {sentCount !== null && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 mb-5 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-emerald-800">Message sent!</p>
            <p className="text-emerald-700 text-sm">Delivered to {sentCount} recipient{sentCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      <form action={sendNotification} className="space-y-4">
        {/* Target selector */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-4">Send To</p>

          <div className="space-y-2">
            {[
              { value: 'everyone', label: '🌐 Everyone (all users)', desc: 'Students, parents, teachers' },
              { value: 'all_students', label: '🎓 All Students', desc: 'Active students only' },
              { value: 'all_parents', label: '👨‍👩‍👧 All Parents', desc: 'Parents of active students' },
              { value: 'all_teachers', label: '👨‍🏫 All Teachers', desc: 'All teachers' },
              { value: 'group', label: '👥 Specific Group — Students', desc: 'Select a group below' },
              { value: 'group_parents', label: '👨‍👩‍👧 Specific Group — Parents', desc: 'Parents of students in a group' },
              { value: 'student', label: '👤 Specific Student', desc: 'Select a student below' },
              { value: 'student_parent', label: '👨‍👩‍👧 Specific Student\'s Parent', desc: 'Select a student below' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F5] cursor-pointer hover:border-[#1B4FD8] has-[:checked]:border-[#1B4FD8] has-[:checked]:bg-[#EEF3FF] transition-colors">
                <input type="radio" name="target" value={opt.value} defaultChecked={opt.value === 'all_students'} className="accent-[#1B4FD8] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#1A2340]">{opt.label}</p>
                  <p className="text-xs text-[#6B7B9C]">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Group picker */}
        {groups && groups.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
            <label className="block text-sm font-medium text-[#1A2340] mb-2">
              Group <span className="text-[#6B7B9C] font-normal">(for group targets)</span>
            </label>
            <select name="group_id" className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
              <option value="">— Select group —</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
              ))}
            </select>
          </div>
        )}

        {/* Student picker */}
        {students && students.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
            <label className="block text-sm font-medium text-[#1A2340] mb-2">
              Student <span className="text-[#6B7B9C] font-normal">(for student targets)</span>
            </label>
            <select name="student_id" className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] bg-white">
              <option value="">— Select student —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Message */}
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
          <label className="block text-sm font-medium text-[#1A2340] mb-2">Message *</label>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Type your message here. Supports HTML: <b>bold</b>, <i>italic</i>"
            className="w-full border border-[#E2E8F5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B4FD8] resize-none"
          />
          <p className="text-xs text-[#6B7B9C] mt-2">
            Message will be prefixed with <span className="font-medium">📢 SAT Samarkand</span>
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-[#1B4FD8] text-white rounded-2xl py-4 text-sm font-bold active:scale-95 transition-transform"
        >
          📤 Send Notification
        </button>
      </form>
    </div>
  )
}
