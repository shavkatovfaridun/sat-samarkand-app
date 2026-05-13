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
    { count: totalGroups },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).in('status', ['unpaid', 'overdue']),
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('stage', 'NEW'),
    supabase.from('groups').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>{greeting}</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Overview</h1>
        </div>
        <Link href="/admin/students/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8', color: 'white' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          Add Student
        </Link>
      </div>

      {/* Primary stats */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Students</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Total',   value: totalStudents  ?? 0, href: '/admin/students',               color: '#1B4FD8', bg: 'rgba(27,79,216,0.08)' },
            { label: 'Active',  value: activeStudents ?? 0, href: '/admin/students?status=active', color: '#34C759', bg: 'rgba(52,199,89,0.10)' },
            { label: 'Groups',  value: totalGroups    ?? 0, href: '/admin/groups',                 color: '#AF52DE', bg: 'rgba(175,82,222,0.10)' },
          ].map(s => (
            <Link key={s.label} href={s.href}
              className="bg-white rounded-2xl p-4 transition-all active:scale-[0.97]"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <p className="text-[32px] font-bold tracking-tight leading-none mb-1.5" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[12px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>{s.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Finance + Leads */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Unpaid */}
        <Link href="/admin/finance"
          className="bg-white rounded-2xl p-4 transition-all active:scale-[0.97]"
          style={{ boxShadow: unpaidPayments ? '0 2px 12px rgba(255,59,48,0.10), 0 1px 0 rgba(0,0,0,0.04)' : '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', border: unpaidPayments ? '1px solid rgba(255,59,48,0.15)' : 'none' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,59,48,0.10)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5" style={{ color: '#FF3B30' }}>
                <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
                <path fillRule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" style={{ color: 'rgba(60,60,67,0.25)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <p className="text-[32px] font-bold tracking-tight leading-none mb-1" style={{ color: '#FF3B30' }}>{unpaidPayments ?? 0}</p>
          <p className="text-[12px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>Unpaid / Overdue</p>
        </Link>

        {/* Leads */}
        <Link href="/admin/leads"
          className="bg-white rounded-2xl p-4 transition-all active:scale-[0.97]"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,149,0,0.10)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5" style={{ color: '#FF9500' }}>
                <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5H3v10.5a3 3 0 003 3h1.21l-1.172 3.513a.75.75 0 001.424.474l.329-.987h8.418l.33.987a.75.75 0 001.422-.474l-1.17-3.513H18a3 3 0 003-3V3.75h.75a.75.75 0 000-1.5H2.25zm6.04 16.5l.5-1.5h6.42l.5 1.5H8.29zm7.46-12a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm-3 2.25a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V9zm-3 2.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5" style={{ color: 'rgba(60,60,67,0.25)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <p className="text-[32px] font-bold tracking-tight leading-none mb-0.5" style={{ color: '#1C1C1E' }}>{totalLeads ?? 0}</p>
          <p className="text-[12px] font-medium" style={{ color: 'rgba(60,60,67,0.55)' }}>Leads total</p>
          {(newLeads ?? 0) > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block"
              style={{ background: 'rgba(255,149,0,0.12)', color: '#B86800' }}>
              {newLeads} new
            </span>
          )}
        </Link>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>Quick Actions</p>
        <div className="bg-white rounded-2xl overflow-hidden divide-y" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)', divideColor: 'rgba(60,60,67,0.08)' }}>
          {[
            { href: '/admin/students',         label: 'All Students',    sub: 'View and manage students', icon: '👤', color: '#1B4FD8', bg: 'rgba(27,79,216,0.08)' },
            { href: '/admin/leads',             label: 'CRM Pipeline',    sub: 'Manage leads and trials',  icon: '📊', color: '#FF9500', bg: 'rgba(255,149,0,0.10)' },
            { href: '/admin/finance',           label: 'Payments',        sub: 'Billing and collections',  icon: '💳', color: '#34C759', bg: 'rgba(52,199,89,0.10)' },
            { href: '/admin/finance/pl',        label: 'P&L Dashboard',   sub: 'Revenue and profit',       icon: '📈', color: '#AF52DE', bg: 'rgba(175,82,222,0.10)' },
            { href: '/admin/notifications',     label: 'Send Notification',sub: 'Broadcast to students',   icon: '📤', color: '#FF3B30', bg: 'rgba(255,59,48,0.08)' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 px-4 py-3.5 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: item.bg }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1C1C1E]">{item.label}</p>
                <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.50)' }}>{item.sub}</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0" style={{ color: 'rgba(60,60,67,0.22)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
