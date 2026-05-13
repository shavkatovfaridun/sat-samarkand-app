import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

const STAGE_ORDER = ['NEW', 'NO_ANSWER', 'CONTACTED', 'NURTURE', 'TRIAL_SCHEDULED', 'TRIAL_DONE', 'ENROLLED', 'LOST']
const STAGE_STYLES: Record<string, string> = {
  NEW: 'bg-[#EEF3FF] text-[#1B4FD8]',
  NO_ANSWER: 'bg-[#F1F5F9] text-slate-500',
  CONTACTED: 'bg-[#F5F3FF] text-violet-700',
  NURTURE: 'bg-[#FFFBEB] text-amber-700',
  TRIAL_SCHEDULED: 'bg-[#FFF7ED] text-orange-700',
  TRIAL_DONE: 'bg-[#EEF3FF] text-indigo-700',
  ENROLLED: 'bg-[#ECFDF5] text-emerald-700',
  LOST: 'bg-[#FEF2F2] text-red-600',
}
const TEMP_DOTS: Record<string, string> = {
  HOT: 'text-red-500',
  WARM: 'text-orange-400',
  COLD: 'text-[#1B4FD8]',
}

export default async function LeadsPage({ searchParams }: { searchParams: { stage?: string } }) {
  const supabase = createClient()

  let query = supabase
    .from('leads')
    .select('id, name, phone, stage, temperature, source, current_score, target_score, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (searchParams.stage) query = query.eq('stage', searchParams.stage)

  const { data: leads } = await query

  const { data: stageCounts } = await supabase.from('leads').select('stage')
  const countByStage = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, stageCounts?.filter((l) => l.stage === s).length ?? 0])
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[#6B7B9C] text-xs font-medium uppercase tracking-wide mb-1">CRM</p>
          <h1 className="text-2xl font-bold text-[#1A2340]">Leads Pipeline</h1>
        </div>
        <Link
          href="/admin/leads/new"
          className="bg-[#1B4FD8] text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
        >
          + Add
        </Link>
      </div>

      {/* Pipeline filter chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <Link
          href="/admin/leads"
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
            !searchParams.stage
              ? 'bg-[#1B4FD8] text-white border-[#1B4FD8]'
              : 'bg-white text-[#6B7B9C] border-[#E2E8F5]'
          }`}
        >
          All ({leads?.length ?? 0})
        </Link>
        {STAGE_ORDER.map((stage) => (
          <Link
            key={stage}
            href={`/admin/leads?stage=${stage}`}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              searchParams.stage === stage
                ? 'bg-[#1B4FD8] text-white border-[#1B4FD8]'
                : 'bg-white text-[#6B7B9C] border-[#E2E8F5]'
            }`}
          >
            {stage.replace(/_/g, ' ')} ({countByStage[stage] ?? 0})
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {!leads?.length ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F5]">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-[#6B7B9C] text-sm">No leads found</p>
          </div>
        ) : (
          leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="flex items-start justify-between bg-white rounded-2xl px-4 py-3.5 border border-[#E2E8F5] hover:border-[#C7D7FA] active:scale-[0.99] transition-all gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {lead.temperature && (
                    <span className={`text-xs ${TEMP_DOTS[lead.temperature] ?? ''}`}>●</span>
                  )}
                  <p className="font-semibold text-[#1A2340] truncate">{lead.name}</p>
                </div>
                <p className="text-xs text-[#6B7B9C]">
                  {lead.phone ?? '—'} · {lead.source ?? '—'}
                </p>
                {(lead.current_score || lead.target_score) && (
                  <p className="text-xs text-[#6B7B9C]">
                    Score: {lead.current_score ?? '—'} → {lead.target_score ?? '—'}
                  </p>
                )}
                <p className="text-xs text-[#6B7B9C]/60 mt-1">{formatDate(lead.updated_at)}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_STYLES[lead.stage] ?? 'bg-[#F1F5F9] text-slate-500'}`}>
                  {lead.stage?.replace(/_/g, ' ')}
                </span>
                <span className="text-[#6B7B9C] text-sm">›</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
