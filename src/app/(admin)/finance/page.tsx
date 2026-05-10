import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatUZS, formatDate } from '@/lib/format'

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  partial: 'bg-orange-100 text-orange-700',
  frozen: 'bg-gray-100 text-gray-500',
}

export default async function FinancePage({ searchParams }: { searchParams: { status?: string; month?: string } }) {
  const supabase = createClient()

  const currentMonth = searchParams.month || new Date().toISOString().slice(0, 7)

  let query = supabase
    .from('payments')
    .select(`
      id, month, subject, net_amount, status, due_date, paid_date, receipt_sent,
      students(id, name)
    `)
    .order('due_date', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)
  if (!searchParams.status) query = query.eq('month', currentMonth)

  const { data: payments } = await query

  // Summary stats
  const { data: summaryData } = await supabase
    .from('payments')
    .select('status, net_amount')
    .eq('month', currentMonth)

  const totalExpected = summaryData?.reduce((sum, p) => sum + (p.net_amount ?? 0), 0) ?? 0
  const totalReceived = summaryData?.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.net_amount, 0) ?? 0
  const totalOverdue = summaryData?.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + p.net_amount, 0) ?? 0

  const filters = ['', 'paid', 'unpaid', 'overdue', 'partial', 'frozen']

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Finance</h1>
        <Link href="/admin/finance/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          + Add Payment
        </Link>
      </div>

      {/* Month picker + summary */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="month"
            defaultValue={currentMonth}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            readOnly
          />
          <span className="text-xs text-gray-400">(filter by month above)</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-500">Expected</p>
            <p className="font-bold text-sm">{formatUZS(totalExpected)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Received</p>
            <p className="font-bold text-sm text-green-600">{formatUZS(totalReceived)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Overdue</p>
            <p className="font-bold text-sm text-red-600">{formatUZS(totalOverdue)}</p>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {filters.map((s) => (
          <Link
            key={s}
            href={s ? `/admin/finance?status=${s}` : `/admin/finance?month=${currentMonth}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${
              (searchParams.status ?? '') === s && !(!s && searchParams.status)
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {s || 'This Month'}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {!payments?.length ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">No payments found.</div>
        ) : (
          payments.map((p) => {
            const student = (p.students as unknown) as { id: string; name: string } | null
            return (
              <div key={p.id} className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {student ? (
                        <Link href={`/admin/students/${student.id}`} className="hover:underline">
                          {student.name}
                        </Link>
                      ) : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{p.month} · {p.subject}</p>
                    <p className="text-xs text-gray-400">{formatUZS(p.net_amount)}</p>
                    {p.due_date && <p className="text-xs text-gray-400">Due: {formatDate(p.due_date)}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? ''}`}>
                      {p.status}
                    </span>
                    {p.status !== 'paid' && (
                      <Link href={`/admin/finance/${p.id}/mark-paid`} className="text-xs text-blue-600 hover:underline">
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
