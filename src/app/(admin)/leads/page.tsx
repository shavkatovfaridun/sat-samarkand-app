import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

const STAGE_ORDER = ['NEW', 'NO_ANSWER', 'CONTACTED', 'NURTURE', 'TRIAL_SCHEDULED', 'TRIAL_DONE', 'ENROLLED', 'LOST']
const STAGE_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  NO_ANSWER: 'bg-gray-100 text-gray-600',
  CONTACTED: 'bg-purple-100 text-purple-700',
  NURTURE: 'bg-yellow-100 text-yellow-700',
  TRIAL_SCHEDULED: 'bg-orange-100 text-orange-700',
  TRIAL_DONE: 'bg-indigo-100 text-indigo-700',
  ENROLLED: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-500',
}
const TEMP_COLORS: Record<string, string> = {
  HOT: 'text-red-500',
  WARM: 'text-orange-400',
  COLD: 'text-blue-400',
}

export default async function LeadsPage({ searchParams }: { searchParams: { stage?: string } }) {
  const supabase = createClient()

  let query = supabase
    .from('leads')
    .select('id, name, phone, stage, temperature, source, current_score, target_score, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (searchParams.stage) query = query.eq('stage', searchParams.stage)

  const { data: leads } = await query

  // Count by stage
  const { data: stageCounts } = await supabase
    .from('leads')
    .select('stage')

  const countByStage = Object.fromEntries(
    STAGE_ORDER.map((s) => [s, stageCounts?.filter((l) => l.stage === s).length ?? 0])
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">CRM Leads</h1>
        <Link href="/admin/leads/new" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
          + Add Lead
        </Link>
      </div>

      {/* Pipeline overview */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <Link
          href="/admin/leads"
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${!searchParams.stage ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          All ({leads?.length ?? 0})
        </Link>
        {STAGE_ORDER.map((stage) => (
          <Link
            key={stage}
            href={`/admin/leads?stage=${stage}`}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border ${searchParams.stage === stage ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {stage.replace('_', ' ')} ({countByStage[stage] ?? 0})
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {!leads?.length ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm">No leads found.</div>
        ) : (
          leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="block bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {lead.temperature && (
                      <span className={`text-base ${TEMP_COLORS[lead.temperature] ?? ''}`}>●</span>
                    )}
                    <p className="font-medium truncate">{lead.name}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lead.phone ?? '—'} · {lead.source ?? '—'}
                  </p>
                  {(lead.current_score || lead.target_score) && (
                    <p className="text-xs text-gray-400">
                      Score: {lead.current_score ?? '—'} → {lead.target_score ?? '—'}
                    </p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">{formatDate(lead.updated_at)}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${STAGE_COLORS[lead.stage] ?? 'bg-gray-100 text-gray-600'}`}>
                  {lead.stage?.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
