import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAYS_UZ = ['Dush','Sesh','Chor','Pay','Juma','Shanba']

const HOURS_START = 8
const HOURS_END   = 22
const PX_PER_HOUR = 80

const SUBJECT_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  math:    { bg: 'rgba(27,79,216,0.10)',  border: 'rgba(27,79,216,0.30)',  text: '#1B4FD8' },
  english: { bg: 'rgba(52,199,89,0.10)',  border: 'rgba(52,199,89,0.30)',  text: '#1E8A3C' },
  both:    { bg: 'rgba(255,149,0,0.10)',  border: 'rgba(255,149,0,0.30)',  text: '#B95F00' },
}
const FALLBACK_COLOR = { bg: 'rgba(142,142,147,0.10)', border: 'rgba(142,142,147,0.30)', text: '#636366' }

function timeToOffsetPx(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h - HOURS_START) + m / 60) * PX_PER_HOUR
}
function durationPx(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return ((eh + em/60) - (sh + sm/60)) * PX_PER_HOUR
}

type ScheduleSlot = { day: string; startTime: string; endTime: string }

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { day?: string; groupBy?: string }
}) {
  const supabase  = createClient()
  const today     = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] // Mon-Sat
  const day       = searchParams.day    || today
  const groupBy   = searchParams.groupBy || 'room'

  const [{ data: groups }, { data: teachers }] = await Promise.all([
    supabase.from('groups').select('id, name, subject, schedule, room, teacher_id, student_ids').eq('status','active'),
    supabase.from('users').select('telegram_id, name').eq('role','teacher'),
  ])

  const teacherMap = new Map((teachers ?? []).map(t => [t.telegram_id, t.name]))

  // Flatten to sessions for selected day
  const sessions = (groups ?? []).flatMap(g =>
    ((g.schedule ?? []) as ScheduleSlot[])
      .filter(s => s.day === day)
      .map(s => ({
        ...s,
        id:           g.id,
        name:         g.name,
        subject:      g.subject as string,
        room:         (g.room as string) || 'Unassigned',
        teacher:      g.teacher_id ? (teacherMap.get(g.teacher_id) ?? '—') : '—',
        studentCount: (g.student_ids as string[] | null)?.length ?? 0,
      }))
  )

  // Group by room or teacher
  const buckets = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const key = groupBy === 'teacher' ? s.teacher : s.room
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(s)
  }
  const columns = [...buckets.entries()].sort(([a],[b]) => a.localeCompare(b))

  const totalPx = (HOURS_END - HOURS_START) * PX_PER_HOUR
  const hours   = Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => HOURS_START + i)

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Schedule</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>
            {sessions.length} class{sessions.length !== 1 ? 'es' : ''} on {day}
          </p>
        </div>

        {/* GroupBy toggle */}
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(60,60,67,0.15)' }}>
          {(['room','teacher'] as const).map(g => (
            <Link key={g} href={`/admin/schedule?day=${day}&groupBy=${g}`}
              className="px-4 py-2 text-[12px] font-semibold capitalize transition-all"
              style={{ background: groupBy===g ? '#1B4FD8' : 'white', color: groupBy===g ? 'white' : 'rgba(60,60,67,0.55)' }}>
              {g === 'room' ? '🚪 Room' : '👤 Teacher'}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Day tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {DAYS.map((d, i) => (
          <Link key={d} href={`/admin/schedule?day=${d}&groupBy=${groupBy}`}
            className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
            style={{ background: day===d ? '#1B4FD8' : 'rgba(120,120,128,0.10)', color: day===d ? 'white' : 'rgba(60,60,67,0.65)' }}>
            {DAYS_UZ[i]}
          </Link>
        ))}
        <Link href="/admin/rooms"
          className="shrink-0 ml-auto px-3 py-2 rounded-xl text-[13px] font-semibold"
          style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
          Rooms →
        </Link>
      </div>

      {/* ── Timetable ── */}
      {columns.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[16px] font-bold" style={{ color: '#1C1C1E' }}>No classes on {day}</p>
          <p className="text-[13px] mt-1 mb-5" style={{ color: 'rgba(60,60,67,0.45)' }}>
            Edit a group and add a {day} schedule to see it here
          </p>
          <Link href="/admin/groups" className="inline-block px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: '#1B4FD8' }}>
            Go to Groups
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex" style={{ minWidth: `${Math.max(columns.length * 180 + 56, 400)}px` }}>

              {/* ── Time axis ── */}
              <div className="shrink-0 w-14" style={{ borderRight: '1px solid rgba(60,60,67,0.08)' }}>
                <div className="h-10" style={{ borderBottom: '1px solid rgba(60,60,67,0.08)' }} />
                <div className="relative" style={{ height: totalPx }}>
                  {hours.map(h => (
                    <div key={h} className="absolute right-2 flex items-center"
                      style={{ top: (h - HOURS_START) * PX_PER_HOUR - 7, height: 14 }}>
                      <span className="text-[10px] font-medium tabular-nums" style={{ color: 'rgba(60,60,67,0.30)' }}>
                        {String(h).padStart(2,'0')}:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Room / Teacher columns ── */}
              {columns.map(([colName, colSessions]) => (
                <div key={colName} className="flex-1 min-w-[160px]"
                  style={{ borderRight: '1px solid rgba(60,60,67,0.08)' }}>

                  {/* Column header */}
                  <div className="h-10 flex items-center justify-center px-3"
                    style={{ borderBottom: '1px solid rgba(60,60,67,0.08)', background: 'rgba(60,60,67,0.02)' }}>
                    <span className="text-[12px] font-bold truncate" style={{ color: '#1C1C1E' }}>{colName}</span>
                  </div>

                  {/* Grid + sessions */}
                  <div className="relative" style={{ height: totalPx }}>
                    {/* Hour lines */}
                    {hours.map(h => (
                      <div key={h} className="absolute inset-x-0"
                        style={{ top: (h - HOURS_START) * PX_PER_HOUR, borderTop: '1px solid rgba(60,60,67,0.05)' }} />
                    ))}
                    {/* Half-hour lines */}
                    {hours.slice(0,-1).map(h => (
                      <div key={h+'h'} className="absolute inset-x-0"
                        style={{ top: (h - HOURS_START) * PX_PER_HOUR + PX_PER_HOUR/2, borderTop: '1px dashed rgba(60,60,67,0.04)' }} />
                    ))}

                    {/* Session cards */}
                    {colSessions.map((s, idx) => {
                      const top  = timeToOffsetPx(s.startTime)
                      const h    = Math.max(durationPx(s.startTime, s.endTime) - 4, 24)
                      const col  = SUBJECT_COLOR[s.subject] ?? FALLBACK_COLOR
                      return (
                        <Link key={idx} href={`/admin/groups/${s.id}`}
                          className="absolute left-1 right-1 rounded-xl overflow-hidden flex flex-col"
                          style={{
                            top: top + 2,
                            height: h,
                            background: col.bg,
                            border: `1.5px solid ${col.border}`,
                          }}>
                          <div className="px-2 py-1.5 flex flex-col gap-0.5 h-full">
                            <p className="text-[11px] font-bold leading-tight truncate" style={{ color: col.text }}>
                              {s.name}
                            </p>
                            {h >= 44 && (
                              <p className="text-[10px] leading-tight truncate" style={{ color: 'rgba(60,60,67,0.50)' }}>
                                {s.teacher}
                              </p>
                            )}
                            {h >= 56 && (
                              <p className="text-[9px] font-medium mt-auto" style={{ color: 'rgba(60,60,67,0.38)' }}>
                                {s.startTime}–{s.endTime} · {s.studentCount} students
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-3" style={{ borderTop: '1px solid rgba(60,60,67,0.06)' }}>
            {Object.entries(SUBJECT_COLOR).map(([subj, c]) => (
              <div key={subj} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.text }} />
                <span className="text-[11px] font-medium capitalize" style={{ color: 'rgba(60,60,67,0.50)' }}>{subj}</span>
              </div>
            ))}
            <span className="text-[11px] ml-auto" style={{ color: 'rgba(60,60,67,0.30)' }}>
              {HOURS_START}:00 – {HOURS_END}:00
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
