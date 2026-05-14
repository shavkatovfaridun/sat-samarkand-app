import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function RoomsPage() {
  const supabase = createClient()

  const [{ data: rooms }, { data: groups }] = await Promise.all([
    supabase.from('rooms').select('*').order('name'),
    supabase.from('groups').select('id, name, room, schedule, student_ids').eq('status', 'active'),
  ])

  // Count groups per room
  const groupCountByRoom = new Map<string, number>()
  for (const g of groups ?? []) {
    if (g.room) groupCountByRoom.set(g.room, (groupCountByRoom.get(g.room) ?? 0) + 1)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Rooms</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'rgba(60,60,67,0.45)' }}>
            {rooms?.length ?? 0} room{(rooms?.length ?? 0) !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Link href="/admin/rooms/new"
          className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: '#1B4FD8' }}>
          + Add Room
        </Link>
      </div>

      {/* Quick link to schedule */}
      <Link href="/admin/schedule"
        className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: 'rgba(27,79,216,0.06)', border: '1px solid rgba(27,79,216,0.12)' }}>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: '#1B4FD8' }}>📅 View Schedule</p>
          <p className="text-[12px]" style={{ color: 'rgba(27,79,216,0.60)' }}>See all rooms in the timetable</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="#1B4FD8" strokeWidth="2" className="w-4 h-4 opacity-60">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* Rooms list */}
      {!rooms?.length ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="text-4xl mb-3">🚪</div>
          <p className="text-[16px] font-bold mb-1" style={{ color: '#1C1C1E' }}>No rooms yet</p>
          <p className="text-[13px] mb-5" style={{ color: 'rgba(60,60,67,0.45)' }}>Add rooms and assign them to groups</p>
          <Link href="/admin/rooms/new"
            className="inline-block px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: '#1B4FD8' }}>
            Add First Room
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          {rooms.map((room, i) => {
            const groupCount = groupCountByRoom.get(room.name) ?? 0
            return (
              <div key={room.id}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(60,60,67,0.06)', marginLeft: 56 }} />}
                <Link href={`/admin/schedule?day=Monday`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  {/* Color dot */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
                    style={{ background: `${room.color || '#1B4FD8'}15` }}>
                    🚪
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold" style={{ color: '#1C1C1E' }}>{room.name}</p>
                    <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.45)' }}>
                      Capacity {room.capacity} · Floor {room.floor}
                      {room.notes ? ` · ${room.notes}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-semibold" style={{ color: '#1C1C1E' }}>{groupCount}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(60,60,67,0.40)' }}>groups</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: room.status === 'active' ? '#34C759' : '#FF3B30' }} />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
