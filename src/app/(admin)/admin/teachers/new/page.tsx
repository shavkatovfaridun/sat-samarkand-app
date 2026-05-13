import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function createTeacher(formData: FormData) {
  'use server'
  const admin      = createAdminClient()
  const telegramId = parseInt(formData.get('telegram_id') as string)
  const name       = formData.get('name')     as string
  const username   = (formData.get('username') as string) || null

  if (!telegramId || !name) return

  await admin.from('users').upsert(
    { telegram_id: telegramId, name, telegram_username: username, role: 'teacher', last_active_at: new Date().toISOString() },
    { onConflict: 'telegram_id' }
  )
  redirect('/admin/teachers')
}

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default function NewTeacherPage() {
  return (
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href="/admin/teachers"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Teachers
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Add Teacher</h1>
      </div>

      <form action={createTeacher} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Teacher Info</p>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Full Name *</label>
            <input name="name" required placeholder="e.g. Bobur Toshmatov" className={INPUT} style={INPUT_STYLE} />
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Telegram ID *</label>
            <input name="telegram_id" required type="number" placeholder="e.g. 123456789" className={INPUT} style={INPUT_STYLE} />
            <p className="text-[11px] mt-1.5" style={{ color: 'rgba(60,60,67,0.45)' }}>
              Ask the teacher to message @userinfobot in Telegram to get their ID
            </p>
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Telegram Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-medium select-none"
                style={{ color: 'rgba(60,60,67,0.40)' }}>@</span>
              <input name="username" placeholder="username (without @)"
                className="w-full rounded-xl pl-7 pr-3 py-2.5 text-[14px] bg-white"
                style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(27,79,216,0.06)', border: '1px solid rgba(27,79,216,0.12)' }}>
          <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#1B4FD8' }}>After adding</p>
          <p className="text-[12px]" style={{ color: 'rgba(27,79,216,0.65)' }}>
            The teacher can log in via the Mini App and will have access to the Teacher dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href="/admin/teachers"
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Add Teacher
          </button>
        </div>
      </form>
    </div>
  )
}
