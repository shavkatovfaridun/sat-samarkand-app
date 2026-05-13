import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/format'
import { redirect } from 'next/navigation'

const STAGE_STYLE: Record<string, { bg: string; color: string }> = {
  NEW:              { bg: 'rgba(27,79,216,0.10)',   color: '#1B4FD8' },
  NO_ANSWER:        { bg: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.55)' },
  CONTACTED:        { bg: 'rgba(175,82,222,0.10)',  color: '#AF52DE' },
  NURTURE:          { bg: 'rgba(255,149,0,0.10)',   color: '#B86800' },
  TRIAL_SCHEDULED:  { bg: 'rgba(255,149,0,0.10)',   color: '#B86800' },
  TRIAL_DONE:       { bg: 'rgba(27,79,216,0.10)',   color: '#1B4FD8' },
  ENROLLED:         { bg: 'rgba(52,199,89,0.12)',   color: '#1E8A3C' },
  LOST:             { bg: 'rgba(255,59,48,0.10)',   color: '#C0281F' },
}

const TEMP_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  HOT:  { bg: 'rgba(255,59,48,0.10)', color: '#C0281F', icon: '🔥' },
  WARM: { bg: 'rgba(255,149,0,0.10)', color: '#B86800', icon: '🟡' },
  COLD: { bg: 'rgba(27,79,216,0.08)', color: '#1B4FD8', icon: '❄️' },
}

const TYPE_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  note:    { bg: 'rgba(120,120,128,0.08)', color: 'rgba(60,60,67,0.55)', icon: '📝' },
  call:    { bg: 'rgba(52,199,89,0.10)',  color: '#1E8A3C',              icon: '📞' },
  message: { bg: 'rgba(27,79,216,0.08)', color: '#1B4FD8',               icon: '💬' },
  meeting: { bg: 'rgba(175,82,222,0.10)', color: '#AF52DE',              icon: '🤝' },
}

const STAGES = ['NEW', 'NO_ANSWER', 'CONTACTED', 'NURTURE', 'TRIAL_SCHEDULED', 'TRIAL_DONE', 'ENROLLED', 'LOST']

async function addInteraction(leadId: string, formData: FormData) {
  'use server'
  const admin   = createAdminClient()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const match  = user?.email?.match(/^tg_(\d+)@/)
  const userId = match ? parseInt(match[1]) : null

  await admin.from('interactions').insert({
    lead_id: leadId,
    user_id: userId,
    type:    formData.get('type') as string || 'note',
    content: formData.get('content') as string,
  })
  redirect(`/admin/leads/${leadId}`)
}

