import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatUZS, formatDate } from '@/lib/format'

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-[#ECFDF5] text-emerald-700',
  unpaid: 'bg-[#FFFBEB] text-amber-700',
  overdue: 'bg-[#FEF2F2] text-red-700',
  partial: 'bg-[#FFF7ED] text-orange-700',
  frozen: 'bg-[#F1F5F9] text-slate-500',
}

export default async function FinancePage({ searchParams }: { searchParams: { status?: string; month?: string } }) {
  const supabase = createClient()

  const currentMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  let query = supabase
    .from('payments')
    .select(`id, month, subject, net_amount, status, due_date, paid_date, receipt_sent, students(id, name)`)
    .order('due_date', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (!searchParams.status) query = query.eq('month', currentMonth)

  const { data: payments } = await query

  const { data: summaryData } = await supabase
    .from('payments')
    .select('status, net_amount')
    .eq('month', currentMonth)

  const totalExpected = summaryData?.reduce((sum, p) => sum + (p.net_amount ?? 0), 0) ?? 0
  const totalReceived = summaryData?.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.net_amount, 0) ?? 0
  const totalOverdue = summaryData?.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + p.net_amount, 0) ?? 0

  const filters = [
    { value: '', label: 'This Month' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'partial', label: 'Partial' },
    { value: 'frozen', label: 'Frozen' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Payments</p>
          <h1 className="text-2xl font-bold text-[#1A2340]">Finance</h1>
        </div>
        <Link
          href="/admin/finance/new"
          className="bg-[#1B4FD8] text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          + Add
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-3 border border-[#E2E8F5] text-center">
          <p className="text-[10px] text-[#6B7B9C] font-medium uppercase tracking-wide mb-1">Expected</p>
          <p className="font-bold text-xs text-[#1A2340]">{formatUZS(totalExpected)}</p>
        </div>
        <div className="bg-[#ECFDF5] rounded-2xl p-3 border border-[#A7F3D0] text-center">
          <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide mb-1">Received</p>
          <p className="font-bold text-xs text-emerald-700">{formatUZS(totalReceived)}</p>
        </div>
        <div className="bg-[#FEF2F2] rounded-2xl p-3 border border-[#FECACA] text-center">
          <p className="text-[10px] text-red-600 font-medium uppercase tracking-wide mb-1">Overdue</p>
          <p className="font-bold text-xs text-red-700">{formatUZS(totalOverdue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {filters.map((f) => {
          const isActive = f.value
            ? searchParams.status === f.value
            : !searchParams.status
          return (
            <Link
              key={f.value}
              href={f.value ? `/admin/finance?status=${f.value}` : `/admin/finance?month=${currentMonth}`}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                isActive
                  ? 'bg-[#1B4FD8] text-white border-[#1B4FD8]'
                  : 'bg-white text-[#6B7B9C] border-[#E2E8F5] hover:border-[#1B4FD8] hover:text-[#1B4FD8]'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className="space-y-2">
        {!payments?.length ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F5]">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-[#6B7B9C] text-sm">No payments found</p>
          </div>
        ) : (
          payments.map((p) => {
            const student = (p.students as unknown) as { id: string; name: string } | null
            return (
              <div key={p.id} className="bg-white rounded-2xl px-4 py-3.5 border border-[#E2E8F5]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1A2340] truncate">
                      {student ? (
                        <Link href={`/admin/students/${student.id}`} className="hover:text-[#1B4FD8] transition-colors">
                          {student.name}
                        </Link>
                      ) : '—'}
                    </p>
                    <p className="text-xs text-[#6B7B9C] mt-0.5 capitalize">{p.month} · {p.subject}</p>
                    <p className="text-xs font-semibold text-[#1A2340] mt-0.5">{formatUZS(p.net_amount)}</p>
                    {p.due_date && (
                      <p className="text-xs text-[#6B7B9C]">Due: {formatDate(p.due_date)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[p.status] ?? ''}`}>
                      {p.status}
                    </span>
                    {p.status !== 'paid' && (
                      <Link
                        href={`/admin/finance/${p.id}/mark-paid`}
                        className="text-xs font-semibold text-[#1B4FD8] bg-[#EEF3FF] px-3 py-1 rounded-lg"
                      >
                        Mark paid
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
