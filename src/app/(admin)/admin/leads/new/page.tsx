import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STAGES   = ['NEW', 'NO_ANSWER', 'CONTACTED', 'NURTURE', 'TRIAL_SCHEDULED', 'TRIAL_DONE', 'ENROLLED', 'LOST']
const SOURCES  = ['Instagram', 'Telegram', 'Referral', 'Walk-in', 'Website', 'Phone', 'Other']
const LANGUAGES = ['Uzbek', 'Russian', 'English']

async function createLead(formData: FormData) {
  'use server'
  const admin = createAdminClient()
  const { error, data } = await admin.from('leads').insert({
    name:          formData.get('name')          as string,
    phone:         (formData.get('phone')         as string) || null,
    stage:         (formData.get('stage')         as string) || 'NEW',
    temperature:   (formData.get('temperature')   as string) || null,
    source:        (formData.get('source')        as string) || null,
    language:      (formData.get('language')      as string) || null,
    grade:         (formData.get('grade')         as string) || null,
    school:        (formData.get('school')        as string) || null,
    current_score: formData.get('current_score') ? parseInt(formData.get('current_score') as string) : null,
    target_score:  formData.get('target_score')  ? parseInt(formData.get('target_score')  as string) : null,
    notes:         (formData.get('notes')         as string) || null,
  }).select('id').single()

  if (!error && data) redirect(`/admin/leads/${data.id}`)
  redirect('/admin/leads')
}

const INPUT = 'w-full rounded-xl px-3 py-2.5 text-[14px] bg-white'
const INPUT_STYLE = { border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }
const LABEL = 'block text-[12px] font-semibold mb-1.5'
const LABEL_STYLE = { color: 'rgba(60,60,67,0.55)' }

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="pt-1">
        <Link href="/admin/leads"
          className="inline-flex items-center gap-1 text-[13px] font-medium mb-3"
          style={{ color: '#1B4FD8' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Leads
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#1C1C1E' }}>New Lead</h1>
      </div>

      <form action={createLead} className="space-y-4">
        {/* Contact */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Contact Info</p>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Full Name *</label>
            <input name="name" required placeholder="e.g. Amir Karimov" className={INPUT} style={INPUT_STYLE} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Phone</label>
            <input name="phone" type="tel" placeholder="+998 90 000 00 00" className={INPUT} style={INPUT_STYLE} />
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Pipeline</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Stage</label>
              <select name="stage" defaultValue="NEW" className={INPUT} style={INPUT_STYLE}>
                {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Temperature</label>
              <select name="temperature" className={INPUT} style={INPUT_STYLE}>
                <option value="">—</option>
                <option value="HOT">🔥 Hot</option>
                <option value="WARM">🟡 Warm</option>
                <option value="COLD">❄️ Cold</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Source</label>
              <select name="source" className={INPUT} style={INPUT_STYLE}>
                <option value="">—</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Language</label>
              <select name="language" className={INPUT} style={INPUT_STYLE}>
                <option value="">—</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Academic */}
        <div className="bg-white rounded-2xl p-5 space-y-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'rgba(60,60,67,0.45)' }}>Academic Info</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Current Score</label>
              <input name="current_score" type="number" min="400" max="1600" placeholder="e.g. 1050" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Target Score</label>
              <input name="target_score" type="number" min="400" max="1600" placeholder="e.g. 1400" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>Grade</label>
              <input name="grade" placeholder="e.g. 11" className={INPUT} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL} style={LABEL_STYLE}>School</label>
              <input name="school" placeholder="School name" className={INPUT} style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <label className={`${LABEL} mb-2`} style={LABEL_STYLE}>Notes</label>
          <textarea name="notes" rows={3} placeholder="Any notes about this lead…"
            className="w-full rounded-xl px-3 py-2.5 text-[14px] resize-none"
            style={{ border: '1px solid rgba(60,60,67,0.15)', color: '#1C1C1E' }} />
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link href="/admin/leads"
            className="text-center py-3.5 rounded-2xl text-[14px] font-semibold"
            style={{ background: 'rgba(120,120,128,0.10)', color: 'rgba(60,60,67,0.65)' }}>
            Cancel
          </Link>
          <button type="submit"
            className="rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: '#1B4FD8' }}>
            Add Lead
          </button>
        </div>
      </form>
    </div>
  )
}
