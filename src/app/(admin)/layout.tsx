import Link from 'next/link'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/students', label: 'Students' },
  { href: '/admin/groups', label: 'Groups' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/finance', label: 'Finance' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 overflow-x-auto">
        <span className="font-bold text-sm text-gray-900 shrink-0">SAT Admin</span>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-gray-600 hover:text-gray-900 shrink-0"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
