export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <span className="font-bold text-sm text-gray-900">SAT Samarkand — Parent</span>
      </nav>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
