import Link from 'next/link'

const nav = [
  { href: '/admin/dashboard',         label: 'Overview' },
  { href: '/admin/schedule',           label: '📅 Schedule' },
  { href: '/admin/students',           label: 'Students' },
  { href: '/admin/groups',             label: 'Groups' },
  { href: '/admin/rooms',              label: 'Rooms' },
  { href: '/admin/leads',              label: 'Leads' },
  { href: '/admin/finance',            label: 'Finance' },
  { href: '/admin/finance/pl',         label: 'P&L' },
  { href: '/admin/finance/expenses',   label: 'Expenses' },
  { href: '/admin/teachers',           label: 'Teachers' },
  { href: '/admin/problems',           label: 'Problems' },
  { href: '/admin/vocab',              label: 'Vocab' },
  { href: '/admin/notifications',      label: 'Notify' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-[#1B4FD8]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {/* Logo */}
            <div className="flex items-center gap-2 py-3.5 pr-5 mr-2 shrink-0" style={{ borderRight: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                  <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                </svg>
              </div>
              <span className="font-bold text-[13px] text-white tracking-tight">SAT Admin</span>
            </div>

            {/* Nav items */}
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 px-3.5 py-3.5 rounded-lg transition-all whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
