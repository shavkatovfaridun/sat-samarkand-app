import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatUZS, formatDate } from '@/lib/format'

async function addSalary(teacherId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const base = parseInt(formData.get('base_amount') as string)
  const bonus = parseInt(formData.get('bonus') as string || '0')
  await admin.from('salaries').upsert({
    teacher_id: parseInt(teacherId),
    month: formData.get('month') as string,
    base_amount: base,
    bonus,
    net_amount: base + bonus,
    status: 'unpaid',
    notes: formData.get('notes') as string || null,
  }, { onConflict: 'teacher_id,month' })
  redirect(`/admin/teachers/${teacherId}`)
}

async function markSalaryPaid(teacherId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('salaries')
    .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })
    .eq('id', formData.get('salary_id') as string)

  // Notify teacher
  const { data: teacher } = await admin.from('users').select('telegram_id, name').eq('telegram_id', parseInt(teacherId)).single()
  if (teacher?.telegram_id) {
    const { sendTelegramMessage } = await import('@/lib/bot')
    const month = formData.get('month') as string
    const amount = formData.get('amount') as string
    await sendTelegramMessage(teacher.telegram_id,
      `💰 <b>Salary Paid</b>\n\nHi ${teacher.name}!\n\nYour salary for <b>${month}</b> has been paid.\nAmount: <b>${amount}</b>\n\nThank you for your work! 🙏`)
  }

  redirect(`/admin/teachers/${teacherId}`)
}

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: teacher } = await admin
    .from('users')
    .select('telegram_id, name, telegram_username, last_active_at')
    .eq('telegram_id', parseInt(params.id))
    .eq('role', 'teacher')
    .single()

  if (!teacher) notFound()

  const [{ data: groups }, { data: salaries }] = await Promise.all([
    admin.from('groups').select('id, name, subject, student_ids').eq('teacher_id', teacher.telegram_id).order('name'),
    admin.from('salaries').select('*').eq('teacher_id', teacher.telegram_id).order('month', { ascending: false }),
  ])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const addSalaryWithId = addSalary.bind(null, params.id)
  const markSalaryPaidWithId = markSalaryPaid.bind(null, params.id)

  const totalStudents = groups?.reduce((sum, g) => sum + (g.student_ids?.length ?? 0), 0) ?? 0

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/teachers" className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← Teachers</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340]">{teacher.name}</span>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-[#EEF3FF] rounded-2xl flex items-center justify-center text-2xl">👨‍🏫</div>
          <div>
            <h1 className="text-xl font-bold text-[#1A2340]">{teacher.name}</h1>
            <p className="text-[#6B7B9C] text-sm">
              {teacher.telegram_username ? `@${teacher.telegram_username}` : `ID: ${teacher.telegram_id}`}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F7FF] rounded-xl p-3 text-center">
            <p className="text-xs text-[#6B7B9C] mb-0.5">Groups</p>
            <p className="font-bold text-[#1A2340]">{groups?.length ?? 0}</p>
          </div>
          <div className="bg-[#F5F7FF] rounded-xl p-3 text-center">
            <p className="text-xs text-[#6B7B9C] mb-0.5">Students</p>
            <p className="font-bold text-[#1A2340]">{totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Groups */}
      {groups && groups.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Groups</p>
          <div className="space-y-2">
            {groups.map(g => (
              <Link key={g.id} href={`/admin/groups/${g.id}`}
                className="flex items-center justify-between px-3 py-2.5 bg-[#F5F7FF] rounded-xl hover:bg-[#EEF3FF] transition-colors">
                <div>
                  <p className="text-sm font-semibold text-[#1A2340]">{g.name}</p>
                  <p className="text-xs text-[#6B7B9C]">{g.subject} · {g.student_ids?.length ?? 0} students</p>
                </div>
                <span className="text-[#6B7B9C]">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Add salary */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Set Salary</p>
        <form action={addSalaryWithId} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Month</label>
              <input name="month" type="month" defaultValue={currentMonth}
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Base (UZS)</label>
              <input name="base_amount" type="number" required placeholder="e.g. 3000000"
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Bonus (UZS)</label>
              <input name="bonus" type="number" defaultValue="0" placeholder="0"
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7B9C] mb-1">Notes</label>
              <input name="notes" placeholder="Optional"
                className="w-full border border-[#E2E8F5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4FD8]" />
            </div>
          </div>
          <button type="submit"
            className="w-full bg-[#1B4FD8] text-white rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform">
            Save Salary
          </button>
        </form>
      </div>

      {/* Salary history */}
      {salaries && salaries.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Salary History</p>
          <div className="space-y-2">
            {salaries.map(s => (
              <div key={s.id} className={`rounded-xl p-3 flex items-center justify-between ${
                s.status === 'paid' ? 'bg-[#ECFDF5]' : 'bg-[#FFFBEB]'
              }`}>
                <div>
                  <p className="text-sm font-semibold text-[#1A2340]">{s.month}</p>
                  <p className="text-xs text-[#6B7B9C]">
                    {formatUZS(s.base_amount)} {s.bonus > 0 ? `+ ${formatUZS(s.bonus)} bonus` : ''}
                  </p>
                  <p className="text-sm font-bold text-[#1A2340]">{formatUZS(s.net_amount)}</p>
                  {s.paid_date && <p className="text-xs text-emerald-600">Paid {formatDate(s.paid_date)}</p>}
                </div>
                {s.status === 'unpaid' ? (
                  <form action={markSalaryPaidWithId}>
                    <input type="hidden" name="salary_id" value={s.id} />
                    <input type="hidden" name="month" value={s.month} />
                    <input type="hidden" name="amount" value={formatUZS(s.net_amount)} />
                    <button type="submit"
                      className="bg-[#1B4FD8] text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                      Mark Paid
                    </button>
                  </form>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700 bg-white px-3 py-1.5 rounded-lg">✓ Paid</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
