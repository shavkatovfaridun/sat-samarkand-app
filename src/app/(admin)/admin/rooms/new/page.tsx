import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function createRoom(formData: FormData) {
  'use server'
  const admin = createAdminClient()

  const { error } = await admin.from('rooms').insert({
    name:     (formData.get('name') as string).trim(),
    capacity: parseInt((formData.get('capacity') as string) || '20'),
    floor:    parseInt((formData.get('floor') as string) || '1'),
    color:    (formData.get('color') as string) || '#1B4FD8',
    status:   'active',
    notes:    (formData.get('notes') as string) || null,
  })

  if (error) throw new Error(error.message)
  redirect('/admin/rooms')
}

const INPUT       = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL       = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

const COLORS = [
  '#1B4FD8', '#34C759', '#FF9500', '#FF3B30',
  '#AF52DE', '#00C7BE', '#FF2D55', '#5856D6',
]

export default function NewRoomPage() {
  return (
    <div className="max-w-lg space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href="/admin/rooms"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Rooms
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Add Room</h1>
      </div>

      <form action={createRoom} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Room Info</p>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Room Name *</label>
            <input name="name" required placeholder="e.g. Room 101" className={INPUT} style={INPUT_STYLE} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Capacity</label>
              <input name="capacity" type="number" defaultValue={20} min={1} max={100} className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Floor</label>
              <input name="floor" type="number" defaultValue={1} min={1} max={10} className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c, i) => (
                <label key={c} className="cursor-pointer">
                  <input type="radio" name="color" value={c} defaultChecked={i === 0} className="sr-only" />
                  <div className="w-8 h-8 rounded-full transition-all"
                    style={{ background: c, boxShadow: i === 0 ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }} />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL} style={LABEL_STYLE}>Notes</label>
            <input name="notes" placeholder="e.g. Projector available" className={INPUT} style={INPUT_STYLE} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href="/admin/rooms"
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white"
            style={{ background: '#1B4FD8' }}>
            Add Room
          </button>
        </div>
      </form>
    </div>
  )
}
