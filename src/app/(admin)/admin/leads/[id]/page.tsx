import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import { redirect } from 'next/navigation'

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

const STAGES = ['NEW', 'NO_ANSWER', 'CONTACTED', 'NURTURE', 'TRIAL_SCHEDULED', 'TRIAL_DONE', 'ENROLLED', 'LOST']

async function addInteraction(leadId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''
  const match = email.match(/^tg_(\d+)@/)
  const userId = match ? parseInt(match[1]) : null

  await admin.from('interactions').insert({
    lead_id: leadId,
    user_id: userId,
    type: formData.get('type') as string || 'note',
    content: formData.get('content') as string,
  })

  redirect(`/admin/leads/${leadId}`)
}

async function updateStage(leadId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('leads').update({
    stage: formData.get('stage') as string,
    updated_at: new Date().toISOString(),
  }).eq('id', leadId)
  redirect(`/admin/leads/${leadId}`)
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: lead } = await admin
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!lead) notFound()

  const { data: interactions } = await admin
    .from('interactions')
    .select('id, type, content, created_at')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  const addInteractionWithId = addInteraction.bind(null, params.id)
  const updateStageWithId = updateStage.bind(null, params.id)

  const TEMP_LABELS: Record<string, string> = { HOT: '🔥 Hot', WARM: '🟡 Warm', COLD: '❄️ Cold' }
  const TYPE_ICONS: Record<string, string> = { note: '📝', call: '📞', message: '💬', meeting: '🤝' }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/leads" className="text-[#6B7B9C] hover:text-[#1A2340] text-sm">← Leads</Link>
        <span className="text-[#E2E8F5]">/</span>
        <span className="text-sm font-semibold text-[#1A2340] truncate">{lead.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A2340]">{lead.name}</h1>
            <p className="text-[#6B7B9C] text-sm mt-0.5">
              {lead.phone ?? 'No phone'} · {lead.source ?? 'Unknown source'}
            </p>
          </div>
          <div className="flex gap-2">
            {lead.temperature && (
              <span className="text-xs font-medium text-[#6B7B9C] bg-[#F5F7FF] px-2.5 py-1 rounded-full">
                {TEMP_LABELS[lead.temperature]}
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STAGE_STYLES[lead.stage] ?? 'bg-[#F1F5F9] text-slate-500'}`}>
              {lead.stage?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {lead.current_score && (
            <div className="bg-[#F5F7FF] rounded-xl p-3 text-center">
              <p className="text-xs text-[#6B7B9C] mb-0.5">Current</p>
              <p className="font-bold text-[#1A2340]">{lead.current_score}</p>
            </div>
          )}
          {lead.target_score && (
            <div className="bg-[#EEF3FF] rounded-xl p-3 text-center">
              <p className="text-xs text-[#6B7B9C] mb-0.5">Target</p>
              <p className="font-bold text-[#1B4FD8]">{lead.target_score}</p>
            </div>
          )}
          {lead.grade && (
            <div className="bg-[#F5F7FF] rounded-xl p-3 text-center">
              <p className="text-xs text-[#6B7B9C] mb-0.5">Grade</p>
              <p className="font-bold text-[#1A2340]">{lead.grade}</p>
            </div>
          )}
        </div>

        {lead.school && <p className="text-xs text-[#6B7B9C]">🏫 {lead.school}</p>}
        {lead.language && <p className="text-xs text-[#6B7B9C] mt-0.5">🌐 {lead.language}</p>}
        {lead.notes && (
          <div className="mt-3 bg-[#FFFBEB] rounded-xl p-3">
            <p className="text-xs text-amber-700">{lead.notes}</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Link
            href={`/admin/leads/${params.id}/edit`}
            className="flex-1 text-center py-2.5 bg-[#EEF3FF] text-[#1B4FD8] rounded-xl text-sm font-semibold"
          >
            Edit Lead
          </Link>
          {lead.stage !== 'ENROLLED' && (
            <Link
              href={`/admin/students/new?from_lead=${params.id}&name=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone ?? '')}`}
              className="flex-1 text-center py-2.5 bg-[#ECFDF5] text-emerald-700 rounded-xl text-sm font-semibold"
            >
              Convert to Student
            </Link>
          )}
        </div>
      </div>

      {/* Move stage */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Move to Stage</p>
        <form action={updateStageWithId} className="flex flex-wrap gap-2">
          {STAGES.map(s => (
            <button
              key={s}
              name="stage"
              value={s}
              type="submit"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                lead.stage === s
                  ? (STAGE_STYLES[s] ?? 'bg-[#F1F5F9]') + ' border-transparent'
                  : 'bg-white text-[#6B7B9C] border-[#E2E8F5] hover:border-[#1B4FD8]'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </form>
      </div>

      {/* Add interaction */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5] mb-4">
        <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">Log Interaction</p>
        <form action={addInteractionWithId} className="space-y-3">
          <div className="flex gap-2">
            {['note', 'call', 'message', 'meeting'].map(t => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="type" value={t} defaultChecked={t === 'note'} className="accent-[#1B4FD8]" />
                <span className="text-xs text-[#6B7B9C] capitalize">{TYPE_ICONS[t]} {t}</span>
              </label>
            ))}
          </div>
          <textarea
            name="content"
            required
            rows={2}
            placeholder="What happened? e.g. Called, discussed enrollment date..."
            className="w-full border border-[#E2E8F5] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1B4FD8] resize-none"
          />
          <button type="submit"
            className="w-full bg-[#1B4FD8] text-white rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform">
            Log
          </button>
        </form>
      </div>

      {/* Interaction history */}
      {interactions && interactions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#E2E8F5]">
          <p className="text-xs font-semibold text-[#6B7B9C] uppercase tracking-wide mb-3">History</p>
          <div className="space-y-3">
            {interactions.map(i => (
              <div key={i.id} className="flex gap-3">
                <span className="text-lg mt-0.5">{TYPE_ICONS[i.type] ?? '📝'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1A2340]">{i.content}</p>
                  <p className="text-xs text-[#6B7B9C] mt-0.5">{formatDate(i.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
