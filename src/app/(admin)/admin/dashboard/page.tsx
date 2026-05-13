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
    { label: 'Total Students', value: totalStudents ?? 0, href: '/admin/students', bg: 'bg-[#EEF3FF]', text: 'text-[#1B4FD8]', border: 'border-[#C7D7FA]' },
    { label: 'Active', value: activeStudents ?? 0, href: '/admin/students?status=active', bg: 'bg-[#ECFDF5]', text: 'text-emerald-700', border: 'border-[#A7F3D0]' },
    { label: 'Unpaid / Overdue', value: unpaidPayments ?? 0, href: '/admin/finance', bg: 'bg-[#FEF2F2]', text: 'text-red-700', border: 'border-[#FECACA]' },
    { label: 'Total Leads', value: totalLeads ?? 0, href: '/admin/leads', bg: 'bg-[#F5F3FF]', text: 'text-violet-700', border: 'border-[#DDD6FE]' },
    { label: 'New Leads', value: newLeads ?? 0, href: '/admin/leads?stage=NEW', bg: 'bg-[#FFF7ED]', text: 'text-orange-700', border: 'border-[#FED7AA]' },
  ]

  const quickLinks = [
    { href: '/admin/students/new', label: 'Add Student', icon: '➕' },
    { href: '/admin/groups', label: 'Groups', icon: '👥' },
    { href: '/admin/leads', label: 'CRM Pipeline', icon: '📊' },
    { href: '/admin/finance', label: 'Finance', icon: '💰' },
  ]

  return (
    <div>
      <div className="mb-6">
        <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Overview</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-2xl p-4 border ${s.bg} ${s.border} active:scale-95 transition-transform`}
          >
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
            <p className={`text-xs mt-1 font-medium ${s.text} opacity-80`}>{s.label}</p>
          </Link>
        ))}
      </div>

      <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-3">Quick Actions</p>
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 bg-white border border-[#E2E8F5] rounded-2xl p-4 hover:bg-[#F5F7FF] active:scale-95 transition-all"
          >
            <span className="text-xl">{l.icon}</span>
            <span className="text-sm font-semibold text-[#1A2340]">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