async function updateStage(leadId: string, formData: FormData) {
  'use server'
  const admin = createAdminClient()
  await admin.from('leads').update({
    stage:      formData.get('stage') as string,
    updated_at: new Date().toISOString(),
  }).eq('id', leadId)
  redirect(`/admin/leads/${leadId}`)
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: lead } = await admin.from('leads').select('*').eq('id', params.id).single()
  if (!lead) notFound()

  const { data: interactions } = await admin
    .from('interactions')
    .select('id, type, content, created_at')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  const addInteractionWithId = addInteraction.bind(null, params.id)
  const updateStageWithId    = updateStage.bind(null, params.id)

  const stageSt = STAGE_STYLE[lead.stage] ?? STAGE_STYLE.NO_ANSWER
  const tempSt  = lead.temperature ? TEMP_STYLE[lead.temperature] : null

  return (
    <div className="max-w-2xl space-y-4">
      {/* Back + header */}
      <div className="pt-1">
        <Link href="/admin/leads"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Leads
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>{lead.name}</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(60,60,67,0.55)' }}>
              {lead.phone ?? 'No phone'}{lead.source ? ` · ${lead.source}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-1 flex-wrap justify-end">
            {tempSt && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: tempSt.bg, color: tempSt.color }}>
                {tempSt.icon} {lead.temperature}
              </span>
            )}
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: stageSt.bg, color: stageSt.color }}>
              {lead.stage.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Academic stats */}
      {(lead.current_score || lead.target_score || lead.grade) && (
        <div className="grid grid-cols-3 gap-2.5">
          {lead.current_score && (
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[22px] font-bold tracking-tight leading-none mb-1" style={{ color: '#1C1C1E' }}>{lead.current_score}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>Current</p>
            </div>
          )}
          {lead.target_score && (
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[22px] font-bold tracking-tight leading-none mb-1" style={{ color: '#1B4FD8' }}>{lead.target_score}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>Target</p>
            </div>
          )}
          {lead.grade && (
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[22px] font-bold tracking-tight leading-none mb-1" style={{ color: '#1C1C1E' }}>Grade {lead.grade}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'rgba(60,60,67,0.45)' }}>Grade</p>
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
        {[
          ['School',    lead.school    ?? null],
          ['Language',  lead.language  ?? null],
          ['Created',   formatDate(lead.created_at)],
        ].filter(([, v]) => v).map(([label, value], i) => (
          <div key={String(label)} className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
            <p className="text-[13px]" style={{ color: 'rgba(60,60,67,0.50)' }}>{label}</p>
            <p className="text-[13px] font-medium" style={{ color: '#1C1C1E' }}>{value}</p>
          </div>
        ))}
        {lead.notes && (
          <div className="mx-4 mb-4 mt-1 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,149,0,0.08)' }}>
            <p className="text-[12px]" style={{ color: '#B86800' }}>{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href={`/admin/leads/${params.id}/edit`}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
          style={{ background: 'rgba(27,79,216,0.08)', color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
          </svg>
          Edit Lead
        </Link>
        {lead.stage !== 'ENROLLED' && (
          <Link href={`/admin/students/new?from_lead=${params.id}&name=${encodeURIComponent(lead.name)}&phone=${encodeURIComponent(lead.phone ?? '')}`}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold transition-all active:scale-[0.98]"
            style={{ background: 'rgba(52,199,89,0.10)', color: '#1E8A3C' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
            Convert to Student
          </Link>
        )}
      </div>

      {/* Stage pipeline */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
          Pipeline Stage
        </p>
        <form action={updateStageWithId} className="flex flex-wrap gap-2">
          {STAGES.map(s => {
            const st = STAGE_STYLE[s] ?? STAGE_STYLE.NO_ANSWER
            const active = lead.stage === s
            return (
              <button key={s} name="stage" value={s} type="submit"
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all active:scale-95"
                style={active
                  ? { background: st.bg, color: st.color }
                  : { background: 'rgba(120,120,128,0.08)', color: 'rgba(60,60,67,0.50)' }
                }>
                {s.replace(/_/g, ' ')}
              </button>
            )
          })}
        </form>
      </div>

      {/* Log interaction */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-4" style={{ color: 'rgba(60,60,67,0.45)' }}>
          Log Interaction
        </p>
        <form action={addInteractionWithId} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(['note', 'call', 'message', 'meeting'] as const).map(t => {
              const ts = TYPE_STYLE[t]
              return (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="type" value={t} defaultChecked={t === 'note'} className="sr-only" />
                  <span className="text-[12px] font-semibold px-3 py-1.5 rounded-full capitalize cursor-pointer"
                    style={{ background: ts.bg, color: ts.color }}>
                    {ts.icon} {t}
                  </span>
                </label>
              )
            })}
          </div>
          <textarea name="content" required rows={2}
            placeholder="What happened? e.g. Called, discussed enrollment…"
            className="w-full rounded-xl px-3 py-2.5 text-[14px] resize-none"
            style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
          <button type="submit"
            className="w-full rounded-xl py-3 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Log
          </button>
        </form>
      </div>

      {/* Interaction history */}
      {interactions && interactions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-3" style={{ color: 'rgba(60,60,67,0.45)' }}>
            History
          </p>
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)' }}>
            {interactions.map((item, i) => {
              const ts = TYPE_STYLE[item.type] ?? TYPE_STYLE.note
              return (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3.5"
                  style={{ borderTop: i > 0 ? '1px solid rgba(60,60,67,0.07)' : 'none' }}>
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-base"
                    style={{ background: ts.bg }}>
                    {ts.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px]" style={{ color: '#1C1C1E' }}>{item.content}</p>
                    <p className="text-[11px] mt-0.5 capitalize" style={{ color: 'rgba(60,60,67,0.45)' }}>
                      {item.type} · {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
