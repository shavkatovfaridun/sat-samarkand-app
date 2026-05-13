'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/student/dashboard', label: 'Home', icon: '🏠' },
  { href: '/student/homework', label: 'Homework', icon: '📝' },
  { href: '/student/scores', label: 'Scores', icon: '📊' },
  { href: '/student/attendance', label: 'Attendance', icon: '📅' },
  { href: '/student/payments', label: 'Payments', icon: '💳' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-[#F5F7FF] pb-20">
      <main className="max-w-lg mx-auto px-4 pt-4 pb-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F5] flex shadow-[0_-2px_12px_rgba(27,79,216,0.08)]">
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-center transition-colors ${
                active ? 'text-[#1B4FD8]' : 'text-[#6B7B9C]'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-[#1B4FD8]' : 'text-[#6B7B9C]'}`}>
                {item.label}
              </span>
              {active && <span className="absolute bottom-0 w-6 h-0.5 bg-[#1B4FD8] rounded-full" />}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
