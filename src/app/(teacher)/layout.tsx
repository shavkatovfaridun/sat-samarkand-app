'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/teacher/dashboard', label: 'Classes', icon: '🏫' },
  { href: '/teacher/assign', label: 'Assign HW', icon: '📋' },
]

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-[#F5F7FF] pb-20">
      <header className="bg-[#1B4FD8] px-4 py-3.5 flex items-center justify-between">
        <span className="font-bold text-white">SAT Teacher</span>
        <span className="text-xs text-white/60">satsamarkand.uz</span>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F5] flex shadow-[0_-2px_12px_rgba(27,79,216,0.08)]">
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                active ? 'text-[#1B4FD8]' : 'text-[#6B7B9C]'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
