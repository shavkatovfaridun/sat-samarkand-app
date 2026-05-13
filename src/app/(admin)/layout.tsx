import Link from 'next/link'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/students', label: 'Students' },
  { href: '/admin/groups', label: 'Groups' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/finance', label: 'Finance' },
  { href: '/admin/notifications', label: '📤 Notify' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FF]">
      <nav className="bg-[#1B4FD8] px-4 py-0 flex items-center gap-1 overflow-x-auto">
        <span className="font-bold text-sm text-white shrink-0 py-3.5 pr-4 border-r border-white/20 mr-2">
          SAT Admin
        </span>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-white/80 hover:text-white hover:bg-white/10 shrink-0 px-3 py-3.5 rounded transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
