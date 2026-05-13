import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatUZS, formatDate } from '@/lib/format'

async function addSalary(teacherId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const base  = parseInt(formData.get('base_amount') as string)
  const bonus = parseInt((formData.get('bonus') as string) || '0')
  await admin.from('salaries').upsert({
    teacher_id:  parseInt(teacherId),
    month:       formData.get('month') as string,
    base_amount: base,
    bonus,
    net_amount:  base + bonus,
    status:      'unpaid',
    notes:       (formData.get('notes') as string) || null,
  }, { onConflict: 'teacher_id,month' })
  redirect(`/admin/teachers/${teacherId}`)
}

async function markSalaryPaid(teacherId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('salaries')
    .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })
    .eq('id', formData.get('salary_id') as string)

  const { data: teacher } = await admin.from('users').select('telegram_id, name').eq('telegram_id', parseInt(teacherId)).single()
  if (teacher?.telegram_id) {
    const { sendTelegramMessage } = await import('@/lib/bot')
    const month  = formData.get('month')  as string
    const amount = formData.get('amount') as string
    await sendTelegramMessage(teacher.telegram_id,
      `💰 <b>Salary Paid</b>\n\nHi ${teacher.name}!\n\nYour salary for <b>${month}</b> has been paid.\nAmount: <b>${amount}</b>\n\nThank you for your work! 🙏`)
  }
  redirect(`/admin/teachers/${teacherId}`)
}

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

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

  const currentMonth   = new Date().toISOString().slice(0, 7)
  const totalStudents  = groups?.reduce((s, g) => s + (g.student_ids?.length ?? 0), 0) ?? 0
  const addSalaryWithId      = addSalary.bind(null, params.id)
  const markSalaryPaidWithId = markSalaryPaid.bind(null, params.id)

  const currentSalary = salaries?.find(s => s.month === currentMonth)

  return (
    <div className="max-w-2xl space-y-4">
      {/* Back */}
      <div className="pt-1">
        <Link href="/admin/teachers"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Teachers
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>{teacher.name}</h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>
          {teacher.telegram_username ? `@${teacher.telegram_username}` : `ID: ${teacher.telegram_id}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Groups',   value: groups?.length ?? 0,  color: '#1C1C1E' },
          { label: 'Students', value: totalStudents,          color: '#1B4FD8' },
          {
            label: 'This month',
            value: currentSalary ? (currentSalary.status === 'paid' ? '✓ Paid' : '⏳ Unpaid') : 'No salary',
            color: currentSalary?.status === 'paid' ? '#1E8A3C' : currentSalary ? '#B86800' : 'rgba(60,60,67,0.45)',
          },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[18px] font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Groups */}
      {groups && groups.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Groups</p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {groups.map((g, i) => (
              <Link key={g.id} href={`/admin/groups/${g.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-[13px] font-bold"
                  style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1C1C1E]">{g.name}</p>
                  <p className="text-[11px] capitalize mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {g.subject} · {g.student_ids?.length ?? 0} students
                  </p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0"
                  style={{ color: 'rgba(60,60,67,0.22)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Set salary */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Set Salary</p>
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <form action={addSalaryWithId} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Month</label>
                <input name="month" type="month" defaultValue={currentMonth} className={INPUT} style={INPUT_STYLE} />
              </div>
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Base (UZS)</label>
                <input name="base_amount" type="number" required placeholder="e.g. 3000000" className={INPUT} style={INPUT_STYLE} />
              </div>
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Bonus (UZS)</label>
                <input name="bonus" type="number" defaultValue="0" placeholder="0" className={INPUT} style={INPUT_STYLE} />
              </div>
              <div>
                <label className={LABEL} style={LABEL_STYLE}>Notes</label>
                <input name="notes" placeholder="Optional" className={INPUT} style={INPUT_STYLE} />
              </div>
            </div>
            <button type="submit"
              className="w-full rounded-xl py-3 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: '#1B4FD8' }}>
              Save Salary
            </button>
          </form>
        </div>
      </div>

      {/* Salary history */}
      {salaries && salaries.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Salary History</p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {salaries.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 px-4 py-4"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E]">{s.month}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'rgba(60,60,67,0.50)' }}>
                    {formatUZS(s.base_amount)}{s.bonus > 0 ? ` + ${formatUZS(s.bonus)} bonus` : ''}
                  </p>
                  <p className="text-[13px] font-bold mt-0.5" style={{ color: '#1C1C1E' }}>{formatUZS(s.net_amount)}</p>
                  {s.paid_date && (
                    <p className="text-[11px] mt-0.5" style={{ color: '#1E8A3C' }}>Paid {formatDate(s.paid_date)}</p>
                  )}
                </div>
                {s.status === 'unpaid' ? (
                  <form action={markSalaryPaidWithId} className="shrink-0">
                    <input type="hidden" name="salary_id" value={s.id} />
                    <input type="hidden" name="month"     value={s.month} />
                    <input type="hidden" name="amount"    value={formatUZS(s.net_amount)} />
                    <button type="submit"
                      className="text-[12px] font-bold px-3 py-2 rounded-xl text-white transition-all active:scale-95"
                      style={{ background: '#1B4FD8' }}>
                      Mark Paid
                    </button>
                  </form>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: 'rgba(52,199,89,0.12)', color: '#1E8A3C' }}>
                    ✓ Paid
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
