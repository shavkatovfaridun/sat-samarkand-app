import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export default async function TeachersPage() {
  const admin = createAdminClient()

  const { data: teachers } = await admin
    .from('users')
    .select('telegram_id, name, telegram_username')
    .eq('role', 'teacher')
    .order('name')

  const currentMonth = new Date().toISOString().slice(0, 7)

  // Get salary status for each teacher this month
  const { data: salaries } = await admin
    .from('salaries')
    .select('teacher_id, net_amount, status')
    .eq('month', currentMonth)

  const salaryByTeacher = Object.fromEntries(
    salaries?.map(s => [s.teacher_id, s]) ?? []
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Team</p>
          <h1 className="text-2xl font-bold text-[#1A2340]">Teachers</h1>
        </div>
        <Link href="/admin/teachers/new"
          className="bg-[#1B4FD8] text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
          + Add
        </Link>
      </div>

      <div className="space-y-2">
        {!teachers?.length ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F5]">
            <p className="text-3xl mb-2">👨‍🏫</p>
            <p className="text-[#6B7B9C] text-sm">No teachers yet</p>
          </div>
        ) : (
          teachers.map(t => {
            const salary = salaryByTeacher[t.telegram_id]
            return (
              <Link key={t.telegram_id} href={`/admin/teachers/${t.telegram_id}`}
                className="flex items-center justify-between bg-white rounded-2xl px-4 py-3.5 border border-[#E2E8F5] hover:border-[#C7D7FA] active:scale-[0.99] transition-all">
                <div>
                  <p className="font-semibold text-[#1A2340]">{t.name}</p>
                  <p className="text-xs text-[#6B7B9C] mt-0.5">
                    {t.telegram_username ? `@${t.telegram_username}` : `ID: ${t.telegram_id}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {salary ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      salary.status === 'paid'
                        ? 'bg-[#ECFDF5] text-emerald-700'
                        : 'bg-[#FFFBEB] text-amber-700'
                    }`}>
                      {salary.status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#F1F5F9] text-slate-500">No salary</span>
                  )}
                  <span className="text-[#6B7B9C]">›</span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
