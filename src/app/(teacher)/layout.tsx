import Link from 'next/link'

const nav = [
  { href: '/teacher/dashboard', label: 'My Classes' },
  { href: '/teacher/assign', label: 'Assign HW' },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <span className="font-bold text-sm text-gray-900">SAT Teacher</span>
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
