export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FF]">
      <header className="bg-[#1B4FD8] px-4 py-3.5 flex items-center justify-between">
        <span className="font-bold text-white">SAT Samarkand</span>
        <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">Parent</span>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
