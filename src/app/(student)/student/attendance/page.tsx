import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'

const STATUS_CONFIG = {
  present: { label: 'Present', bg: 'bg-[#ECFDF5]', text: 'text-emerald-700', icon: '✓' },
  late:    { label: 'Late',    bg: 'bg-[#FFFBEB]', text: 'text-amber-700',   icon: '~' },
  absent:  { label: 'Absent',  bg: 'bg-[#FEF2F2]', text: 'text-red-700',     icon: '✗' },
} as const

export default async function StudentAttendancePage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const telegramId = match ? parseInt(match[1]) : null

  const { data: student } = await supabase
    .from('students')
    .select('id, name, group_id')
    .eq('telegram_id', telegramId)
    .single()

  const { data: attendance } = student?.group_id
    ? await supabase
        .from('attendance')
        .select('class_date, status')
        .eq('student_id', student.id)
        .eq('group_id', student.group_id)
        .order('class_date', { ascending: false })
        .limit(60)
    : { data: null }

  const total = attendance?.length ?? 0
  const present = attendance?.filter(a => a.status === 'present').length ?? 0
  const late = attendance?.filter(a => a.status === 'late').length ?? 0
  const absent = attendance?.filter(a => a.status === 'absent').length ?? 0
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : null

  return (
    <div>
      <div className="mb-5">
        <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">Attendance</p>
        <h1 className="text-2xl font-bold text-[#1A2340]">My Attendance</h1>
      </div>

      {/* Stats */}
      {total > 0 && (
        <>
          {/* Rate card */}
          <div className="bg-[#1B4FD8] rounded-2xl p-5 mb-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
            <p className="text-white/60 text-xs font-medium uppercase tracking-wide mb-1">Attendance Rate</p>
            <p className="text-5xl font-bold text-white mb-3">{rate}%</p>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${rate}%` }} />
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#ECFDF5] rounded-2xl p-3 text-center border border-[#A7F3D0]">
              <p className="text-xl font-bold text-emerald-700">{present}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Present</p>
            </div>
            <div className="bg-[#FFFBEB] rounded-2xl p-3 text-center border border-[#FDE68A]">
              <p className="text-xl font-bold text-amber-700">{late}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Late</p>
            </div>
            <div className="bg-[#FEF2F2] rounded-2xl p-3 text-center border border-[#FECACA]">
              <p className="text-xl font-bold text-red-700">{absent}</p>
              <p className="text-[10px] text-red-600 mt-0.5">Absent</p>
            </div>
          </div>
        </>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Class History</p>
        {!attendance?.length ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-[#6B7B9C] text-sm">No attendance records yet</p>
            <p className="text-[#6B7B9C] text-xs mt-1">Records appear after each class</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendance.map((a, i) => {
              const cfg = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.absent
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#F5F7FF] last:border-0">
                  <p className="text-sm font-medium text-[#1A2340]">{formatDate(a.class_date)}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
