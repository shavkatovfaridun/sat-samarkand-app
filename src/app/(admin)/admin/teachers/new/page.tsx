import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function createTeacher(formData: FormData) {
  'use server'
  const admin = createAdminClient()

  const telegramId = parseInt(formData.get('telegram_id') as string)
  const name = formData.get('name') as string
  const username = formData.get('username') as string || null

  if (!telegramId || !name) return

  await admin.from('users').upsert(
    { telegram_id: telegramId, name, telegram_username: username, role: 'teacher', last_active_at: new Date().toISOString() },
    { onConflict: 'telegram_id' }
  )

  redirect('/admin/teachers')
}

export default function NewTeacherPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/teachers" className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← Teachers</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340]">Add Teacher</span>
      </div>

      <form action={createTeacher} className="space-y-4 max-w-lg">
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] space-y-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide">Teacher Info</p>

          <div>
            <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Full Name *</label>
            <input name="name" required placeholder="e.g. Bobur Toshmatov"
              className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Telegram ID *</label>
            <input name="telegram_id" required type="number" placeholder="e.g. 123456789"
              className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            <p className="text-xs text-[#6B7B9C] mt-1">Ask the teacher to message @userinfobot in Telegram to get their ID</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2340] mb-1.5">Telegram Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7B9C] text-sm">@</span>
              <input name="username" placeholder="username (without @)"
                className="w-full border border-[#E2E8F5] rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
          </div>
        </div>

        <div className="bg-[#EEF3FF] rounded-2xl p-4 border border-[#C7D7FA]">
          <p className="text-xs text-[#1B4FD8] font-medium">
            💡 After adding the teacher, they can log in via the app and will have access to the Teacher dashboard.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/teachers"
            className="flex-1 text-center py-3 rounded-xl border border-[#E2E8F5] text-sm font-semibold text-[#6B7B9C]">
            Cancel
          </Link>
          <button type="submit"
            className="flex-1 bg-[#1B4FD8] text-white rounded-xl py-3 text-sm font-bold active:scale-95 transition-transform">
            Add Teacher
          </button>
        </div>
      </form>
    </div>
  )
}
