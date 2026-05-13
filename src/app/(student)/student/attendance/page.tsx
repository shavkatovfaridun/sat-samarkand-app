import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'

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

  const total   = attendance?.length ?? 0
  const present = attendance?.filter(a => a.status === 'present').length ?? 0
  const late    = attendance?.filter(a => a.status === 'late').length ?? 0
  const absent  = attendance?.filter(a => a.status === 'absent').length ?? 0
  const rate    = total > 0 ? Math.round(((present + late) / total) * 100) : null

  const STATUS_CONFIG = {
    present: { label: 'Present', bg: 'rgba(52,199,89,0.12)',  color: '#1E8A3C' },
    late:    { label: 'Late',    bg: 'rgba(255,149,0,0.12)',  color: '#B86800' },
    absent:  { label: 'Absent',  bg: 'rgba(255,59,48,0.12)', color: '#C0281F' },
  } as const

  const rateColor = rate === null ? '#1B4FD8' : rate >= 80 ? '#1E8A3C' : rate >= 60 ? '#B86800' : '#C0281F'
  const rateGrad  = rate === null
    ? 'linear-gradient(135deg,#1340B0,#1B4FD8)'
    : rate >= 80
      ? 'linear-gradient(135deg,#14682E,#1E8A3C)'
      : rate >= 60
        ? 'linear-gradient(135deg,#8B5000,#B86800)'
        : 'linear-gradient(135deg,#991B1B,#C0281F)'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pt-1">
        <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>Student</p>
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>My Attendance</h1>
      </div>

      {total > 0 && (
        <>
          {/* Rate hero */}
          <div className="rounded-3xl p-6 relative overflow-hidden"
            style={{ background: rateGrad, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
              style={{ background: 'white', transform: 'translate(30%,-30%)' }} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Attendance Rate
            </p>
            <p className="text-[56px] font-bold leading-none text-white mb-4">{rate}%</p>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'rgba(255,255,255,0.25)' }}>
              <div className="h-full rounded-full" style={{ width: `${rate}%`, background: 'white' }} />
            </div>
            <p className="text-[12px] mt-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {present + late} attended · {absent} missed · {total} total classes
            </p>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Present', value: present, bg: 'rgba(52,199,89,0.10)',  color: '#1E8A3C' },
              { label: 'Late',    value: late,    bg: 'rgba(255,149,0,0.10)',  color: '#B86800' },
              { label: 'Absent',  value: absent,  bg: 'rgba(255,59,48,0.08)', color: '#C0281F' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-4 text-center"
                style={{ background: stat.bg }}>
                <p className="text-[22px] font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: stat.color, opacity: 0.75 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Class History</p>
        </div>

        {!attendance?.length ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'rgba(120,120,128,0.08)' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: 'rgba(60,60,67,0.30)' }}>
                <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold mb-0.5" style={{ color: '#1C1C1E' }}>No records yet</p>
            <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.45)' }}>Records appear after each class</p>
          </div>
        ) : (
          attendance.map((a, i) => {
            const cfg = STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.absent
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid rgba(60,60,67,0.07)' }}>
                <p className="text-[13px] font-medium" style={{ color: '#1C1C1E' }}>{formatDate(a.class_date)}</p>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
