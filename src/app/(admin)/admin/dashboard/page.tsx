import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createClient()

  const [
    { count: totalStudents },
    { count: activeStudents },
    { count: unpaidPayments },
    { count: totalLeads },
    { count: newLeads },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).in('status', ['unpaid', 'overdue']),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('stage', 'NEW'),
  ])

  const stats = [
    { label: 'Total Students', value: totalStudents ?? 0, href: '/admin/students', color: 'bg-blue-50 text-blue-700' },
    { label: 'Active Students', value: activeStudents ?? 0, href: '/admin/students?status=active', color: 'bg-green-50 text-green-700' },
    { label: 'Unpaid / Overdue', value: unpaidPayments ?? 0, href: '/admin/finance', color: 'bg-red-50 text-red-700' },
    { label: 'Total Leads', value: totalLeads ?? 0, href: '/admin/leads', color: 'bg-purple-50 text-purple-700' },
    { label: 'New Leads', value: newLeads ?? 0, href: '/admin/leads?stage=NEW', color: 'bg-orange-50 text-orange-700' },
  ]

  const quickLinks = [
    { href: '/admin/students/new', label: '+ Add Student' },
    { href: '/admin/groups', label: 'Manage Groups' },
    { href: '/admin/leads', label: 'CRM Pipeline' },
    { href: '/admin/finance', label: 'Finance' },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-1 opacity-80">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
