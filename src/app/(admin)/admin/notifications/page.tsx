import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/bot'
import { redirect } from 'next/navigation'

async function sendNotification(formData: FormData) {
  'use server'
  const admin   = createAdminClient()
  const target  = formData.get('target')    as string
  const groupId   = formData.get('group_id')   as string
  const studentId = formData.get('student_id') as string
  const message   = formData.get('message')   as string

  if (!message?.trim()) return

  const telegramIds: number[] = []

  if (target === 'everyone') {
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
      const { data: students } = await admin.from('students').select('telegram_id').in('id', group.student_ids).not('telegram_id', 'is', null)
      students?.forEach(s => s.telegram_id && telegramIds.push(s.telegram_id))
    }
  } else if (target === 'group_parents' && groupId) {
    const { data: group } = await admin.from('groups').select('student_ids').eq('id', groupId).single()
    if (group?.student_ids?.length) {
      const { data: students } = await admin.from('students').select('parent_telegram_id').in('id', group.student_ids).not('parent_telegram_id', 'is', null)
      students?.forEach(s => s.parent_telegram_id && telegramIds.push(s.parent_telegram_id))
    }
  } else if (target === 'student' && studentId) {
    const { data: student } = await admin.from('students').select('telegram_id').eq('id', studentId).single()
    if (student?.telegram_id) telegramIds.push(student.telegram_id)
  } else if (target === 'student_parent' && studentId) {
    const { data: student } = await admin.from('students').select('parent_telegram_id').eq('id', studentId).single()
    if (student?.parent_telegram_id) telegramIds.push(student.parent_telegram_id)
  }

  const unique = [...new Set(telegramIds)]
  const prefix = `📢 <b>SAT Samarkand</b>\n\n`
  await Promise.all(unique.map(id => sendTelegramMessage(id, prefix + message)))

  redirect(`/admin/notifications?sent=${unique.length}`)
}

const TARGETS = [
  { value: 'all_students',   label: 'All Students',                desc: 'Active students only',               icon: '🎓' },
  { value: 'all_parents',    label: 'All Parents',                 desc: 'Parents of active students',          icon: '👨‍👩‍👧' },
  { value: 'all_teachers',   label: 'All Teachers',                desc: 'All teachers',                        icon: '👨‍🏫' },
  { value: 'everyone',       label: 'Everyone',                    desc: 'Students, parents, teachers',          icon: '🌐' },
  { value: 'group',          label: 'Group — Students',            desc: 'Students in a specific group',         icon: '👥' },
  { value: 'group_parents',  label: 'Group — Parents',             desc: 'Parents of students in a group',      icon: '👨‍👩‍👧' },
  { value: 'student',        label: 'Specific Student',            desc: 'Send to one student',                  icon: '👤' },
  { value: 'student_parent', label: "Student's Parent",            desc: 'Send to one student\'s parent',        icon: '👨‍👩‍👦' },
]

export default async function NotificationsPage({ searchParams }: { searchParams: { sent?: string } }) {
  const admin = createAdminClient()

  const [{ data: groups }, { data: students }] = await Promise.all([
    admin.from('groups').select('id, name, subject').eq('status', 'active').order('name'),
    admin.from('students').select('id, name').eq('status', 'active').order('name'),
  ])

  const sentCount = searchParams.sent ? parseInt(searchParams.sent) : null

  const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
  const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }

  return (
    <div className="max-w-xl space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Admin</p>
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Send Notification</h1>
      </div>

      {/* Success banner */}
      {sentCount !== null && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'rgba(52,199,89,0.10)', border: '1px solid rgba(52,199,89,0.20)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(52,199,89,0.15)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ color: '#34C759' }}>
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: '#1E8A3C' }}>Message sent!</p>
            <p className="text-[12px]" style={{ color: 'rgba(30,138,60,0.70)' }}>
              Delivered to {sentCount} recipient{sentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      <form action={sendNotification} className="space-y-4">
        {/* Target */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Send To</p>
          </div>
          {TARGETS.map((opt, i) => (
            <label key={opt.value}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[rgba(0,0,0,0.02)]"
              style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : '1px solid rgba(60,60,67,0.07)' }}>
              <input type="radio" name="target" value={opt.value}
                defaultChecked={opt.value === 'all_students'}
                className="w-4 h-4 accent-[#1B4FD8] shrink-0" />
              <span className="text-base shrink-0">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>{opt.label}</p>
                <p className="text-[11px]" style={{ color: 'rgba(60,60,67,0.45)' }}>{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Group picker */}
        {groups && groups.length > 0 && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>
              Group <span style={{ color: 'rgba(60,60,67,0.40)' }}>(for group targets)</span>
            </label>
            <select name="group_id" className={INPUT} style={INPUT_STYLE}>
              <option value="">— Select group —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>)}
            </select>
          </div>
        )}

        {/* Student picker */}
        {students && students.length > 0 && (
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>
              Student <span style={{ color: 'rgba(60,60,67,0.40)' }}>(for student targets)</span>
            </label>
            <select name="student_id" className={INPUT} style={INPUT_STYLE}>
              <option value="">— Select student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Message */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Message *</label>
          <textarea name="message" required rows={5}
            placeholder="Type your message. Supports HTML: <b>bold</b>, <i>italic</i>"
            className="w-full rounded-xl px-3 py-2.5 text-[14px] resize-none"
            style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
          <p className="text-[11px] mt-2" style={{ color: 'rgba(60,60,67,0.40)' }}>
            Will be prefixed with <span style={{ color: '#1C1C1E' }}>📢 SAT Samarkand</span>
          </p>
        </div>

        <button type="submit"
          className="w-full rounded-2xl py-4 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: '#1B4FD8', boxShadow: '0 4px 16px rgba(27,79,216,0.30)' }}>
          Send Notification
        </button>
      </form>
    </div>
  )
}
