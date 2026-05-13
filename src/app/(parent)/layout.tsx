export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <header
        className="sticky top-0 z-40 px-4 py-3.5 flex items-center justify-between"
        style={{
          background: 'rgba(242,242,247,0.90)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 0.5px 0 rgba(0,0,0,0.10)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1B4FD8' }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
            </svg>
          </div>
          <span className="font-bold text-[#1C1C1E] text-[15px]">SAT Samarkand</span>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(27,79,216,0.10)', color: '#1B4FD8' }}>
          Parent
        </span>
      </header>
      <main className="max-w-lg mx-auto px-4 pt-5 pb-8">{children}</main>
    </div>
  )
}
