import Link from 'next/link'

const nav = [
  { href: '/student/dashboard', label: 'Home' },
  { href: '/student/homework', label: 'Homework' },
  { href: '/student/scores', label: 'Scores' },
  { href: '/student/payments', label: 'Payments' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 text-center py-3 text-xs text-gray-600 hover:text-gray-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
