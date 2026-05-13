
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

const STAGE_ORDER = ['NEW','NO_ANSWER','CONTACTED','NURTURE','TRIAL_SCHEDULED','TRIAL_DONE','ENROLLED','LOST']

const STAGE: Record<string, { color: string; bg: string; label: string }> = {
  NEW:              { color: '#1B4FD8', bg: 'rgba(27,79,216,0.12)',    label: 'New'             },
  NO_ANSWER:        { color: 'rgba(60,60,67,0.50)', bg: 'rgba(120,120,128,0.12)', label: 'No Answer' },
  CONTACTED:        { color: '#AF52DE', bg: 'rgba(175,82,222,0.12)',   label: 'Contacted'       },
  NURTURE:          { color: '#B86800', bg: 'rgba(255,149,0,0.12)',    label: 'Nurture'         },
  TRIAL_SCHEDULED:  { color: '#B86800', bg: 'rgba(255,149,0,0.12)',    label: 'Trial Scheduled' },
  TRIAL_DONE:       { color: '#1B4FD8', bg: 'rgba(27,79,216,0.10)',    label: 'Trial Done'      },
  ENROLLED:         { color: '#1E8A3C', bg: 'rgba(52,199,89,0.12)',    label: 'Enrolled'        },
  LOST:             { color: '#C0281F', bg: 'rgba(255,59,48,0.12)',    label: 'Lost'            },
}

const TEMP: Record<string, { color: string; label: string }> = {
  HOT:  { color: '#FF3B30', label: '🔥' },
  WARM: { color: '#FF9500', label: '♨️' },
  COLD: { color: '#1B4FD8', label: '❄️' },
}

export default async function LeadsPage({ searchParams }: { searchParams: { stage?: string } }) {
  const supabase = createClient()

  let query = supabase
    .from('leads')
    .select('id, name, phone, stage, temperature, source, current_score, target_score, updated_at')
    .order('updated_at', { ascending: false })

  if (searchParams.stage) query = query.eq('stage', searchParams.stage)

  const { data: leads } = await query
  const { data: allLeads } = await supabase.from('leads').select('stage, temperature')

  const countByStage = Object.fromEntries(
    STAGE_ORDER.map(s => [s, allLeads?.filter(l => l.stage === s).length ?? 0])
  )
  const hot  = allLeads?.filter(l => l.temperature === 'HOT').length ?? 0
  const enrolled = allLeads?.filter(l => l.stage === 'ENROLLED').length ?? 0
  const total = allLeads?.length ?? 0

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>CRM</p>
          <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>Pipeline</h1>
        </div>
        <Link href="/admin/leads/new"
          className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl text-white transition-all active:scale-[0.97]"
          style={{ background: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          New Lead
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Total Leads', value: total,    color: '#1C1C1E', bg: 'rgba(120,120,128,0.08)' },
          { label: 'Hot Leads',   value: hot,      color: '#FF3B30', bg: 'rgba(255,59,48,0.10)'  },
          { label: 'Enrolled',    value: enrolled, color: '#1E8A3C', bg: 'rgba(52,199,89,0.10)'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <p className="text-[26px] font-bold tracking-tight leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Stage filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <Link href="/admin/leads"
          className="shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full transition-all"
          style={{
            background: !searchParams.stage ? '#1B4FD8' : 'white',
            color: !searchParams.stage ? 'white' : 'rgba(60,60,67,0.55)',
            boxShadow: !searchParams.stage ? '0 2px 8px rgba(27,79,216,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
          }}>
          All ({total})
        </Link>
        {STAGE_ORDER.map(stage => {
          const active = searchParams.stage === stage
          const st = STAGE[stage]
          return (
            <Link key={stage} href={`/admin/leads?stage=${stage}`}
              className="shrink-0 text-[12px] font-semibold px-4 py-2 rounded-full transition-all whitespace-nowrap"
              style={{
                background: active ? st.color : 'white',
                color: active ? 'white' : 'rgba(60,60,67,0.55)',
                boxShadow: active ? `0 2px 8px ${st.color}40` : '0 1px 4px rgba(0,0,0,0.05)',
              }}>
              {st.label} {countByStage[stage] > 0 ? `(${countByStage[stage]})` : ''}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {!leads?.length ? (
        <div className="bg-white rounded-3xl p-10 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,149,0,0.10)' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" style={{ color: '#FF9500' }}>
              <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5H3v10.5a3 3 0 003 3h1.21l-1.172 3.513a.75.75 0 001.424.474l.329-.987h8.418l.33.987a.75.75 0 001.422-.474l-1.17-3.513H18a3 3 0 003-3V3.75h.75a.75.75 0 000-1.5H2.25z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="font-bold text-[#1C1C1E] text-[16px] mb-1">No leads found</p>
          <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>
            {searchParams.stage ? `No leads in ${STAGE[searchParams.stage]?.label ?? searchParams.stage}` : 'Start adding leads to your pipeline'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
          {leads.map((lead, i) => {
            const st = STAGE[lead.stage] ?? STAGE.NO_ANSWER
            const temp = lead.temperature ? TEMP[lead.temperature] : null
            return (
              <Link key={lead.id} href={`/admin/leads/${lead.id}`}
                className="flex items-center gap-4 px-4 py-3.5 transition-all hover:bg-[rgba(0,0,0,0.02)] active:bg-[rgba(0,0,0,0.04)]"
                style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center text-[15px] font-bold relative"
                  style={{ background: st.bg, color: st.color }}>
                  {lead.name.charAt(0).toUpperCase()}
                  {temp && (
                    <span className="absolute -top-1 -right-1 text-[10px] leading-none">{temp.label}</span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#1C1C1E] truncate">{lead.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[12px]" style={{ color: 'rgba(60,60,67,0.50)' }}>
                      {lead.phone ?? '—'}
                    </p>
                    {lead.source && (
                      <span className="text-[11px] capitalize" style={{ color: 'rgba(60,60,67,0.35)' }}>· {lead.source}</span>
                    )}
                    {(lead.current_score || lead.target_score) && (
                      <span className="text-[11px]" style={{ color: 'rgba(60,60,67,0.35)' }}>
                        · {lead.current_score ?? '?'} → {lead.target_score ?? '?'}
                      </span>
                    )}
                  </div>
                </div>
                {/* Stage + time */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(60,60,67,0.35)' }}>
                    {formatDate(lead.updated_at)}
                  </span>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0"
                  style={{ color: 'rgba(60,60,67,0.22)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
